import Phaser from 'phaser';

export class AnimationHelper {
  static floatUpDown(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, amplitude = 8, duration = 1200): Phaser.Tweens.Tween {
    const obj = target as Phaser.GameObjects.Image;
    return scene.tweens.add({
      targets: obj,
      y: obj.y - amplitude,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  static pulse(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, scaleTo = 1.15, duration = 600): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: target,
      scaleX: scaleTo,
      scaleY: scaleTo,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  static flashOnce(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, duration = 200): void {
    scene.tweens.add({
      targets: target,
      alpha: 0,
      duration: duration / 2,
      yoyo: true,
      repeat: 1,
      ease: 'Linear'
    });
  }

  static popIn(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, fromScale = 0, duration = 300): Phaser.Tweens.Tween {
    const obj = target as Phaser.GameObjects.Image;
    obj.setScale(fromScale);
    return scene.tweens.add({
      targets: obj,
      scaleX: 1,
      scaleY: 1,
      duration,
      ease: 'Back.easeOut'
    });
  }

  static shakeOnce(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, intensity = 5, duration = 300): void {
    const obj = target as Phaser.GameObjects.Image;
    const originX = obj.x;
    scene.tweens.add({
      targets: obj,
      x: originX + intensity,
      duration: duration / 4,
      yoyo: true,
      repeat: 3,
      ease: 'Linear',
      onComplete: () => { obj.x = originX; }
    });
  }

  static fadeIn(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, duration = 400): Phaser.Tweens.Tween {
    const obj = target as Phaser.GameObjects.Image;
    obj.setAlpha(0);
    return scene.tweens.add({
      targets: obj,
      alpha: 1,
      duration,
      ease: 'Linear'
    });
  }
}
