import Phaser from 'phaser';
import { GameState } from '../main';

const GRID_SIZE = 40;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 40;

const TILE_EMPTY = 0;
const TILE_DIRT = 1;
const TILE_ROCK = 2; // indestructible
const TILE_COAL = 3;
const TILE_IRON = 4;
const TILE_CRYSTAL = 5;

export default class MiningScene extends Phaser.Scene {
    constructor() {
        super('MiningScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#2d1b11');

        this.ap = GameState.maxAP;

        this.setupBoard();
        this.drawBoard();
        this.setupPlayer();
        this.setupUI();

        this.input.keyboard.on('keydown-UP', () => this.movePlayer(0, -1));
        this.input.keyboard.on('keydown-DOWN', () => this.movePlayer(0, 1));
        this.input.keyboard.on('keydown-LEFT', () => this.movePlayer(-1, 0));
        this.input.keyboard.on('keydown-RIGHT', () => this.movePlayer(1, 0));

        this.cameras.main.setBounds(0, 0, MAP_WIDTH * GRID_SIZE, MAP_HEIGHT * GRID_SIZE);
        this.cameras.main.startFollow(this.playerSprite);
    }

    setupBoard() {
        if (!GameState.miningBoardState) {
            GameState.miningBoardState = [];
            for (let y = 0; y < MAP_HEIGHT; y++) {
                let row = [];
                for (let x = 0; x < MAP_WIDTH; x++) {
                    if (y < 2) {
                        row.push(TILE_EMPTY); // Top space
                    } else {
                        // Generate dirt, rocks, and ores based on depth
                        let rand = Math.random();
                        if (rand > 0.95 && y > 5) {
                            row.push(TILE_ROCK);
                        } else if (rand > 0.98 && y > 25) {
                            row.push(TILE_CRYSTAL);
                        } else if (rand > 0.92 && y > 10) {
                            row.push(TILE_IRON);
                        } else if (rand > 0.85 && y > 3) {
                            row.push(TILE_COAL);
                        } else {
                            row.push(TILE_DIRT);
                        }
                    }
                }
                GameState.miningBoardState.push(row);
            }
        } else {
            // Refill some resources for new phases
            for (let y = 2; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    if (GameState.miningBoardState[y][x] === TILE_EMPTY && Math.random() > 0.9) {
                         GameState.miningBoardState[y][x] = TILE_DIRT;
                    }
                }
            }
        }
        this.board = GameState.miningBoardState;
    }

    drawBoard() {
        this.tileGroup = this.add.group();

        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                let type = this.board[y][x];
                if (type !== TILE_EMPTY) {
                    let color = 0x000000;
                    if (type === TILE_DIRT) color = 0x5a3e2b;
                    if (type === TILE_ROCK) color = 0x4a4a4a;
                    if (type === TILE_COAL) color = 0x333333; // Dark gray
                    if (type === TILE_IRON) color = 0x4a90e2; // Blue
                    if (type === TILE_CRYSTAL) color = 0xbd10e0; // Purple

                    let rect = this.add.rectangle(
                        x * GRID_SIZE + GRID_SIZE / 2,
                        y * GRID_SIZE + GRID_SIZE / 2,
                        GRID_SIZE - 2,
                        GRID_SIZE - 2,
                        color
                    );

                    rect.boardX = x;
                    rect.boardY = y;
                    this.tileGroup.add(rect);
                }
            }
        }
    }

    getTileRect(x, y) {
        return this.tileGroup.getChildren().find(t => t.boardX === x && t.boardY === y);
    }

    setupPlayer() {
        // Find a safe starting spot (e.g. at the top center)
        this.playerX = Math.floor(MAP_WIDTH / 2);
        this.playerY = 1;

        this.playerSprite = this.add.rectangle(
            this.playerX * GRID_SIZE + GRID_SIZE / 2,
            this.playerY * GRID_SIZE + GRID_SIZE / 2,
            GRID_SIZE * 0.8,
            GRID_SIZE * 0.8,
            0x00ff00
        );
    }

    setupUI() {
        this.uiGroup = this.add.group();

        this.apText = this.add.text(10, 10, `AP: ${this.ap}`, { fontSize: '24px', fill: '#fff', backgroundColor: '#000' })
            .setScrollFactor(0);
        this.resText = this.add.text(10, 40, `Resources: ${GameState.resources}`, { fontSize: '24px', fill: '#fff', backgroundColor: '#000' })
            .setScrollFactor(0);

        // Use Sonar skill
        if (GameState.hasSonar) {
             const sonarBtn = this.add.text(10, 70, '[S] Use Sonar (3 AP)', { fontSize: '20px', fill: '#0ff', backgroundColor: '#000' })
                .setScrollFactor(0);
             this.input.keyboard.on('keydown-S', () => this.useSonar());
        }
    }

    updateUI() {
        this.apText.setText(`AP: ${this.ap}`);
        this.resText.setText(`Resources: ${GameState.resources}`);
    }

    movePlayer(dx, dy) {
        if (this.ap <= 0) return;

        let newX = this.playerX + dx;
        let newY = this.playerY + dy;

        if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return;

        let targetType = this.board[newY][newX];

        if (targetType === TILE_ROCK) {
            // Cannot pass or dig
            return;
        }

        if (targetType !== TILE_EMPTY) {
            // Digging
            if (targetType === TILE_COAL) GameState.resources += 2;
            else if (targetType === TILE_IRON) GameState.resources += 10;
            else if (targetType === TILE_CRYSTAL) GameState.resources += 50;
            else if (targetType === TILE_DIRT) GameState.resources += 1;

            this.board[newY][newX] = TILE_EMPTY;
            let rect = this.getTileRect(newX, newY);
            if (rect) rect.destroy();

            this.playerX = newX;
            this.playerY = newY;
            this.ap -= 1;
        } else {
            // Just move
            this.playerX = newX;
            this.playerY = newY;
            this.ap -= 1;
        }

        this.playerSprite.setPosition(
            this.playerX * GRID_SIZE + GRID_SIZE / 2,
            this.playerY * GRID_SIZE + GRID_SIZE / 2
        );

        this.updateUI();

        if (this.ap <= 0) {
            this.time.delayedCall(500, () => {
                this.scene.start('BaseScene');
            });
        }
    }

    useSonar() {
        if (this.ap < 3) return;
        this.ap -= 3;

        // Reveal nearby ores visually
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                let tx = this.playerX + dx;
                let ty = this.playerY + dy;
                if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                    let type = this.board[ty][tx];
                    if (type === TILE_COAL || type === TILE_IRON || type === TILE_CRYSTAL) {
                        let rect = this.getTileRect(tx, ty);
                        if (rect) rect.setStrokeStyle(4, 0x00ffff);
                    }
                }
            }
        }
        this.updateUI();
    }
}