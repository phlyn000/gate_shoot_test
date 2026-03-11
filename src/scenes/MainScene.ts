import Phaser from 'phaser';
import { ProjectileUtils } from '../utils/ProjectileUtils';
import { AnimationHelper } from '../utils/AnimationHelper';

// ─── Types ───────────────────────────────────────────────────────────────────

type WeaponMode = 'normal' | 'ak47' | 'flamethrower';

interface Soldier {
  sprite: Phaser.GameObjects.Image;
}

interface GateData {
  type: 'plus' | 'minus' | 'multiply' | 'divide';
  value: number;
  passed: boolean;
}

interface BarrelData {
  hp: number;
  maxHp: number;
  hpBar: Phaser.GameObjects.Rectangle;
  hpBarBg: Phaser.GameObjects.Rectangle;
}

interface MinionData {
  hp: number;
  maxHp: number;
}

// world-space entity: stores worldY and actual game objects
interface WorldEntity {
  worldY: number;      // fixed world position (advances with scrollY)
  objects: Phaser.GameObjects.GameObject[];  // sprites/graphics to reposition each frame
  active: boolean;
}

interface GateEntity extends WorldEntity {
  kind: 'gate';
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  data: GateData;
  worldX: number;
}

interface BarrelEntity extends WorldEntity {
  kind: 'barrel';
  sprite: Phaser.GameObjects.Image;
  data: BarrelData;
  worldX: number;
}

interface MinionEntity extends WorldEntity {
  kind: 'minion';
  sprite: Phaser.GameObjects.Image;
  data: MinionData;
  worldX: number;
}

interface PickupEntity extends WorldEntity {
  kind: 'pickup';
  sprite: Phaser.GameObjects.Image;
  weaponType: WeaponMode;
  worldX: number;
}

type AnyEntity = GateEntity | BarrelEntity | MinionEntity | PickupEntity;

// ─── Constants ────────────────────────────────────────────────────────────────

const GAME_W = 720;
const GAME_H = 1280;
const SOLDIER_SIZE = 44;
const SOLDIER_SPACING = 52;
const SQUAD_Y = GAME_H * 0.78;  // screen Y of squad center (fixed)
const SCROLL_SPEED = 260;
const TOTAL_LEVEL_LENGTH = 12000;
const BULLET_SPEED = 680;
const FIRE_RATE_MS = 500;
const BULLET_DAMAGE = 1;
const BULLET_SIZE = 10;
const BOSS_SPAWN_WORLD_Y = TOTAL_LEVEL_LENGTH - 1600;

// ─── Scene ────────────────────────────────────────────────────────────────────

export class MainScene extends Phaser.Scene {
  // squad
  private soldiers: Soldier[] = [];
  private soldierCount = 1;
  private squadX = GAME_W / 2;

  // world scroll: scrollY = how many world units we've advanced
  private scrollY = 0;
  private bossSpawned = false;

  // entities (world-space objects)
  private entities: AnyEntity[] = [];
  private spawnedChunks: Set<number> = new Set();

  // bullets (screen-space, manual movement)
  private bullets: Array<{
    circle: Phaser.GameObjects.Arc;
    vx: number; vy: number;
    damage: number;
    life: number;
  }> = [];

  // boss
  private bossSprite?: Phaser.GameObjects.Image;
  private bossHp = 0;
  private bossMaxHp = 0;
  private bossHpBarFg?: Phaser.GameObjects.Rectangle;
  private bossHpText?: Phaser.GameObjects.Text;
  private bossAlive = false;
  private bossFallY = 0;   // screen Y of boss (starts above, falls down)

  // bg tiles
  private bgTile1!: Phaser.GameObjects.Image;
  private bgTile2!: Phaser.GameObjects.Image;

  // input
  private isDragging = false;
  private lastPointerX = 0;

  // UI
  private countText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Rectangle;

  // weapon
  private weaponMode: WeaponMode = 'normal';
  private weaponTimer = 0;
  private weaponText?: Phaser.GameObjects.Text;

  // fire
  private fireTimer = 0;

  // shield
  private shieldActive = false;
  private shieldSprite?: Phaser.GameObjects.Image;

  // game state
  private gameOver = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    this.gameOver = false;
    this.bossSpawned = false;
    this.scrollY = 0;
    this.soldierCount = 1;
    this.squadX = GAME_W / 2;
    this.soldiers = [];
    this.entities = [];
    this.bullets = [];
    this.spawnedChunks = new Set();
    this.weaponMode = 'normal';
    this.shieldActive = false;
    this.bossAlive = false;
    this.fireTimer = 0;

    this.setupBackground();
    this.spawnSoldier();
    this.rebuildSquadLayout();
    this.setupUI();
    this.setupInput();
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // ─── Setup ──────────────────────────────────────────────────────────────────

  private setupBackground(): void {
    if (this.textures.exists('bg_main')) {
      this.bgTile1 = this.add.image(GAME_W / 2, 0, 'bg_main')
        .setOrigin(0.5, 0).setDisplaySize(GAME_W, GAME_H).setDepth(0);
      this.bgTile2 = this.add.image(GAME_W / 2, -GAME_H, 'bg_main')
        .setOrigin(0.5, 0).setDisplaySize(GAME_W, GAME_H).setDepth(0);
    } else {
      const g = this.add.graphics().setDepth(0);
      g.fillStyle(0x2d6a2d, 1);
      g.fillRect(0, 0, GAME_W, GAME_H);
      // road
      g.fillStyle(0x555555, 1);
      g.fillRect(GAME_W * 0.15, 0, GAME_W * 0.7, GAME_H);
      // lane marks
      g.fillStyle(0xffffff, 0.3);
      for (let i = 0; i < 20; i++) {
        g.fillRect(GAME_W / 2 - 4, i * 130, 8, 70);
      }
      this.bgTile1 = this.add.image(0, 0, '__DEFAULT').setVisible(false);
      this.bgTile2 = this.add.image(0, 0, '__DEFAULT').setVisible(false);
    }
  }

  private setupUI(): void {
    const W = GAME_W;
    this.add.rectangle(W / 2, 28, W - 40, 18, 0x333333).setDepth(50);
    this.progressBar = this.add.rectangle(20, 28, 0, 14, 0x00ff88)
      .setDepth(51).setOrigin(0, 0.5);

    this.countText = this.add.text(W / 2, 58, `Total: ${this.soldierCount}`, {
      fontSize: '28px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(50);
  }

  private setupInput(): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.lastPointerX = p.x;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.gameOver) return;
      const dx = (p.x - this.lastPointerX) * 1.2;
      this.squadX = Phaser.Math.Clamp(this.squadX + dx, 80, GAME_W - 80);
      this.lastPointerX = p.x;
      this.rebuildSquadLayout();
    });
    this.input.on('pointerup', () => { this.isDragging = false; });
  }

  // ─── Squad ──────────────────────────────────────────────────────────────────

  private spawnSoldier(): Soldier {
    let sprite: Phaser.GameObjects.Image;
    if (this.textures.exists('char_soldier_blue')) {
      sprite = this.add.image(this.squadX, SQUAD_Y, 'char_soldier_blue')
        .setDisplaySize(SOLDIER_SIZE, SOLDIER_SIZE);
    } else {
      const g = this.add.graphics().setDepth(10);
      g.fillStyle(0x3399ff, 1);
      g.fillCircle(0, 0, SOLDIER_SIZE / 2);
      sprite = this.add.image(this.squadX, SQUAD_Y, '__DEFAULT').setAlpha(0);
      sprite.setData('gfx', g);
    }
    sprite.setDepth(10);
    const s: Soldier = { sprite };
    this.soldiers.push(s);
    return s;
  }

  private rebuildSquadLayout(): void {
    const n = this.soldiers.length;
    if (n === 0) return;
    const cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.5)));

    this.soldiers.forEach((s, i) => {
      const row = Math.floor(i / cols);
      const col = (i % cols) - Math.floor(cols / 2);
      const px = this.squadX + col * SOLDIER_SPACING;
      const py = SQUAD_Y + row * SOLDIER_SPACING;
      s.sprite.setPosition(px, py);
      const gfx = s.sprite.getData('gfx') as Phaser.GameObjects.Graphics | undefined;
      if (gfx) gfx.setPosition(px, py);
    });

    if (this.shieldSprite) this.shieldSprite.setPosition(this.squadX, SQUAD_Y);
  }

  private addSoldiers(amount: number): void {
    const toAdd = Math.min(amount, 200 - this.soldierCount);
    for (let i = 0; i < toAdd; i++) {
      this.soldierCount++;
      this.spawnSoldier();
    }
    this.rebuildSquadLayout();
    this.updateCountUI();
  }

  private removeSoldiers(amount: number): void {
    if (this.shieldActive) {
      this.shieldActive = false;
      this.shieldSprite?.setVisible(false);
      this.showFloatingText(this.squadX, SQUAD_Y - 80, 'SHIELD!', '#00ccff');
      return;
    }
    const toRemove = Math.min(amount, this.soldierCount);
    for (let i = 0; i < toRemove; i++) {
      const s = this.soldiers.pop();
      if (s) {
        AnimationHelper.flashOnce(this, s.sprite, 300);
        const gfx = s.sprite.getData('gfx') as Phaser.GameObjects.Graphics | undefined;
        this.time.delayedCall(300, () => { s.sprite.destroy(); gfx?.destroy(); });
      }
      this.soldierCount--;
    }
    this.updateCountUI();
    if (this.soldierCount <= 0) this.triggerGameOver();
  }

  private updateCountUI(): void {
    this.countText?.setText(`Total: ${this.soldierCount}`);
  }

  // ─── World entity helpers ──────────────────────────────────────────────────

  /**
   * Convert world Y coordinate to screen Y.
   * Objects at worldY == scrollY appear at SQUAD_Y (player position).
   * Objects further ahead (worldY > scrollY) are above squad on screen.
   */
  private worldToScreenY(worldY: number): number {
    return SQUAD_Y - (worldY - this.scrollY);
  }

  // ─── Spawning ──────────────────────────────────────────────────────────────

  private generateChunk(chunk: number): void {
    if (this.spawnedChunks.has(chunk)) return;
    this.spawnedChunks.add(chunk);

    // chunk size = 800 world units ≈ 3 s at SCROLL_SPEED 260
    const baseWorldY = chunk * 800 + 800;

    // gate pair at the start of the chunk
    this.createGates(baseWorldY);

    // barrels spread across the middle 400 units of the chunk
    const numBarrels = Phaser.Math.Between(2, 4);
    for (let i = 0; i < numBarrels; i++) {
      const bwY = baseWorldY + 200 + i * 80;
      const bx = Phaser.Math.Between(110, GAME_W - 110);
      this.createBarrel(bwY, bx);
    }

    // minions after chunk 2
    if (chunk >= 2 && Math.random() > 0.45) {
      const numMinions = Phaser.Math.Between(2, 5);
      for (let i = 0; i < numMinions; i++) {
        const mx = GAME_W * 0.15 + i * (GAME_W * 0.7 / Math.max(numMinions - 1, 1));
        this.createMinion(baseWorldY + 450, mx);
      }
    }

    // weapon pickup every 4 chunks
    if (chunk % 4 === 2) {
      this.createPickup(baseWorldY + 300, GAME_W / 2 + Phaser.Math.Between(-130, 130));
    }
  }

  private createGates(worldY: number): void {
    const isMultiply = Math.random() > 0.75;
    const leftPositive = Math.random() > 0.5;

    const makeGate = (worldX: number, positive: boolean) => {
      const type: GateData['type'] = positive
        ? (isMultiply ? 'multiply' : 'plus')
        : (isMultiply ? 'divide' : 'minus');

      const value = positive
        ? (isMultiply ? Phaser.Math.Between(2, 3) : Phaser.Math.Between(3, 15))
        : (isMultiply ? 2 : Phaser.Math.Between(1, 8));

      const labelStr = positive
        ? (type === 'multiply' ? `×${value}` : `+${value}`)
        : (type === 'divide'   ? `÷${value}` : `-${value}`);

      const screenY = this.worldToScreenY(worldY);
      const texKey = positive ? 'icon_gate_plus' : 'icon_gate_minus';

      let sprite: Phaser.GameObjects.Image;
      if (this.textures.exists(texKey)) {
        sprite = this.add.image(worldX, screenY, texKey).setDisplaySize(110, 170);
      } else {
        // draw a coloured rectangle as fallback
        const col = positive ? 0x1155ff : 0xff2222;
        const gfx = this.add.graphics().setDepth(5);
        gfx.fillStyle(col, 0.85);
        gfx.fillRoundedRect(-55, -85, 110, 170, 12);
        gfx.lineStyle(3, 0xffffff, 0.6);
        gfx.strokeRoundedRect(-55, -85, 110, 170, 12);
        gfx.setPosition(worldX, screenY);
        sprite = this.add.image(worldX, screenY, '__DEFAULT').setAlpha(0);
        sprite.setData('gfx', gfx);
      }
      sprite.setDepth(5);
      if (this.textures.exists(texKey)) {
        sprite.setTint(positive ? 0xaaddff : 0xffaaaa);
      }

      const label = this.add.text(worldX, screenY, labelStr, {
        fontSize: '40px', fontStyle: 'bold',
        color: '#ffffff', stroke: '#000000', strokeThickness: 6
      }).setOrigin(0.5).setDepth(6);

      const entity: GateEntity = {
        kind: 'gate',
        worldY,
        worldX,
        sprite,
        label,
        data: { type, value, passed: false },
        objects: [sprite, label],
        active: true
      };
      this.entities.push(entity);
    };

    makeGate(GAME_W * 0.25, leftPositive);
    makeGate(GAME_W * 0.75, !leftPositive);
  }

  private createBarrel(worldY: number, worldX: number): void {
    const screenY = this.worldToScreenY(worldY);
    const hp = Phaser.Math.Between(4, 20) + Math.floor(this.scrollY / 200);

    let sprite: Phaser.GameObjects.Image;
    if (this.textures.exists('icon_item_barrel')) {
      sprite = this.add.image(worldX, screenY, 'icon_item_barrel').setDisplaySize(58, 58);
    } else {
      const gfx = this.add.graphics().setDepth(5);
      gfx.fillStyle(0x8B4513, 1);
      gfx.fillCircle(0, 0, 29);
      gfx.lineStyle(4, 0x555555, 1);
      gfx.strokeCircle(0, 0, 29);
      gfx.setPosition(worldX, screenY);
      sprite = this.add.image(worldX, screenY, '__DEFAULT').setAlpha(0);
      sprite.setData('gfx', gfx);
    }
    sprite.setDepth(5);

    const hpBarBg = this.add.rectangle(worldX, screenY - 38, 58, 9, 0x333333).setDepth(6);
    const hpBar = this.add.rectangle(worldX - 29, screenY - 38, 58, 7, 0xff3333).setDepth(7).setOrigin(0, 0.5);

    const data: BarrelData = { hp, maxHp: hp, hpBar, hpBarBg };
    sprite.setData('barrelData', data);

    const entity: BarrelEntity = {
      kind: 'barrel',
      worldY, worldX,
      sprite, data,
      objects: [sprite, hpBarBg, hpBar],
      active: true
    };
    this.entities.push(entity);
  }

  private createMinion(worldY: number, worldX: number): void {
    const screenY = this.worldToScreenY(worldY);
    const hp = Phaser.Math.Between(3, 10);

    let sprite: Phaser.GameObjects.Image;
    if (this.textures.exists('char_enemy_minion_red')) {
      sprite = this.add.image(worldX, screenY, 'char_enemy_minion_red').setDisplaySize(66, 66);
    } else {
      const gfx = this.add.graphics().setDepth(5);
      gfx.fillStyle(0xff3333, 1);
      gfx.fillTriangle(-28, 28, 0, -28, 28, 28);
      gfx.setPosition(worldX, screenY);
      sprite = this.add.image(worldX, screenY, '__DEFAULT').setAlpha(0);
      sprite.setData('gfx', gfx);
    }
    sprite.setDepth(5);

    const entity: MinionEntity = {
      kind: 'minion',
      worldY, worldX,
      sprite,
      data: { hp, maxHp: hp },
      objects: [sprite],
      active: true
    };
    this.entities.push(entity);
  }

  private createPickup(worldY: number, worldX: number): void {
    const isAk47 = Math.random() > 0.5;
    const texKey = isAk47 ? 'icon_item_ak47' : 'icon_item_flamethrower';
    const screenY = this.worldToScreenY(worldY);
    const wType: WeaponMode = isAk47 ? 'ak47' : 'flamethrower';

    let sprite: Phaser.GameObjects.Image;
    if (this.textures.exists(texKey)) {
      sprite = this.add.image(worldX, screenY, texKey).setDisplaySize(54, 54);
    } else {
      const gfx = this.add.graphics().setDepth(5);
      gfx.fillStyle(isAk47 ? 0xffd700 : 0xff6600, 1);
      gfx.fillCircle(0, 0, 27);
      gfx.lineStyle(3, 0xffffff, 0.8);
      gfx.strokeCircle(0, 0, 27);
      gfx.setPosition(worldX, screenY);
      sprite = this.add.image(worldX, screenY, '__DEFAULT').setAlpha(0);
      sprite.setData('gfx', gfx);
    }
    sprite.setDepth(5);

    const entity: PickupEntity = {
      kind: 'pickup',
      worldY, worldX,
      sprite,
      weaponType: wType,
      objects: [sprite],
      active: true
    };
    this.entities.push(entity);
  }

  // ─── Boss ───────────────────────────────────────────────────────────────────

  private spawnBoss(): void {
    this.bossSpawned = true;
    this.bossFallY = -160;

    const isTank = Math.random() > 0.5;
    const texKey = isTank ? 'char_enemy_boss_tank' : 'char_enemy_boss_giant';
    this.bossMaxHp = Math.max(50, this.soldierCount * 15);
    this.bossHp = this.bossMaxHp;
    this.bossAlive = true;

    if (this.textures.exists(texKey)) {
      this.bossSprite = this.add.image(GAME_W / 2, this.bossFallY, texKey) as unknown as Phaser.GameObjects.Image;
      (this.bossSprite as unknown as Phaser.GameObjects.Image).setDisplaySize(220, 220);
    } else {
      const gfx = this.add.graphics().setDepth(8);
      gfx.fillStyle(0xcc0000, 1);
      gfx.fillCircle(0, 0, 110);
      gfx.lineStyle(6, 0xff6600, 1);
      gfx.strokeCircle(0, 0, 110);
      gfx.setPosition(GAME_W / 2, this.bossFallY);
      this.bossSprite = this.add.image(GAME_W / 2, this.bossFallY, '__DEFAULT').setAlpha(0) as unknown as Phaser.GameObjects.Image;
      this.bossSprite.setData('gfx', gfx);
    }
    (this.bossSprite as unknown as Phaser.GameObjects.Image).setDepth(8);

    // HP bar (fixed on screen)
    this.add.rectangle(GAME_W / 2, 340, 400, 24, 0x333333).setDepth(51);
    this.bossHpBarFg = this.add.rectangle(GAME_W / 2 - 200, 340, 400, 20, 0xff2222).setDepth(52).setOrigin(0, 0.5);
    this.bossHpText = this.add.text(GAME_W / 2, 340, `${this.bossHp}`, {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(53);

    this.add.text(GAME_W / 2, 315, 'BOSS', {
      fontSize: '20px', fontStyle: 'bold', color: '#ff4444', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(53);
  }

  private updateBoss(delta: number): void {
    if (!this.bossAlive || !this.bossSprite) return;

    const bossImg = this.bossSprite as unknown as Phaser.GameObjects.Image;
    const gfx = bossImg.getData('gfx') as Phaser.GameObjects.Graphics | undefined;

    // boss falls into screen, then hovers at Y=200
    const targetY = 200;
    if (this.bossFallY < targetY) {
      this.bossFallY += 120 * (delta / 1000);
    }
    const by = Math.min(this.bossFallY, targetY);
    bossImg.setPosition(GAME_W / 2, by);
    if (gfx) gfx.setPosition(GAME_W / 2, by);

    // check if boss reaches squad
    if (by > SQUAD_Y - 140) {
      this.removeSoldiers(Math.max(1, Math.ceil(this.soldierCount * 0.25)));
      this.bossFallY = 180;
    }
  }

  private damageBoss(dmg: number): void {
    if (!this.bossAlive) return;
    this.bossHp = Math.max(0, this.bossHp - dmg);

    const ratio = this.bossHp / this.bossMaxHp;
    this.bossHpBarFg?.setSize(400 * ratio, 20);
    this.bossHpText?.setText(`${this.bossHp}`);

    if (this.bossHp <= 0) {
      this.bossAlive = false;
      const bossImg = this.bossSprite as unknown as Phaser.GameObjects.Image;
      const gfx = bossImg?.getData('gfx') as Phaser.GameObjects.Graphics | undefined;
      this.tweens.add({
        targets: bossImg,
        alpha: 0, scaleX: 2.5, scaleY: 2.5,
        duration: 600,
        onComplete: () => { bossImg?.destroy(); gfx?.destroy(); }
      });
      if (gfx) this.tweens.add({ targets: gfx, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 600 });
      this.time.delayedCall(700, () => this.triggerVictory());
    }
  }

  // ─── Combat ─────────────────────────────────────────────────────────────────

  private fireAllSoldiers(): void {
    if (this.soldiers.length === 0) return;

    // find nearest visible target (on screen)
    let targetX = GAME_W / 2;
    let targetY = SQUAD_Y - 300;
    let minDist = Infinity;

    const checkTarget = (x: number, y: number) => {
      const d = Phaser.Math.Distance.Between(this.squadX, SQUAD_Y, x, y);
      if (d < minDist && y > -50 && y < SQUAD_Y - 20) {
        minDist = d;
        targetX = x;
        targetY = y;
      }
    };

    for (const e of this.entities) {
      if (!e.active) continue;
      const screenY = this.worldToScreenY(e.worldY);
      if (e.kind === 'barrel') checkTarget(e.worldX, screenY);
      else if (e.kind === 'minion') checkTarget(e.worldX, screenY);
    }
    if (this.bossAlive && this.bossSprite) {
      checkTarget(GAME_W / 2, this.bossFallY);
    }

    const fireCount = Math.min(this.soldierCount, 10);
    for (let i = 0; i < fireCount; i++) {
      const s = this.soldiers[i % this.soldiers.length];
      if (!s) continue;

      const ox = (Math.random() - 0.5) * 12;
      const oy = (Math.random() - 0.5) * 12;
      const sx = s.sprite.x;
      const sy = s.sprite.y - 18;
      const dx = targetX + ox - sx;
      const dy = targetY + oy - sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;

      const circle = this.add.circle(sx, sy, BULLET_SIZE, this.getBulletColor()).setDepth(15);
      this.bullets.push({
        circle,
        vx: (dx / len) * BULLET_SPEED,
        vy: (dy / len) * BULLET_SPEED,
        damage: this.getBulletDamage(),
        life: 1400
      });

      ProjectileUtils.spawnMuzzleFlash(this, sx, sy);
    }
  }

  private getBulletColor(): number {
    if (this.weaponMode === 'ak47') return 0xFFD700;
    if (this.weaponMode === 'flamethrower') return 0xFF6600;
    return 0x00eeff;
  }

  private getBulletDamage(): number {
    if (this.weaponMode === 'ak47') return BULLET_DAMAGE * 2;
    if (this.weaponMode === 'flamethrower') return BULLET_DAMAGE * 1.5;
    return BULLET_DAMAGE;
  }

  // ─── Gate apply ─────────────────────────────────────────────────────────────

  private applyGate(e: GateEntity): void {
    if (e.data.passed) return;
    e.data.passed = true;
    e.active = false;

    let delta = 0;
    let positive = false;

    switch (e.data.type) {
      case 'plus':    delta = e.data.value;                                               positive = true;  break;
      case 'minus':   delta = -e.data.value;                                              positive = false; break;
      case 'multiply':delta = this.soldierCount * (e.data.value - 1);                    positive = true;  break;
      case 'divide':  delta = -(this.soldierCount - Math.floor(this.soldierCount / e.data.value)); positive = false; break;
    }

    const color = positive ? '#00ff88' : '#ff4444';
    const prefix = positive && delta > 0 ? '+' : '';
    this.showFloatingText(e.worldX, this.worldToScreenY(e.worldY), `${prefix}${delta}`, color);

    if (delta > 0) this.addSoldiers(Math.round(delta));
    else if (delta < 0) this.removeSoldiers(Math.round(-delta));

    // flash + disappear
    this.tweens.add({
      targets: [e.sprite, e.label],
      alpha: 0, scaleX: 1.6, scaleY: 1.6,
      duration: 280,
      onComplete: () => {
        e.sprite.destroy();
        e.label.destroy();
        const gfx = e.sprite.getData('gfx') as Phaser.GameObjects.Graphics | undefined;
        gfx?.destroy();
      }
    });
  }

  private applyWeapon(type: WeaponMode): void {
    this.weaponMode = type;
    this.weaponTimer = type === 'ak47' ? 10000 : 8000;
    const label = type === 'ak47' ? 'AK47  x2 DMG' : '火焰扫射';
    this.weaponText?.destroy();
    this.weaponText = this.add.text(GAME_W / 2, 95, label, {
      fontSize: '22px', fontStyle: 'bold',
      color: type === 'ak47' ? '#FFD700' : '#FF6600',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(50);
    this.showFloatingText(this.squadX, SQUAD_Y - 110, label, type === 'ak47' ? '#FFD700' : '#FF6600');
  }

  // ─── Damage helpers ─────────────────────────────────────────────────────────

  private damageBarrel(e: BarrelEntity, dmg: number): void {
    e.data.hp -= dmg;
    const ratio = Math.max(0, e.data.hp / e.data.maxHp);
    e.data.hpBar.setSize(58 * ratio, 7);
    if (e.data.hp <= 0) {
      e.active = false;
      this.tweens.add({
        targets: [e.sprite, e.data.hpBar, e.data.hpBarBg],
        alpha: 0, scaleX: 1.4, scaleY: 1.4, duration: 220,
        onComplete: () => {
          e.sprite.destroy();
          e.data.hpBar.destroy();
          e.data.hpBarBg.destroy();
          const gfx = e.sprite.getData('gfx') as Phaser.GameObjects.Graphics | undefined;
          gfx?.destroy();
        }
      });
    }
  }

  private damageMinion(e: MinionEntity, dmg: number): void {
    e.data.hp -= dmg;
    if (e.data.hp <= 0) {
      e.active = false;
      this.tweens.add({
        targets: e.sprite,
        alpha: 0, y: e.sprite.y - 40, duration: 260,
        onComplete: () => {
          e.sprite.destroy();
          const gfx = e.sprite.getData('gfx') as Phaser.GameObjects.Graphics | undefined;
          gfx?.destroy();
        }
      });
    }
  }

  // ─── Game over / victory ───────────────────────────────────────────────────

  private triggerGameOver(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.cameras.main.shake(500, 0.02);
    this.time.delayedCall(400, () => this.showResultScreen(false));
  }

  private triggerVictory(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.cameras.main.flash(600, 255, 215, 0);
    this.time.delayedCall(400, () => this.showResultScreen(true));
  }

  private showResultScreen(isVictory: boolean): void {
    const W = GAME_W, H = GAME_H;
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setDepth(100);

    this.add.text(W / 2, H * 0.35, isVictory ? 'VICTORY!' : 'DEFEAT', {
      fontSize: '80px', fontStyle: 'bold',
      color: isVictory ? '#FFD700' : '#ff4444',
      stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5).setDepth(101);

    this.add.text(W / 2, H * 0.47, `连队人数: ${this.soldierCount}`, {
      fontSize: '34px', color: '#ffffff', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(101);

    const coins = isVictory ? this.soldierCount * 10 + 100 : Math.floor(this.soldierCount * 3);
    this.add.text(W / 2, H * 0.54, `金币: +${coins}`, {
      fontSize: '30px', color: '#FFD700', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(101);

    this.makeButton(W / 2, H * 0.65, '再玩一次', 0xF5A623, 0x8B3A00, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.restart());
    });
    this.makeButton(W / 2, H * 0.74, '返回首页', 0x4a7fc1, 0x003388, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('HomeScene'));
    });
  }

  private makeButton(cx: number, cy: number, text: string, fill: number, stroke: number, cb: () => void): void {
    const g = this.add.graphics().setDepth(101);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(cx - 130, cy - 30, 260, 60, 14);
    g.setInteractive(new Phaser.Geom.Rectangle(cx - 130, cy - 30, 260, 60), Phaser.Geom.Rectangle.Contains);
    g.on('pointerdown', cb);
    this.add.text(cx, cy, text, {
      fontSize: '30px', fontStyle: 'bold',
      color: '#ffffff', stroke: `#${stroke.toString(16).padStart(6, '0')}`, strokeThickness: 4
    }).setOrigin(0.5).setDepth(102);
  }

  // ─── Floating text ─────────────────────────────────────────────────────────

  private showFloatingText(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, {
      fontSize: '34px', fontStyle: 'bold',
      color, stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({
      targets: t, y: y - 90, alpha: 0, duration: 900, ease: 'Power2',
      onComplete: () => t.destroy()
    });
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (this.gameOver) return;
    const dt = delta / 1000;

    // advance world scroll
    this.scrollY += SCROLL_SPEED * dt;

    // scroll background
    const bgOff = this.scrollY % GAME_H;
    if (this.bgTile1.visible) {
      this.bgTile1.setY(bgOff);
      this.bgTile2.setY(bgOff - GAME_H);
    }

    // generate new chunks as we scroll forward
    const currentChunk = Math.floor(this.scrollY / 800);
    // pre-generate 2 chunks ahead
    for (let c = currentChunk; c <= currentChunk + 2; c++) {
      if (!this.spawnedChunks.has(c) && c * 800 < BOSS_SPAWN_WORLD_Y) {
        this.generateChunk(c);
      }
    }

    // reposition all world entities based on current scrollY
    this.updateEntityPositions();

    // collision: squad vs gates/pickups/minions
    this.checkSquadCollisions();

    // auto fire
    this.fireTimer += delta;
    const fireInterval = this.weaponMode === 'flamethrower' ? FIRE_RATE_MS * 0.55 : FIRE_RATE_MS;
    if (this.fireTimer >= fireInterval) {
      this.fireTimer = 0;
      this.fireAllSoldiers();
    }

    // update bullets
    this.updateBullets(delta);

    // bullet vs enemy collisions
    this.checkBulletCollisions();

    // weapon timer
    if (this.weaponMode !== 'normal') {
      this.weaponTimer -= delta;
      if (this.weaponTimer <= 0) {
        this.weaponMode = 'normal';
        this.weaponText?.destroy();
        this.weaponText = undefined;
      }
    }

    // boss
    if (!this.bossSpawned && this.scrollY >= BOSS_SPAWN_WORLD_Y) {
      this.spawnBoss();
    }
    if (this.bossSpawned) this.updateBoss(delta);

    // progress bar
    const progress = Math.min(this.scrollY / TOTAL_LEVEL_LENGTH, 1);
    this.progressBar.setSize((GAME_W - 40) * progress, 14);
  }

  private updateEntityPositions(): void {
    for (const e of this.entities) {
      if (!e.active) continue;
      const screenY = this.worldToScreenY(e.worldY);

      if (e.kind === 'gate') {
        e.sprite.setY(screenY);
        e.label.setY(screenY);
        const gfx = e.sprite.getData('gfx') as Phaser.GameObjects.Graphics | undefined;
        if (gfx) gfx.setY(screenY);
      } else if (e.kind === 'barrel') {
        e.sprite.setY(screenY);
        e.data.hpBarBg.setY(screenY - 38);
        e.data.hpBar.setY(screenY - 38);
        const gfx = e.sprite.getData('gfx') as Phaser.GameObjects.Graphics | undefined;
        if (gfx) gfx.setY(screenY);
      } else if (e.kind === 'minion') {
        e.sprite.setY(screenY);
        const gfx = e.sprite.getData('gfx') as Phaser.GameObjects.Graphics | undefined;
        if (gfx) gfx.setY(screenY);
      } else if (e.kind === 'pickup') {
        // add a gentle bob on top of scroll
        const bob = Math.sin(_bobTime(this) + e.worldX) * 7;
        e.sprite.setY(screenY + bob);
        const gfx = e.sprite.getData('gfx') as Phaser.GameObjects.Graphics | undefined;
        if (gfx) gfx.setY(screenY + bob);
      }

      // cull objects that have scrolled past (below screen)
      if (screenY > GAME_H + 120) {
        e.active = false;
      }
    }
  }

  private updateBullets(delta: number): void {
    const dt = delta / 1000;
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= delta;
      b.circle.x += b.vx * dt;
      b.circle.y += b.vy * dt;

      if (
        b.life <= 0 ||
        b.circle.x < -40 || b.circle.x > GAME_W + 40 ||
        b.circle.y < -40 || b.circle.y > GAME_H + 40
      ) {
        b.circle.destroy();
        this.bullets.splice(i, 1);
      }
    }
  }

  private checkBulletCollisions(): void {
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      if (!b.circle.active) continue;
      let hit = false;

      for (const e of this.entities) {
        if (!e.active) continue;
        const screenY = this.worldToScreenY(e.worldY);

        if (e.kind === 'barrel') {
          if (Phaser.Math.Distance.Between(b.circle.x, b.circle.y, e.worldX, screenY) < 34) {
            this.damageBarrel(e, b.damage);
            hit = true;
            break;
          }
        } else if (e.kind === 'minion') {
          if (Phaser.Math.Distance.Between(b.circle.x, b.circle.y, e.worldX, screenY) < 38) {
            this.damageMinion(e, b.damage);
            hit = true;
            break;
          }
        }
      }

      if (!hit && this.bossAlive && this.bossSprite) {
        if (Phaser.Math.Distance.Between(b.circle.x, b.circle.y, GAME_W / 2, this.bossFallY) < 115) {
          this.damageBoss(b.damage);
          hit = true;
        }
      }

      if (hit) {
        b.circle.destroy();
        this.bullets.splice(bi, 1);
      }
    }
  }

  private checkSquadCollisions(): void {
    const sx0 = this.squadX - 100;
    const sx1 = this.squadX + 100;
    const sy0 = SQUAD_Y - 50;
    const sy1 = SQUAD_Y + 80;

    for (const e of this.entities) {
      if (!e.active) continue;
      const screenY = this.worldToScreenY(e.worldY);
      if (e.worldX < sx0 - 30 || e.worldX > sx1 + 30) continue;
      if (screenY < sy0 - 40 || screenY > sy1 + 40) continue;

      if (e.kind === 'gate') {
        if (!e.data.passed && e.worldX > sx0 && e.worldX < sx1 && screenY > sy0 && screenY < sy1) {
          this.applyGate(e);
        }
      } else if (e.kind === 'minion') {
        if (screenY > sy0 && screenY < sy1) {
          this.removeSoldiers(1);
          e.active = false;
          this.tweens.add({
            targets: e.sprite, alpha: 0, y: e.sprite.y - 30, duration: 220,
            onComplete: () => {
              e.sprite.destroy();
              const gfx = e.sprite.getData('gfx') as Phaser.GameObjects.Graphics | undefined;
              gfx?.destroy();
            }
          });
        }
      } else if (e.kind === 'pickup') {
        if (screenY > sy0 && screenY < sy1) {
          e.active = false;
          this.applyWeapon(e.weaponType);
          this.tweens.add({
            targets: e.sprite, alpha: 0, scaleX: 1.8, scaleY: 1.8, duration: 300,
            onComplete: () => {
              e.sprite.destroy();
              const gfx = e.sprite.getData('gfx') as Phaser.GameObjects.Graphics | undefined;
              gfx?.destroy();
            }
          });
        }
      }
    }
  }
}

// module-level time accumulator for bob animation (avoids storing on scene)
let _bobAccum = 0;
function _bobTime(scene: MainScene): number {
  // We can't easily access scene time here without passing it;
  // use a simple incrementing value driven externally
  void scene;
  _bobAccum += 0.016;
  return _bobAccum;
}
