import Phaser from 'phaser';
import { AnimationHelper } from '../utils/AnimationHelper';

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    // background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a1628, 0x0a1628, 0x1a3a6e, 0x1a3a6e, 1);
    bg.fillRect(0, 0, W, H);

    // ground road stripes decorative
    for (let i = 0; i < 8; i++) {
      const stripe = this.add.rectangle(W / 2, H * 0.55 + i * 90, 30, 50, 0xffffff, 0.15);
      stripe.setRotation(0);
    }

    // title glow background
    const titleGlow = this.add.rectangle(W / 2, 220, 560, 120, 0x0055ff, 0.2);
    titleGlow.setStrokeStyle(2, 0x00aaff, 0.6);

    // title text
    const title1 = this.add.text(W / 2, 190, 'LAST WAR', {
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 8, fill: true }
    }).setOrigin(0.5);

    const title2 = this.add.text(W / 2, 255, 'ACE CORPS', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#004488',
      strokeThickness: 4,
      letterSpacing: 8
    }).setOrigin(0.5);

    titleGlow; title1; title2;

    // soldier character
    let soldier: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
    if (this.textures.exists('char_soldier_blue')) {
      soldier = this.add.image(W / 2, H * 0.52, 'char_soldier_blue');
      (soldier as Phaser.GameObjects.Image).setDisplaySize(200, 200);
    } else {
      soldier = this.add.rectangle(W / 2, H * 0.52, 80, 120, 0x3399ff);
    }
    AnimationHelper.floatUpDown(this, soldier, 10, 1400);

    // star decorations
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(20, W - 20);
      const y = Phaser.Math.Between(50, H * 0.35);
      const size = Phaser.Math.FloatBetween(1, 3);
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1000)
      });
    }

    // start button
    const btnY = H * 0.78;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xF5A623, 1);
    btnBg.fillRoundedRect(W / 2 - 160, btnY - 38, 320, 76, 20);
    btnBg.fillStyle(0xFF7B00, 1);
    btnBg.fillRoundedRect(W / 2 - 160, btnY + 10, 320, 28, { bl: 20, br: 20, tl: 0, tr: 0 });
    btnBg.setInteractive(new Phaser.Geom.Rectangle(W / 2 - 160, btnY - 38, 320, 76), Phaser.Geom.Rectangle.Contains);

    const btnText = this.add.text(W / 2, btnY, '开始游戏', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#8B3A00',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5);

    AnimationHelper.pulse(this, btnBg, 1.03, 800);

    btnBg.on('pointerover', () => {
      btnText.setColor('#FFE066');
      this.input.setDefaultCursor('pointer');
    });
    btnBg.on('pointerout', () => {
      btnText.setColor('#ffffff');
      this.input.setDefaultCursor('default');
    });
    btnBg.on('pointerdown', () => {
      this.cameras.main.zoomTo(1.3, 400, 'Linear', false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) {
          this.scene.start('MainScene');
        }
      });
    });

    // settings button
    const settingsBtn = this.add.text(60, H - 80, '⚙', {
      fontSize: '40px',
      color: '#aaaaaa'
    }).setOrigin(0.5).setInteractive();
    settingsBtn.on('pointerdown', () => {
      // placeholder
    });

    // shop button
    const shopBtn = this.add.text(W - 60, H - 80, '🛒', {
      fontSize: '40px',
      color: '#aaaaaa'
    }).setOrigin(0.5).setInteractive();
    shopBtn.on('pointerdown', () => {
      // placeholder
    });

    settingsBtn; shopBtn;

    // version tag
    this.add.text(W / 2, H - 30, 'v1.0.0', {
      fontSize: '16px',
      color: '#555555'
    }).setOrigin(0.5);

    // camera fade in
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }
}
