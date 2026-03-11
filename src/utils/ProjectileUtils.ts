import Phaser from 'phaser';

export interface ProjectileConfig {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  texture: string;
  scale?: number;
  tint?: number;
}

export class ProjectileUtils {
  static fire(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.Group,
    cfg: ProjectileConfig
  ): Phaser.Physics.Arcade.Image {
    const bullet = group.get(cfg.x, cfg.y, cfg.texture) as Phaser.Physics.Arcade.Image;
    if (!bullet) {
      const b = scene.physics.add.image(cfg.x, cfg.y, cfg.texture);
      b.setData('damage', cfg.damage);
      b.setActive(true).setVisible(true);
      if (cfg.scale !== undefined) b.setScale(cfg.scale);
      if (cfg.tint !== undefined) b.setTint(cfg.tint);
      ProjectileUtils.setVelocityToward(b, cfg.targetX, cfg.targetY, cfg.speed);
      return b;
    }
    bullet.setPosition(cfg.x, cfg.y);
    bullet.setActive(true).setVisible(true);
    bullet.setData('damage', cfg.damage);
    if (cfg.scale !== undefined) bullet.setScale(cfg.scale);
    if (cfg.tint !== undefined) bullet.setTint(cfg.tint);
    ProjectileUtils.setVelocityToward(bullet, cfg.targetX, cfg.targetY, cfg.speed);
    return bullet;
  }

  static setVelocityToward(
    obj: Phaser.Physics.Arcade.Image,
    tx: number,
    ty: number,
    speed: number
  ): void {
    const dx = tx - obj.x;
    const dy = ty - obj.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    obj.setVelocity((dx / len) * speed, (dy / len) * speed);
    obj.setRotation(Math.atan2(dy, dx));
  }

  static spawnMuzzleFlash(scene: Phaser.Scene, x: number, y: number): void {
    if (!scene.textures.exists('vfx_muzzle_flash')) return;
    const flash = scene.add.image(x, y, 'vfx_muzzle_flash');
    flash.setScale(0.08).setDepth(20);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 0.15,
      scaleY: 0.15,
      duration: 150,
      ease: 'Linear',
      onComplete: () => flash.destroy()
    });
  }

  static recycleOutOfBounds(
    group: Phaser.Physics.Arcade.Group,
    bounds: Phaser.Geom.Rectangle
  ): void {
    group.getChildren().forEach((child) => {
      const img = child as Phaser.Physics.Arcade.Image;
      if (!img.active) return;
      if (
        img.x < bounds.left - 50 ||
        img.x > bounds.right + 50 ||
        img.y < bounds.top - 50 ||
        img.y > bounds.bottom + 50
      ) {
        img.setActive(false).setVisible(false);
        img.setVelocity(0, 0);
      }
    });
  }
}
