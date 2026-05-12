import Phaser from 'phaser';
import { GameState } from '../main';

export default class BaseScene extends Phaser.Scene {
    constructor() {
        super('BaseScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#202020');

        this.add.text(400, 50, `Base Phase - Wave ${GameState.waveNumber}`, { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);
        this.resText = this.add.text(400, 100, `Resources: ${GameState.resources}`, { fontSize: '24px', fill: '#ffd700' }).setOrigin(0.5);
        this.baseHpText = this.add.text(400, 130, `Base HP: ${GameState.baseHealth} / ${GameState.maxBaseHealth}`, { fontSize: '24px', fill: '#00ff00' }).setOrigin(0.5);

        let startY = 200;

        // Buy Units
        this.add.text(100, startY, 'Recruit Units (Cost: 10 Res)', { fontSize: '20px', fill: '#aaa' });

        this.createButton(100, startY + 40, 'Recruit Defender', () => this.buyUnit('defender', 10, { hp: 30, maxHp: 30, dmg: 3, moveRange: 2, attackRange: 1, init: 3, type: 'defender' }));
        this.createButton(100, startY + 90, 'Recruit Artillery', () => this.buyUnit('artillery', 15, { hp: 15, maxHp: 15, dmg: 8, moveRange: 1, attackRange: 4, init: 2, type: 'artillery' }));
        this.createButton(100, startY + 140, 'Recruit Berserker', () => this.buyUnit('berserker', 12, { hp: 20, maxHp: 20, dmg: 6, moveRange: 4, attackRange: 1, init: 6, type: 'berserker' }));

        // Buy Upgrades
        this.add.text(450, startY, 'Mining Upgrades', { fontSize: '20px', fill: '#aaa' });

        this.createButton(450, startY + 40, 'Max AP +5 (Cost: 15 Res)', () => this.buyUpgrade('maxAP', 5, 15));

        if (!GameState.hasSonar) {
             this.sonarBtn = this.createButton(450, startY + 90, 'Buy Sonar (Cost: 20 Res)', () => {
                 if (this.buyUpgrade('hasSonar', true, 20)) {
                     this.sonarBtn.destroy();
                 }
             });
        }

        this.createButton(450, startY + 140, 'Heal Base +20 (Cost: 10 Res)', () => {
            if (GameState.resources >= 10 && GameState.baseHealth < GameState.maxBaseHealth) {
                GameState.resources -= 10;
                GameState.baseHealth = Math.min(GameState.maxBaseHealth, GameState.baseHealth + 20);
                this.updateUI();
            }
        });

        // Next Phase
        this.createButton(400, 500, 'START COMBAT WAVE', () => {
             this.scene.start('CombatScene');
        }, '#ff0000').setOrigin(0.5);
    }

    createButton(x, y, text, onClick, color = '#333333') {
        let btnText = this.add.text(x, y, text, { fontSize: '18px', fill: '#fff', backgroundColor: color, padding: { x: 10, y: 10 } });
        btnText.setInteractive({ useHandCursor: true });
        btnText.on('pointerdown', onClick);
        return btnText;
    }

    buyUnit(name, cost, stats) {
        if (GameState.resources >= cost) {
            GameState.resources -= cost;
            // Provide a unique ID for combat logic
            stats.id = Math.random().toString(36).substr(2, 9);
            GameState.units.push(stats);
            this.updateUI();
        }
    }

    buyUpgrade(prop, value, cost) {
        if (GameState.resources >= cost) {
            GameState.resources -= cost;
            if (typeof value === 'number') {
                GameState[prop] += value;
            } else {
                GameState[prop] = value;
            }
            this.updateUI();
            return true;
        }
        return false;
    }

    updateUI() {
        this.resText.setText(`Resources: ${GameState.resources}`);
        this.baseHpText.setText(`Base HP: ${GameState.baseHealth} / ${GameState.maxBaseHealth}`);
    }
}