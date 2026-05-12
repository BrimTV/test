import Phaser from 'phaser';
import { GameState } from '../main';

const GRID_SIZE = 50;
const COLS = 12;
const ROWS = 8;
const OFFSET_X = (800 - COLS * GRID_SIZE) / 2;
const OFFSET_Y = 100;

export default class CombatScene extends Phaser.Scene {
    constructor() {
        super('CombatScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a2639');

        this.phase = 'deployment'; // deployment, combat
        this.board = []; // 2D array [y][x] to store entities
        for (let y = 0; y < ROWS; y++) {
            this.board[y] = new Array(COLS).fill(null);
        }

        this.entities = []; // all combat units

        this.drawGrid();

        this.setupEnemies();
        this.setupDeploymentUI();

        this.infoText = this.add.text(400, 20, 'Deployment Phase: Click left side to place units', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.turnText = this.add.text(400, 60, '', { fontSize: '20px', fill: '#ff0' }).setOrigin(0.5);
    }

    drawGrid() {
        this.gridGraphics = this.add.graphics();
        this.gridGraphics.lineStyle(1, 0x444444, 0.5);

        for (let y = 0; y <= ROWS; y++) {
            this.gridGraphics.moveTo(OFFSET_X, OFFSET_Y + y * GRID_SIZE);
            this.gridGraphics.lineTo(OFFSET_X + COLS * GRID_SIZE, OFFSET_Y + y * GRID_SIZE);
        }
        for (let x = 0; x <= COLS; x++) {
            this.gridGraphics.moveTo(OFFSET_X + x * GRID_SIZE, OFFSET_Y);
            this.gridGraphics.lineTo(OFFSET_X + x * GRID_SIZE, OFFSET_Y + ROWS * GRID_SIZE);
        }
        this.gridGraphics.strokePath();

        // Base protection zone (visual only)
        this.add.rectangle(OFFSET_X - 10, OFFSET_Y + (ROWS * GRID_SIZE) / 2, 20, ROWS * GRID_SIZE, 0x00ff00, 0.2).setOrigin(1, 0.5);

        // Interactive zone
        this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));
    }

    setupEnemies() {
        // Spawn enemies on the right side based on wave
        const enemyCount = 2 + Math.floor(GameState.waveNumber / 2);
        for(let i=0; i<enemyCount; i++) {
            let placed = false;
            while(!placed) {
                let ex = COLS - 1 - Math.floor(Math.random() * 3); // Rightmost 3 columns
                let ey = Math.floor(Math.random() * ROWS);
                if (!this.board[ey][ex]) {
                    this.spawnEntity(ex, ey, {
                        type: 'enemy',
                        hp: 15 + GameState.waveNumber * 5,
                        maxHp: 15 + GameState.waveNumber * 5,
                        dmg: 4 + GameState.waveNumber,
                        moveRange: 2,
                        attackRange: 1,
                        init: Math.floor(Math.random() * 4) + 1,
                        isEnemy: true,
                        id: 'e_' + Math.random().toString(36).substr(2, 9)
                    });
                    placed = true;
                }
            }
        }
    }

    setupDeploymentUI() {
        this.unplacedUnits = [...GameState.units];
        this.updateDeploymentText();

        this.startCombatBtn = this.add.text(400, 550, 'Start Combat', { fontSize: '24px', fill: '#0f0', backgroundColor: '#333', padding: { x: 10, y: 10 } })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                if (this.phase === 'deployment') {
                    this.startCombat();
                }
            });
    }

    updateDeploymentText() {
        if (this.deploymentText) this.deploymentText.destroy();
        if (this.unplacedUnits.length > 0) {
            let nextUnit = this.unplacedUnits[0];
            this.deploymentText = this.add.text(400, 500, `To place: ${nextUnit.type.toUpperCase()} (HP:${nextUnit.hp} DMG:${nextUnit.dmg})`, { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);
        } else {
            this.deploymentText = this.add.text(400, 500, 'All units placed.', { fontSize: '20px', fill: '#aaa' }).setOrigin(0.5);
        }
    }

    spawnEntity(cx, cy, stats) {
        let color = stats.isEnemy ? 0xff0000 : 0x00aaff;
        if (stats.type === 'defender') color = 0x55aaff;
        if (stats.type === 'artillery') color = 0xaaff55;
        if (stats.type === 'berserker') color = 0xffaa00;

        let sprite = this.add.rectangle(
            OFFSET_X + cx * GRID_SIZE + GRID_SIZE / 2,
            OFFSET_Y + cy * GRID_SIZE + GRID_SIZE / 2,
            GRID_SIZE * 0.8,
            GRID_SIZE * 0.8,
            color
        );

        let hpText = this.add.text(
            OFFSET_X + cx * GRID_SIZE + GRID_SIZE / 2,
            OFFSET_Y + cy * GRID_SIZE + GRID_SIZE / 2,
            stats.hp,
            { fontSize: '16px', fill: '#fff' }
        ).setOrigin(0.5);

        let entity = { ...stats, cx, cy, sprite, hpText };
        this.entities.push(entity);
        this.board[cy][cx] = entity;
        return entity;
    }

    handlePointerDown(pointer) {
        let cx = Math.floor((pointer.x - OFFSET_X) / GRID_SIZE);
        let cy = Math.floor((pointer.y - OFFSET_Y) / GRID_SIZE);

        if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return;

        if (this.phase === 'deployment') {
            if (cx > 3) return; // Can only deploy in first 4 columns
            if (this.board[cy][cx]) return; // Tile occupied

            if (this.unplacedUnits.length > 0) {
                let unit = this.unplacedUnits.shift();
                unit.isEnemy = false;
                this.spawnEntity(cx, cy, unit);
                this.updateDeploymentText();
            }
        } else if (this.phase === 'combat' && this.activeEntity && !this.activeEntity.isEnemy) {
            this.processPlayerAction(cx, cy);
        }
    }

    startCombat() {
        this.phase = 'combat';
        this.startCombatBtn.destroy();
        if (this.deploymentText) this.deploymentText.destroy();
        this.infoText.setText('Combat Phase');

        // Sort by initiative
        this.entities.sort((a, b) => b.init - a.init);
        this.turnIndex = 0;
        this.nextTurn();
    }

    nextTurn() {
        // Check win/loss conditions
        let playerUnits = this.entities.filter(e => !e.isEnemy);
        let enemies = this.entities.filter(e => e.isEnemy);

        if (enemies.length === 0) {
            this.winWave();
            return;
        }
        if (playerUnits.length === 0 && GameState.baseHealth <= 0) {
            this.scene.start('GameOverScene');
            return;
        }

        if (this.turnIndex >= this.entities.length) {
            this.turnIndex = 0;
            this.entities.sort((a, b) => b.init - a.init); // resort in case of buffs/debuffs
        }

        this.activeEntity = this.entities[this.turnIndex];

        this.highlightActive();

        if (this.activeEntity.isEnemy) {
            this.turnText.setText('Enemy Turn');
            this.time.delayedCall(500, () => this.processEnemyAI());
        } else {
            this.turnText.setText('Your Turn: Select move/attack target');
            // Wait for player input via pointerdown
        }
    }

    highlightActive() {
        if (this.highlightRect) this.highlightRect.destroy();
        this.highlightRect = this.add.rectangle(
            OFFSET_X + this.activeEntity.cx * GRID_SIZE + GRID_SIZE / 2,
            OFFSET_Y + this.activeEntity.cy * GRID_SIZE + GRID_SIZE / 2,
            GRID_SIZE,
            GRID_SIZE,
            0xffffff,
            0.3
        );
    }

    dist(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2); // Manhattan distance
    }

    processPlayerAction(cx, cy) {
        let targetEntity = this.board[cy][cx];
        let distance = this.dist(this.activeEntity.cx, this.activeEntity.cy, cx, cy);

        if (targetEntity && targetEntity.isEnemy) {
            // Attack
            if (distance <= this.activeEntity.attackRange) {
                this.attack(this.activeEntity, targetEntity);
                this.endTurn();
            }
        } else if (!targetEntity) {
            // Move
            if (distance <= this.activeEntity.moveRange) {
                this.moveEntity(this.activeEntity, cx, cy);
                this.endTurn();
            }
        }
    }

    processEnemyAI() {
        // Simple AI: find closest player unit or base
        let target = null;
        let minD = Infinity;

        // Find closest player unit
        this.entities.filter(e => !e.isEnemy).forEach(p => {
            let d = this.dist(this.activeEntity.cx, this.activeEntity.cy, p.cx, p.cy);
            if (d < minD) {
                minD = d;
                target = p;
            }
        });

        if (target) {
            if (minD <= this.activeEntity.attackRange) {
                this.attack(this.activeEntity, target);
            } else {
                // Move towards target
                let dx = Math.sign(target.cx - this.activeEntity.cx);
                let dy = Math.sign(target.cy - this.activeEntity.cy);

                let nx = this.activeEntity.cx;
                let ny = this.activeEntity.cy;

                // Try moving closer, respecting moveRange
                let movesLeft = this.activeEntity.moveRange;
                while (movesLeft > 0) {
                    let testDx = target.cx > nx ? 1 : (target.cx < nx ? -1 : 0);
                    let testDy = target.cy > ny ? 1 : (target.cy < ny ? -1 : 0);

                    if (testDx !== 0 && !this.board[ny][nx + testDx]) {
                        nx += testDx;
                    } else if (testDy !== 0 && !this.board[ny + testDy]?.[nx]) {
                        ny += testDy;
                    } else {
                        break; // blocked
                    }
                    movesLeft--;
                    if (this.dist(nx, ny, target.cx, target.cy) <= this.activeEntity.attackRange) {
                        break;
                    }
                }

                if (nx !== this.activeEntity.cx || ny !== this.activeEntity.cy) {
                    this.moveEntity(this.activeEntity, nx, ny);
                    // Attack after move if possible
                    if (this.dist(nx, ny, target.cx, target.cy) <= this.activeEntity.attackRange) {
                         this.attack(this.activeEntity, target);
                    }
                }
            }
        } else {
            // No player units, move left and attack base
            if (this.activeEntity.cx > 0 && !this.board[this.activeEntity.cy][this.activeEntity.cx - 1]) {
                this.moveEntity(this.activeEntity, this.activeEntity.cx - 1, this.activeEntity.cy);
            } else if (this.activeEntity.cx === 0) {
                GameState.baseHealth -= this.activeEntity.dmg;
                if (GameState.baseHealth <= 0) {
                    this.scene.start('GameOverScene');
                    return;
                }
            }
        }

        this.endTurn();
    }

    moveEntity(entity, nx, ny) {
        this.board[entity.cy][entity.cx] = null;
        entity.cx = nx;
        entity.cy = ny;
        this.board[ny][nx] = entity;

        entity.sprite.setPosition(
            OFFSET_X + nx * GRID_SIZE + GRID_SIZE / 2,
            OFFSET_Y + ny * GRID_SIZE + GRID_SIZE / 2
        );
        entity.hpText.setPosition(
            OFFSET_X + nx * GRID_SIZE + GRID_SIZE / 2,
            OFFSET_Y + ny * GRID_SIZE + GRID_SIZE / 2
        );
    }

    attack(attacker, defender) {
        defender.hp -= attacker.dmg;
        defender.hpText.setText(defender.hp);

        // Show floating damage
        let floatText = this.add.text(
            defender.sprite.x,
            defender.sprite.y - 20,
            `-${attacker.dmg}`,
            { fontSize: '20px', fill: '#ff0000', fontStyle: 'bold' }
        ).setOrigin(0.5);
        this.tweens.add({
            targets: floatText,
            y: floatText.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => floatText.destroy()
        });

        if (defender.hp <= 0) {
            this.killEntity(defender);
            if (attacker.type === 'berserker') {
                // Berserker trait: bonus action (don't increment turnIndex, effectively taking another turn)
                this.turnIndex--;
            }
        }
    }

    killEntity(entity) {
        this.board[entity.cy][entity.cx] = null;
        entity.sprite.destroy();
        entity.hpText.destroy();

        let idx = this.entities.indexOf(entity);
        if (idx !== -1) {
            this.entities.splice(idx, 1);
            if (idx < this.turnIndex) {
                this.turnIndex--; // Adjust turn index because array shifted
            }
        }

        // Remove from GameState units if it was a player unit
        if (!entity.isEnemy) {
            GameState.units = GameState.units.filter(u => u.id !== entity.id);
        }
    }

    endTurn() {
        this.turnIndex++;
        this.time.delayedCall(300, () => this.nextTurn());
    }

    winWave() {
        this.infoText.setText('Wave Cleared!');
        this.turnText.setText('');
        GameState.waveNumber++;
        GameState.maxBaseHealth += 10; // Free base max HP on wave clear

        this.time.delayedCall(2000, () => {
             this.scene.start('MiningScene');
        });
    }
}