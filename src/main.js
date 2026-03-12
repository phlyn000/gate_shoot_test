"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = require("phaser");
var BootScene_1 = require("./scenes/BootScene");
var HomeScene_1 = require("./scenes/HomeScene");
var MainScene_1 = require("./scenes/MainScene");
var config = {
    type: phaser_1.default.AUTO,
    width: 720,
    height: 1280,
    backgroundColor: '#0a1628',
    parent: document.body,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [BootScene_1.BootScene, HomeScene_1.HomeScene, MainScene_1.MainScene],
    scale: {
        mode: phaser_1.default.Scale.FIT,
        autoCenter: phaser_1.default.Scale.CENTER_BOTH
    }
};
new phaser_1.default.Game(config);
