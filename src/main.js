import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MiningScene from './scenes/MiningScene';
import BaseScene from './scenes/BaseScene';
import CombatScene from './scenes/CombatScene';
import GameOverScene from './scenes/GameOverScene';

export const GameState = {
    resources: 0,
    currency: 0,
    waveNumber: 1,
    baseHealth: 100,
    maxBaseHealth: 100,
    playerInventory: [],

    // Mining upgrades
    maxAP: 30,
    miningPower: 1,
    hasSonar: false,

    // Units available for combat
    units: [],

    // Board state for mining
    miningBoardState: null,
};

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    backgroundColor: '#1a1a2e',
    scene: [
        BootScene,
        MiningScene,
        BaseScene,
        CombatScene,
        GameOverScene
    ]
};

const game = new Phaser.Game(config);
