// =============================================
// JoyPop 欢乐消消乐 - 主入口
// =============================================
import Phaser from 'phaser';
import './style.css';

import { BootScene }     from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { MapScene }      from './scenes/MapScene.js';
import { GameScene }     from './scenes/GameScene.js';
import { PetScene }      from './scenes/PetScene.js';
import { BOARD_CONFIG }  from './config/GameConfig.js';

// =============================================
// 计算游戏尺寸（适配移动端）
// =============================================
function getGameSize() {
  const maxW = 450, maxH = 800;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ratio = maxW / maxH;
  const screenRatio = vw / vh;

  if (screenRatio > ratio) {
    const h = Math.min(vh, maxH);
    return { width: Math.floor(h * ratio), height: h };
  } else {
    const w = Math.min(vw, maxW);
    return { width: w, height: Math.floor(w / ratio) };
  }
}

const { width, height } = getGameSize();
BOARD_CONFIG.width = width;

// =============================================
// 加载条预动画
// =============================================
(function animateLoadBar() {
  let val = 0;
  const bar = document.getElementById('loading-bar');
  const interval = setInterval(() => {
    val += Math.random() * 12;
    if (val >= 65) { clearInterval(interval); return; }
    if (bar) bar.style.width = `${val}%`;
  }, 150);
})();

// =============================================
// Phaser 3 游戏配置
// =============================================
const config = {
  type: Phaser.AUTO,
  width,
  height,
  parent: 'game-container',
  backgroundColor: '#ff9ff3',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    MainMenuScene,
    MapScene,
    GameScene,
    PetScene,
  ],
  input: {
    activePointers: 3,
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true,
  },
};

// 启动游戏
const game = new Phaser.Game(config);

// 窗口大小变化时重新适配
window.addEventListener('resize', () => {
  const { width: nw, height: nh } = getGameSize();
  game.scale.resize(nw, nh);
});

// 防止移动端右键和默认触摸行为
document.addEventListener('contextmenu', e => e.preventDefault());
