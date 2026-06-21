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
    this.load.image('level_map_ch1', 'assets/ui/level_map_ch1.png');
    this.load.image('level_map_ch2', 'assets/ui/level_map_ch2.png');
    this.load.image('level_map_full', 'assets/ui/level_map_full.png');
    this.load.image('gameplay_ui_bg', 'assets/ui/gameplay_ui_bg.png');
    this.load.image('pet_ui_bg', 'assets/ui/pet_ui_bg.png');
    this.load.image('bunny', 'assets/characters/bunny.png');

    // 载入高保真 Q 萌 3D 水果/宝石棋子 PNG 资源
    this.load.image('tile_strawberry', 'assets/tiles/tile_strawberry.png');
    this.load.image('tile_grape', 'assets/tiles/tile_grape.png');
    this.load.image('tile_orange', 'assets/tiles/tile_orange.png');
    this.load.image('tile_blueberry', 'assets/tiles/tile_blueberry.png');
    this.load.image('tile_watermelon', 'assets/tiles/tile_watermelon.png');
    this.load.image('tile_cherry', 'assets/tiles/tile_cherry.png');
    this.load.image('tile_diamond', 'assets/tiles/tile_diamond.png');
    this.load.image('tile_crystal', 'assets/tiles/tile_crystal.png');
    this.load.image('ui_heart', 'assets/ui/ui_heart.png');
  }

  create() {
    try {
      this._createTileTextures();
      this._createUITextures();
      this._createCharacterTextures();
      this._createProceduralIcons();
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

  // ── 纹理：方块（糖果水果风格）──────────────────
  _createTileTextures() {
    const size = 56;
    const tileData = [
      { key: 'tile_0', color: 0xff4757, accent: 0xff6b81 },   // 红色草莓
      { key: 'tile_1', color: 0x9c27b0, accent: 0xce93d8 },   // 紫色葡萄
      { key: 'tile_2', color: 0xff9800, accent: 0xffb74d },   // 橙色橘子
      { key: 'tile_3', color: 0x3f88c5, accent: 0x74c0fc },   // 蓝色蓝莓
      { key: 'tile_4', color: 0x4caf50, accent: 0x81c784 },   // 绿色苹果
      { key: 'tile_5', color: 0xe91e63, accent: 0xf48fb1 },   // 粉色樱桃
      { key: 'tile_6', color: 0x00bcd4, accent: 0x4dd0e1 },   // 青色薄荷
      { key: 'tile_7', color: 0x7c4dff, accent: 0xb388ff },   // 靛紫星星
    ];

    tileData.forEach(({ key, color, accent }) => {
      const g = this.add.graphics();
      // 主体圆角色块
      g.fillStyle(color, 1);
      g.fillRoundedRect(2, 2, size - 4, size - 4, 14);
      // 内嵌亮色区域
      g.fillStyle(accent, 1);
      g.fillRoundedRect(5, 5, size - 10, size - 10, 12);
      // 立体边框
      g.lineStyle(2.5, color, 0.9);
      g.strokeRoundedRect(2, 2, size - 4, size - 4, 14);
      // 顶部高光弧
      g.fillStyle(0xffffff, 0.4);
      g.fillEllipse(size / 2, size / 3.5, size * 0.55, size * 0.28);
      // 右下角小高光点
      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(size * 0.7, size * 0.7, 4);
      g.generateTexture(key, size, size);
      g.destroy();
    });
  }

  // ── 纹理：UI 元素 ─────────────────────────────
  _createUITextures() {
    // 森林萌粉大按钮 - 3D 渐变带高光
    const btn = this.add.graphics();
    // 阴影底
    btn.fillStyle(0xd63031, 0.3);
    btn.fillRoundedRect(3, 4, 200, 60, 30);
    // 渐变本体
    btn.fillStyle(0xff6eb4, 1);
    btn.fillRoundedRect(0, 0, 200, 60, 30);
    // 内置条纹/高光弧
    btn.fillStyle(0xffffff, 0.28);
    btn.fillEllipse(100, 15, 140, 20);
    btn.lineStyle(3, 0xffffff, 0.85);
    btn.strokeRoundedRect(0, 0, 200, 60, 30);
    btn.generateTexture('btn_pink', 200, 60);
    btn.destroy();

    // 立体金色星星
    const star = this.add.graphics();
    // 暗红描边与阴影
    star.fillStyle(0xeccc68, 0.35);
    this._fillStar(star, 32, 32, 5, 14, 30);
    // 渐变金黄
    star.fillStyle(0xffd23f, 1);
    this._fillStar(star, 30, 30, 5, 12, 28);
    // 橙黄色立体边框
    star.lineStyle(2.5, 0xffa502, 1);
    this._strokeStar(star, 30, 30, 5, 12, 28);
    // 白色月牙高光
    star.fillStyle(0xffffff, 0.5);
    star.fillCircle(24, 24, 5);
    star.generateTexture('star_gold', 60, 60);
    star.destroy();

    // 立体灰色星星
    const starGray = this.add.graphics();
    starGray.fillStyle(0xdddddd, 1);
    this._fillStar(starGray, 30, 30, 5, 12, 28);
    starGray.lineStyle(2.5, 0xa4b0be, 1);
    this._strokeStar(starGray, 30, 30, 5, 12, 28);
    starGray.generateTexture('star_gray', 60, 60);
    starGray.destroy();

    // 经典立体红心 (用于缺省备用)
    const heart = this.add.graphics();
    heart.fillStyle(0xff4757, 1);
    heart.fillCircle(15, 18, 13);
    heart.fillCircle(29, 18, 13);
    this._fillTriangle(heart, 2, 24, 42, 24, 22, 46);
    // 高光圆点
    heart.fillStyle(0xffffff, 0.45);
    heart.fillCircle(13, 13, 4);
    heart.generateTexture('heart_full', 44, 48);
    heart.destroy();

    // 森林花框奶油白面板
    const panel = this.add.graphics();
    // 柔和奶油米黄色背景
    panel.fillStyle(0xfffdf9, 0.98);
    panel.fillRoundedRect(0, 0, 300, 400, 24);
    // 精美的木粉色边框
    panel.lineStyle(4, 0xffb3d9, 1);
    panel.strokeRoundedRect(0, 0, 300, 400, 24);
    // 内部细虚线装饰
    panel.lineStyle(1.5, 0xffd3e8, 0.7);
    panel.strokeRoundedRect(8, 8, 284, 384, 18);
    panel.generateTexture('panel_white', 300, 400);
    panel.destroy();
  }

  // ── 纹理：小兔角色（大尺寸高精细版）────────────────
  _createCharacterTextures() {
    const bunny = this.add.graphics();
    const W = 160, H = 176;

    // 身体（白色椭圆）
    bunny.fillStyle(0xffffff, 1);
    bunny.fillEllipse(80, 120, 60, 50);

    // 头
    bunny.fillCircle(80, 62, 44);

    // 耳朵外层（粉白渐变效果）
    bunny.fillStyle(0xffd6e7, 1);
    bunny.fillEllipse(52, 18, 22, 54);
    bunny.fillEllipse(108, 18, 22, 54);
    // 耳朵内层
    bunny.fillStyle(0xffb3c6, 1);
    bunny.fillEllipse(52, 18, 13, 40);
    bunny.fillEllipse(108, 18, 13, 40);

    // 眼睛（大眼萌）
    bunny.fillStyle(0x2c2c54, 1);
    bunny.fillCircle(64, 56, 10);
    bunny.fillCircle(96, 56, 10);
    // 眼睛高光（双高光更萌）
    bunny.fillStyle(0xffffff, 1);
    bunny.fillCircle(68, 52, 4);
    bunny.fillCircle(100, 52, 4);
    bunny.fillCircle(62, 60, 2);
    bunny.fillCircle(94, 60, 2);

    // 腮红（爱心形状）
    bunny.fillStyle(0xffb3c6, 0.6);
    bunny.fillCircle(48, 70, 12);
    bunny.fillCircle(112, 70, 12);

    // 鼻子
    bunny.fillStyle(0xff6b81, 1);
    bunny.fillCircle(80, 72, 5);

    // 嘴巴微笑弧
    bunny.lineStyle(2.5, 0xffb3c6, 0.9);
    bunny.beginPath();
    bunny.arc(80, 72, 8, Math.PI * 0.15, Math.PI * 0.85);
    bunny.strokePath();

    // 帽子/头饰 - 粉色蝴蝶结
    bunny.fillStyle(0xff6eb4, 1);
    bunny.fillEllipse(110, 30, 14, 10);
    bunny.fillEllipse(126, 30, 14, 10);
    bunny.fillCircle(118, 30, 5);
    // 蝴蝶结中心装饰
    bunny.fillStyle(0xffd43b, 1);
    bunny.fillCircle(118, 30, 3);

    // 小肚皮
    bunny.fillStyle(0xfff0f5, 1);
    bunny.fillEllipse(80, 128, 30, 24);

    // 小脚
    bunny.fillStyle(0xffd6e7, 1);
    bunny.fillEllipse(62, 155, 18, 10);
    bunny.fillEllipse(98, 155, 18, 10);

    // 小手 (挥手姿态)
    bunny.fillStyle(0xffffff, 1);
    bunny.fillCircle(42, 108, 10);
    bunny.fillCircle(118, 100, 10);

    bunny.generateTexture('bunny_happy', W, H);
    bunny.destroy();
  }

  // ── 纹理：Q版卡通矢量图标（大尺寸、高对比、清晰可辨）────
  _createProceduralIcons() {
    const S = 100; // 统一 100x100 画布，保证缩放后依然清晰

    // ─── 1. 狐狸头像 ui_avatar_fox ───────────────────
    const fox = this.add.graphics();
    // 圆底
    fox.fillStyle(0xfff0e6, 1);
    fox.fillCircle(50, 52, 42);
    // 左耳
    fox.fillStyle(0xff7043, 1);
    this._fillTriangle(fox, 14, 36, 28, 6, 36, 40);
    fox.fillStyle(0xffd2a1, 1);
    this._fillTriangle(fox, 18, 32, 27, 12, 33, 37);
    // 右耳
    fox.fillStyle(0xff7043, 1);
    this._fillTriangle(fox, 86, 36, 72, 6, 64, 40);
    fox.fillStyle(0xffd2a1, 1);
    this._fillTriangle(fox, 82, 32, 73, 12, 67, 37);
    // 脸本体
    fox.fillStyle(0xff6348, 1);
    fox.fillEllipse(50, 56, 40, 32);
    // 白面颊
    fox.fillStyle(0xffffff, 1);
    fox.fillEllipse(30, 68, 18, 14);
    fox.fillEllipse(70, 68, 18, 14);
    // 眼睛
    fox.fillStyle(0x2f3542, 1);
    fox.fillCircle(36, 52, 5);
    fox.fillCircle(64, 52, 5);
    fox.fillStyle(0xffffff, 1);
    fox.fillCircle(34, 50, 2);
    fox.fillCircle(62, 50, 2);
    // 鼻子
    fox.fillStyle(0x2f3542, 1);
    this._fillTriangle(fox, 44, 66, 56, 66, 50, 72);
    // 腮红
    fox.fillStyle(0xffb3c6, 0.5);
    fox.fillCircle(26, 62, 6);
    fox.fillCircle(74, 62, 6);
    fox.generateTexture('ui_avatar_fox', S, S);
    fox.destroy();

    // ─── 2. 金币 ui_coin ─────────────────────────────
    const coin = this.add.graphics();
    coin.fillStyle(0xffd700, 1);
    coin.fillCircle(50, 50, 42);
    coin.lineStyle(5, 0xffa500, 1);
    coin.strokeCircle(50, 50, 42);
    coin.fillStyle(0xffe66d, 1);
    coin.fillCircle(50, 50, 28);
    coin.lineStyle(3, 0xffa500, 1);
    coin.strokeCircle(50, 50, 28);
    coin.fillStyle(0xffa500, 1);
    this._fillStar(coin, 50, 50, 5, 8, 18);
    coin.fillStyle(0xffffff, 0.5);
    coin.fillCircle(36, 36, 7);
    coin.generateTexture('ui_coin', S, S);
    coin.destroy();

    // ─── 3. 锁 ui_lock ──────────────────────────────
    const lock = this.add.graphics();
    // 锁环
    lock.lineStyle(8, 0xa4b0be, 1);
    lock.strokeRoundedRect(26, 10, 48, 44, 22);
    // 锁体
    lock.fillStyle(0xd2893c, 1);
    lock.fillRoundedRect(16, 40, 68, 44, 10);
    lock.lineStyle(4, 0x8f531d, 1);
    lock.strokeRoundedRect(16, 40, 68, 44, 10);
    // 钥匙孔
    lock.fillStyle(0x2f3542, 1);
    lock.fillCircle(50, 56, 6);
    this._fillTriangle(lock, 46, 58, 54, 58, 50, 74);
    lock.generateTexture('ui_lock', S, S);
    lock.destroy();

    // ─── 4. 返回箭头 ui_arrow_back ───────────────────
    const back = this.add.graphics();
    back.fillStyle(0x7950f2, 1);
    back.fillCircle(50, 50, 44);
    back.lineStyle(4, 0xffffff, 0.9);
    back.strokeCircle(50, 50, 44);
    // 粗箭头
    back.fillStyle(0xffffff, 1);
    this._fillTriangle(back, 22, 50, 46, 28, 46, 72);
    back.fillRect(40, 40, 28, 20);
    back.generateTexture('ui_arrow_back', S, S);
    back.destroy();

    // ─── 5. 步数图标 ui_icon_moves ───────────────────
    const paw = this.add.graphics();
    paw.fillStyle(0x448aff, 1);
    paw.fillCircle(50, 50, 44);
    paw.lineStyle(4, 0xffffff, 0.9);
    paw.strokeCircle(50, 50, 44);
    // 大爪掌
    paw.fillStyle(0xffffff, 1);
    paw.fillEllipse(50, 60, 22, 16);
    // 四个趾
    paw.fillCircle(30, 42, 7);
    paw.fillCircle(42, 32, 7);
    paw.fillCircle(58, 32, 7);
    paw.fillCircle(70, 42, 7);
    paw.generateTexture('ui_icon_moves', S, S);
    paw.destroy();

    // ─── 6. 锤子道具 ui_booster_hammer ───────────────
    const ham = this.add.graphics();
    // 手柄
    ham.fillStyle(0x8d6e46, 1);
    ham.fillRect(42, 52, 16, 40);
    ham.fillStyle(0xa67c52, 1);
    ham.fillRect(44, 52, 12, 40);
    // 锤头
    ham.fillStyle(0xbdc3c7, 1);
    ham.fillRoundedRect(22, 16, 56, 38, 8);
    ham.lineStyle(4, 0x95a5a6, 1);
    ham.strokeRoundedRect(22, 16, 56, 38, 8);
    // 高光
    ham.fillStyle(0xffffff, 0.35);
    ham.fillEllipse(50, 28, 34, 12);
    ham.generateTexture('ui_booster_hammer', S, S);
    ham.destroy();

    // ─── 7. 重排道具 ui_booster_shuffle ──────────────
    const shuf = this.add.graphics();
    // 两条交叉曲线
    shuf.lineStyle(8, 0x2ed573, 1);
    shuf.beginPath();
    shuf.moveTo(18, 30);
    shuf.lineTo(42, 50);
    shuf.lineTo(82, 30);
    shuf.strokePath();
    shuf.beginPath();
    shuf.moveTo(18, 70);
    shuf.lineTo(58, 50);
    shuf.lineTo(82, 70);
    shuf.strokePath();
    // 箭头
    shuf.fillStyle(0x2ed573, 1);
    this._fillTriangle(shuf, 82, 30, 68, 22, 68, 38);
    this._fillTriangle(shuf, 82, 70, 68, 62, 68, 78);
    shuf.generateTexture('ui_booster_shuffle', S, S);
    shuf.destroy();

    // ─── 8. 加步道具 ui_booster_extra ────────────────
    const extra = this.add.graphics();
    // 粉色闹钟底
    extra.fillStyle(0xff6eb4, 1);
    extra.fillCircle(50, 52, 36);
    extra.lineStyle(4, 0xffffff, 1);
    extra.strokeCircle(50, 52, 36);
    // 铃铛耳
    extra.fillCircle(22, 22, 10);
    extra.fillCircle(78, 22, 10);
    // 白色表盘
    extra.fillStyle(0xffffff, 1);
    extra.fillCircle(50, 52, 26);
    // 指针
    extra.lineStyle(5, 0xff6eb4, 1);
    extra.lineBetween(50, 52, 50, 34);
    extra.lineBetween(50, 52, 64, 52);
    // +5 文字标识（用图形近似）
    extra.fillStyle(0x2ed573, 1);
    extra.fillRect(46, 70, 8, 3);
    extra.fillRect(48, 67, 4, 9);
    extra.generateTexture('ui_booster_extra', S, S);
    extra.destroy();

    // ─── 9. 彩虹消除 ui_booster_rainbow ──────────────
    const rb = this.add.graphics();
    const rbColors = [0xff4757, 0xff9800, 0xffd43b, 0x4caf50, 0x3f88c5, 0x9c27b0];
    for (let i = 0; i < 6; i++) {
      rb.fillStyle(rbColors[i], 1);
      rb.fillCircle(50, 50, 44 - i * 7);
    }
    // 白色星星中心
    rb.fillStyle(0xffffff, 0.85);
    this._fillStar(rb, 50, 50, 5, 6, 14);
    // 高光
    rb.fillStyle(0xffffff, 0.4);
    rb.fillCircle(36, 36, 8);
    rb.generateTexture('ui_booster_rainbow', S, S);
    rb.destroy();

    // ─── 10. 导航首页 ui_nav_home ────────────────────
    const home = this.add.graphics();
    // 屋身
    home.fillStyle(0xffecc6, 1);
    home.fillRoundedRect(22, 48, 56, 42, 6);
    home.lineStyle(3, 0x8a5a00, 1);
    home.strokeRoundedRect(22, 48, 56, 42, 6);
    // 屋顶
    home.fillStyle(0x2ed573, 1);
    this._fillTriangle(home, 10, 50, 50, 14, 90, 50);
    home.lineStyle(3, 0x20bf6b, 1);
    home.beginPath(); home.moveTo(10, 50); home.lineTo(50, 14); home.lineTo(90, 50); home.strokePath();
    // 门
    home.fillStyle(0x8a5a00, 1);
    home.fillRoundedRect(40, 62, 20, 28, 4);
    // 窗
    home.fillStyle(0x74c0fc, 1);
    home.fillRoundedRect(26, 55, 12, 12, 2);
    home.fillRoundedRect(62, 55, 12, 12, 2);
    home.generateTexture('ui_nav_home', S, S);
    home.destroy();

    // ─── 11. 导航地图 ui_nav_map ─────────────────────
    const navMap = this.add.graphics();
    // 卷轴底
    navMap.fillStyle(0xffecc6, 1);
    navMap.fillRoundedRect(14, 20, 72, 56, 8);
    navMap.lineStyle(3, 0xcd6133, 1);
    navMap.strokeRoundedRect(14, 20, 72, 56, 8);
    // 卷轴两端
    navMap.fillStyle(0xe5c290, 1);
    navMap.fillCircle(14, 48, 8);
    navMap.fillCircle(86, 48, 8);
    navMap.lineStyle(2, 0x8f531d, 1);
    navMap.strokeCircle(14, 48, 8);
    navMap.strokeCircle(86, 48, 8);
    // 路径标记
    navMap.lineStyle(4, 0xff4757, 0.85);
    navMap.beginPath();
    navMap.moveTo(28, 60);
    navMap.lineTo(44, 40);
    navMap.lineTo(62, 56);
    navMap.lineTo(76, 36);
    navMap.strokePath();
    // 旗帜
    navMap.fillStyle(0xff4757, 1);
    this._fillTriangle(navMap, 72, 26, 84, 26, 78, 36);
    navMap.generateTexture('ui_nav_map', S, S);
    navMap.destroy();

    // ─── 12. 导航宠物 ui_nav_pet ─────────────────────
    const petI = this.add.graphics();
    // 白色兔脸
    petI.fillStyle(0xffffff, 1);
    petI.fillCircle(50, 58, 28);
    // 耳朵
    petI.fillEllipse(34, 26, 12, 28);
    petI.fillEllipse(66, 26, 12, 28);
    // 内耳
    petI.fillStyle(0xffb3c6, 1);
    petI.fillEllipse(34, 26, 6, 20);
    petI.fillEllipse(66, 26, 6, 20);
    // 眼睛
    petI.fillStyle(0x2c2c54, 1);
    petI.fillCircle(40, 54, 4);
    petI.fillCircle(60, 54, 4);
    // 腮红
    petI.fillStyle(0xffb3c6, 0.65);
    petI.fillCircle(32, 64, 6);
    petI.fillCircle(68, 64, 6);
    // 鼻子
    petI.fillStyle(0xff6b81, 1);
    petI.fillCircle(50, 60, 3);
    petI.generateTexture('ui_nav_pet', S, S);
    petI.destroy();

    // ─── 13. 导航奖励 ui_nav_gift ────────────────────
    const gift = this.add.graphics();
    // 盒子
    gift.fillStyle(0xff6eb4, 1);
    gift.fillRoundedRect(16, 34, 68, 52, 8);
    gift.lineStyle(3, 0xffffff, 1);
    gift.strokeRoundedRect(16, 34, 68, 52, 8);
    // 丝带竖
    gift.fillStyle(0xffd43b, 1);
    gift.fillRect(44, 34, 12, 52);
    // 丝带横
    gift.fillRect(16, 52, 68, 12);
    // 蝴蝶结
    gift.fillEllipse(38, 28, 14, 10);
    gift.fillEllipse(62, 28, 14, 10);
    gift.fillCircle(50, 30, 5);
    gift.generateTexture('ui_nav_gift', S, S);
    gift.destroy();

    // ─── 14. 导航排行 ui_nav_trophy ──────────────────
    const trop = this.add.graphics();
    // 奖杯身
    trop.fillStyle(0xffd23f, 1);
    trop.fillRoundedRect(26, 18, 48, 38, 10);
    trop.lineStyle(3, 0xffa502, 1);
    trop.strokeRoundedRect(26, 18, 48, 38, 10);
    // 把手
    trop.lineStyle(5, 0xffd23f, 1);
    trop.beginPath();
    trop.arc(26, 36, 12, Math.PI * 0.5, Math.PI * 1.5);
    trop.strokePath();
    trop.beginPath();
    trop.arc(74, 36, 12, Math.PI * 1.5, Math.PI * 0.5);
    trop.strokePath();
    // 柱
    trop.fillStyle(0xffa502, 1);
    trop.fillRect(44, 56, 12, 14);
    // 底座
    trop.fillRoundedRect(30, 70, 40, 12, 4);
    trop.lineStyle(2, 0xffa502, 1);
    trop.strokeRoundedRect(30, 70, 40, 12, 4);
    // 中心星
    trop.fillStyle(0xffffff, 0.9);
    this._fillStar(trop, 50, 36, 5, 5, 12);
    trop.generateTexture('ui_nav_trophy', S, S);
    trop.destroy();

    // ─── 15. 水滴 ui_status_drop ─────────────────────
    const drop = this.add.graphics();
    drop.fillStyle(0x4db6ff, 1);
    drop.fillCircle(50, 58, 28);
    this._fillTriangle(drop, 50, 10, 26, 44, 74, 44);
    drop.fillStyle(0xffffff, 0.45);
    drop.fillCircle(38, 50, 7);
    drop.generateTexture('ui_status_drop', S, S);
    drop.destroy();

    // ─── 16. 绿色加号按钮 ui_plus_btn ─────────────────
    const plus = this.add.graphics();
    plus.fillStyle(0x22c55e, 1); // green
    plus.fillCircle(50, 50, 42);
    plus.lineStyle(4, 0xffffff, 1);
    plus.strokeCircle(50, 50, 42);
    // Draw + sign
    plus.fillStyle(0xffffff, 1);
    plus.fillRect(45, 25, 10, 50);
    plus.fillRect(25, 45, 50, 10);
    plus.generateTexture('ui_plus_btn', S, S);
    plus.destroy();

    // ─── 17. 蓝色设置按钮 ui_settings_btn ─────────────
    const settings = this.add.graphics();
    settings.fillStyle(0x38bdf8, 1); // sky blue
    settings.fillCircle(50, 50, 44);
    settings.lineStyle(4, 0xffffff, 1);
    settings.strokeCircle(50, 50, 44);
    // Draw gear teeth
    settings.fillStyle(0xffffff, 1);
    settings.fillCircle(50, 50, 18);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const tx = 50 + Math.cos(angle) * 22;
      const ty = 50 + Math.sin(angle) * 22;
      settings.fillCircle(tx, ty, 6);
    }
    // Inner hole
    settings.fillStyle(0x38bdf8, 1);
    settings.fillCircle(50, 50, 9);
    settings.generateTexture('ui_settings_btn', S, S);
    settings.destroy();

    // ─── 18. 粉色小兔 face ui_animal_bunny ───────────
    const ab = this.add.graphics();
    ab.fillStyle(0xffc2d1, 1); // pink face
    ab.fillCircle(50, 55, 30);
    // ears
    ab.fillEllipse(35, 20, 10, 24);
    ab.fillEllipse(65, 20, 10, 24);
    ab.fillStyle(0xffe3e9, 1); // inner ears
    ab.fillEllipse(35, 20, 5, 18);
    ab.fillEllipse(65, 20, 5, 18);
    // eyes
    ab.fillStyle(0x2f3542, 1);
    ab.fillCircle(40, 50, 4);
    ab.fillCircle(60, 50, 4);
    ab.fillStyle(0xffffff, 1);
    ab.fillCircle(42, 48, 1.5);
    ab.fillCircle(62, 48, 1.5);
    // nose
    ab.fillStyle(0xff4757, 1);
    ab.fillCircle(50, 58, 3);
    // cheeks
    ab.fillStyle(0xff8da1, 0.5);
    ab.fillCircle(33, 56, 5);
    ab.fillCircle(67, 56, 5);
    ab.generateTexture('ui_animal_bunny', S, S);
    ab.destroy();

    // ─── 19. 绿色小蛙 face ui_animal_frog ────────────
    const af = this.add.graphics();
    af.fillStyle(0x2ed573, 1); // green face
    af.fillCircle(50, 55, 30);
    // eyes
    af.fillCircle(35, 25, 10);
    af.fillCircle(65, 25, 10);
    af.fillStyle(0xffffff, 1);
    af.fillCircle(35, 25, 7);
    af.fillCircle(65, 25, 7);
    af.fillStyle(0x2f3542, 1);
    af.fillCircle(35, 25, 3.5);
    af.fillCircle(65, 25, 3.5);
    // cheeks
    af.fillStyle(0xff4757, 0.4);
    af.fillCircle(30, 58, 5);
    af.fillCircle(70, 58, 5);
    // mouth
    af.lineStyle(3, 0x1e824c, 1);
    af.beginPath();
    af.arc(50, 58, 12, 0, Math.PI);
    af.strokePath();
    af.generateTexture('ui_animal_frog', S, S);
    af.destroy();

    // ─── 20. 黄色小鸡 face ui_animal_chick ───────────
    const ac = this.add.graphics();
    ac.fillStyle(0xffd32a, 1); // yellow face
    ac.fillCircle(50, 55, 30);
    // eyes
    ac.fillStyle(0x2f3542, 1);
    ac.fillCircle(40, 50, 4);
    ac.fillCircle(60, 50, 4);
    ac.fillStyle(0xffffff, 1);
    ac.fillCircle(41, 48, 1.5);
    ac.fillCircle(61, 48, 1.5);
    // beak
    ac.fillStyle(0xff9f43, 1);
    ac.fillTriangle(44, 55, 56, 55, 50, 63);
    // blush
    ac.fillStyle(0xffa502, 0.4);
    ac.fillCircle(32, 56, 4);
    ac.fillCircle(68, 56, 4);
    ac.generateTexture('ui_animal_chick', S, S);
    ac.destroy();

    // ─── 21. 棕色小熊 face ui_animal_bear ────────────
    const abe = this.add.graphics();
    abe.fillStyle(0x8d6e63, 1); // brown face
    abe.fillCircle(50, 55, 30);
    // ears
    abe.fillCircle(30, 28, 10);
    abe.fillCircle(70, 28, 10);
    abe.fillStyle(0xd7ccc8, 1);
    abe.fillCircle(30, 28, 6);
    abe.fillCircle(70, 28, 6);
    // muzzle
    abe.fillStyle(0xf5f5f5, 1);
    abe.fillEllipse(50, 60, 12, 9);
    // nose
    abe.fillStyle(0x2f3542, 1);
    abe.fillCircle(50, 56, 3.5);
    // eyes
    abe.fillStyle(0x2f3542, 1);
    abe.fillCircle(38, 48, 4);
    abe.fillCircle(62, 48, 4);
    abe.fillStyle(0xffffff, 1);
    abe.fillCircle(39, 46, 1.5);
    abe.fillCircle(63, 46, 1.5);
    abe.generateTexture('ui_animal_bear', S, S);
    abe.destroy();

    // ─── 22. 消除粒子圆点 particle_dot ────────────────
    const pDot = this.add.graphics();
    pDot.fillStyle(0xffffff, 1);
    pDot.fillCircle(8, 8, 8);
    pDot.generateTexture('particle_dot', 16, 16);
    pDot.destroy();
  }
}

