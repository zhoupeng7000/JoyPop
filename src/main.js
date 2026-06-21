// =============================================
// JoyPop 欢乐消消乐 - 主入口
// =============================================
import Phaser from 'phaser';
import './style.css';

// =============================================
// Phaser 3 TextureManager.prototype.getBase64 扩展
// =============================================
Phaser.Textures.TextureManager.prototype.getBase64 = function (key) {
  if (!this.exists(key)) {
    console.warn(`[TextureManager] getBase64: Texture key "${key}" does not exist.`);
    return '';
  }
  const texture = this.get(key);
  const frame = texture.get(); // 获取默认帧
  if (!frame) return '';
  const source = frame.source.image; // HTMLImageElement 或 HTMLCanvasElement
  if (!source) return '';

  const canvas = document.createElement('canvas');
  canvas.width = frame.cutWidth || frame.width || source.width || 60;
  canvas.height = frame.cutHeight || frame.height || source.height || 60;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const sx = frame.cutX !== undefined ? frame.cutX : 0;
    const sy = frame.cutY !== undefined ? frame.cutY : 0;
    const sWidth = frame.cutWidth !== undefined ? frame.cutWidth : (source.width || canvas.width);
    const sHeight = frame.cutHeight !== undefined ? frame.cutHeight : (source.height || canvas.height);
    
    try {
      ctx.drawImage(
        source,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
    } catch (e) {
      console.error(`[TextureManager] Failed to draw image to canvas for key "${key}":`, e);
      if (typeof source.toDataURL === 'function') {
        return source.toDataURL();
      }
      if (source.src) {
        return source.src;
      }
    }
  }
  
  return canvas.toDataURL();
};


window.addEventListener('error', function(e) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:0;left:0;background:red;color:white;z-index:9999;padding:20px;font-size:16px;word-break:break-all;';
  div.textContent = 'ERROR: ' + e.message + ' at ' + e.filename + ':' + e.lineno;
  document.body.appendChild(div);
});
window.addEventListener('unhandledrejection', function(e) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:0;left:0;background:red;color:white;z-index:9999;padding:20px;font-size:16px;word-break:break-all;';
  div.textContent = 'PROMISE ERROR: ' + (e.reason && e.reason.stack ? e.reason.stack : e.reason);
  document.body.appendChild(div);
});


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
