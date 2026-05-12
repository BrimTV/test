import Phaser from 'phaser';
import { GameState } from '../main';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#3a0000');

        this.add.text(400, 200, 'GAME OVER', { fontSize: '64px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 280, `Waves Survived: ${GameState.waveNumber - 1}`, { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);

        let restartBtn = this.add.text(400, 400, 'Try Again', { fontSize: '32px', fill: '#00ff00', backgroundColor: '#222', padding: {x: 20, y: 10} })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => {
            // Reset state
            GameState.resources = 0;
            GameState.currency = 0;
            GameState.waveNumber = 1;
            GameState.baseHealth = 100;
            GameState.maxBaseHealth = 100;
            GameState.maxAP = 30;
            GameState.miningPower = 1;
            GameState.hasSonar = false;
            GameState.units = [
                { type: 'miner', hp: 20, maxHp: 20, dmg: 5, moveRange: 3, attackRange: 1, init: 5, id: 'start_m' }
            ];
            GameState.miningBoardState = null;

            this.scene.start('MiningScene');
        });
    }
}