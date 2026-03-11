import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    const barBg = this.add.rectangle(W / 2, H / 2 + 40, 400, 20, 0x333333).setDepth(10);
    const barFg = this.add.rectangle(W / 2 - 200, H / 2 + 40, 0, 20, 0x00ccff).setDepth(11).setOrigin(0, 0.5);
    this.add.text(W / 2, H / 2, 'LOADING...', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);

    barBg; // suppress unused warning

    this.load.on('progress', (v: number) => {
      barFg.setSize(400 * v, 20);
    });

    // characters
    this.load.image('char_soldier_blue', 'assets/characters/char_soldier_blue.png');
    this.load.image('char_enemy_minion_red', 'assets/characters/char_enemy_minion_red.png');
    this.load.image('char_enemy_boss_tank', 'assets/characters/char_enemy_boss_tank.png');
    this.load.image('char_enemy_boss_giant', 'assets/characters/char_enemy_boss_giant.png');

    // backgrounds
    this.load.image('bg_main', 'assets/backgrounds/bg_main.jpg');

    // icons
    this.load.image('icon_gate_plus', 'assets/icons/icon_gate_plus.png');
    this.load.image('icon_gate_minus', 'assets/icons/icon_gate_minus.png');
    this.load.image('icon_item_barrel', 'assets/icons/icon_item_barrel.png');
    this.load.image('icon_item_ak47', 'assets/icons/icon_item_ak47.png');
    this.load.image('icon_item_flamethrower', 'assets/icons/icon_item_flamethrower.png');

    // ui
    this.load.image('ui_health_bar', 'assets/ui/ui_health_bar.png');

    // vfx
    this.load.image('vfx_muzzle_flash', 'assets/vfx/vfx_muzzle_flash.png');
    this.load.image('vfx_shield', 'assets/vfx/vfx_shield.png');
  }

  create(): void {
    this.scene.start('HomeScene');
  }
}
