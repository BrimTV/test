import Phaser from 'phaser';
import { GameState } from '../main';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Here we could load some base assets if needed
    }

    create() {
        this.add.text(400, 300, 'Loading...', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);

        // Setup initial units
        GameState.units = [
            { type: 'miner', hp: 20, maxHp: 20, dmg: 5, moveRange: 3, attackRange: 1, init: 5 }
        ];

        // Start the game with the Mining phase
        this.time.delayedCall(1000, () => {
            this.scene.start('MiningScene');
        });
    }
}
