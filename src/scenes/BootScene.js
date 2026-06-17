// =============================================
// JoyPop 资源预加载场景
// =============================================
export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    this.load.on('progress', (value) => {
      const bar = document.getElementById('loading-bar');
      const text = document.getElementById('loading-text');
      if (bar) bar.style.width = `${Math.floor(value * 100)}%`;
      if (text) text.textContent = `加载中... ${Math.floor(value * 100)}%`;
    });
    this.load.on('complete', () => {
      const text = document.getElementById('loading-text');
      if (text) text.textContent = '加载完成！✨';
    });

    // 载入重构后的 UI 图片资源
    this.load.image('main_menu_bg', 'assets/ui/main_menu_bg.png');
    this.load.image('level_map_full', 'assets/ui/level_map_full.png');
    this.load.image('gameplay_ui_bg', 'assets/ui/gameplay_ui_bg.png');
    this.load.image('pet_ui_bg', 'assets/ui/pet_ui_bg.png');
    this.load.image('bunny', 'assets/characters/bunny.png');
  }

  create() {
    try {
      this._createTileTextures();
      this._createUITextures();
      this._createCharacterTextures();
    } catch (e) {
      console.error('[BootScene] 纹理创建失败:', e);
    }

    // 隐藏加载界面，过渡到主菜单
    setTimeout(() => {
      const screen = document.getElementById('loading-screen');
      if (screen) {
        screen.classList.add('fade-out');
        setTimeout(() => { screen.style.display = 'none'; }, 800);
      }
    }, 500);

    this.scene.start('MainMenuScene');
  }

  // ── 辅助：绘制星形路径 ─────────────────────────
  _drawStarPoints(g, cx, cy, points, inner, outer) {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }
    return pts;
  }

  _fillStar(g, cx, cy, points, inner, outer) {
    const pts = this._drawStarPoints(g, cx, cy, points, inner, outer);
    g.fillPoints(pts, true);
  }

  _strokeStar(g, cx, cy, points, inner, outer) {
    const pts = this._drawStarPoints(g, cx, cy, points, inner, outer);
    g.strokePoints(pts, true);
  }

  // ── 辅助：绘制三角形 ───────────────────────────
  _fillTriangle(g, x1, y1, x2, y2, x3, y3) {
    g.fillPoints([{ x: x1, y: y1 }, { x: x2, y: y2 }, { x: x3, y: y3 }], true);
  }

  // ── 纹理：方块 ────────────────────────────────
  _createTileTextures() {
    const tileData = [
      { key: 'tile_0', color: 0xff4757 },
      { key: 'tile_1', color: 0x9c27b0 },
      { key: 'tile_2', color: 0xff9800 },
      { key: 'tile_3', color: 0x3f88c5 },
      { key: 'tile_4', color: 0x4caf50 },
      { key: 'tile_5', color: 0xe91e63 },
      { key: 'tile_6', color: 0x00bcd4 },
      { key: 'tile_7', color: 0x7c4dff },
    ];

    tileData.forEach(({ key, color }) => {
      const g = this.add.graphics();
      const size = 56;
      g.fillStyle(color, 1);
      g.fillRoundedRect(3, 3, size - 6, size - 6, 14);
      g.fillStyle(0xffffff, 0.3);
      g.fillEllipse(size / 3, size / 4, size / 2.5, size / 3.5);
      g.lineStyle(3, 0xffffff, 0.9);
      g.strokeRoundedRect(3, 3, size - 6, size - 6, 14);
      g.generateTexture(key, size, size);
      g.destroy();
    });
  }

  // ── 纹理：UI 元素 ─────────────────────────────
  _createUITextures() {
    // 粉色按钮
    const btn = this.add.graphics();
    btn.fillStyle(0xff6eb4, 1);
    btn.fillRoundedRect(0, 0, 200, 60, 30);
    btn.fillStyle(0xffffff, 0.22);
    btn.fillEllipse(70, 18, 120, 25);
    btn.lineStyle(3, 0xffffff, 0.6);
    btn.strokeRoundedRect(0, 0, 200, 60, 30);
    btn.generateTexture('btn_pink', 200, 60);
    btn.destroy();

    // 金色星星（用 fillPoints 绘制五角星）
    const star = this.add.graphics();
    star.fillStyle(0xffd43b, 1);
    this._fillStar(star, 30, 30, 5, 12, 28);
    star.lineStyle(2, 0xff9800, 1);
    this._strokeStar(star, 30, 30, 5, 12, 28);
    star.generateTexture('star_gold', 60, 60);
    star.destroy();

    // 灰色星星
    const starGray = this.add.graphics();
    starGray.fillStyle(0xcccccc, 1);
    this._fillStar(starGray, 30, 30, 5, 12, 28);
    starGray.generateTexture('star_gray', 60, 60);
    starGray.destroy();

    // 心形（用圆+三角近似）
    const heart = this.add.graphics();
    heart.fillStyle(0xff4757, 1);
    heart.fillCircle(15, 18, 13);
    heart.fillCircle(29, 18, 13);
    // 用 fillPoints 代替 fillTriangle
    this._fillTriangle(heart, 2, 24, 42, 24, 22, 46);
    heart.generateTexture('heart_full', 44, 48);
    heart.destroy();

    // 白色面板
    const panel = this.add.graphics();
    panel.fillStyle(0xffffff, 0.95);
    panel.fillRoundedRect(0, 0, 300, 400, 24);
    panel.lineStyle(3, 0xff6eb4, 0.5);
    panel.strokeRoundedRect(0, 0, 300, 400, 24);
    panel.generateTexture('panel_white', 300, 400);
    panel.destroy();
  }

  // ── 纹理：小兔角色 ────────────────────────────
  _createCharacterTextures() {
    const bunny = this.add.graphics();

    // 身体（白色）
    bunny.fillStyle(0xffffff, 1);
    bunny.fillCircle(40, 58, 26);
    // 头
    bunny.fillCircle(40, 30, 22);
    // 耳朵外层
    bunny.fillStyle(0xffd6e7, 1);
    bunny.fillEllipse(27, 10, 12, 28);
    bunny.fillEllipse(53, 10, 12, 28);
    // 耳朵内层
    bunny.fillStyle(0xffb3c6, 1);
    bunny.fillEllipse(27, 10, 7, 20);
    bunny.fillEllipse(53, 10, 7, 20);
    // 眼睛
    bunny.fillStyle(0x2c2c54, 1);
    bunny.fillCircle(33, 27, 5);
    bunny.fillCircle(47, 27, 5);
    // 眼睛高光
    bunny.fillStyle(0xffffff, 1);
    bunny.fillCircle(35, 25, 2);
    bunny.fillCircle(49, 25, 2);
    // 腮红
    bunny.fillStyle(0xffb3c6, 0.7);
    bunny.fillCircle(26, 33, 7);
    bunny.fillCircle(54, 33, 7);
    // 鼻子
    bunny.fillStyle(0xff6b81, 1);
    bunny.fillCircle(40, 35, 3);
    // 帽子沿
    bunny.fillStyle(0xff6eb4, 1);
    bunny.fillRoundedRect(26, 8, 28, 6, 3);
    // 帽身
    bunny.fillRoundedRect(30, 0, 20, 10, 4);
    // 帽子装饰
    bunny.fillStyle(0xffd43b, 1);
    bunny.fillCircle(40, 4, 4);

    bunny.generateTexture('bunny_happy', 80, 88);
    bunny.destroy();
  }
}
