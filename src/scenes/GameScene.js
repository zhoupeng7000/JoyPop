// =============================================
// JoyPop 游戏消除场景 - 重构版
// =============================================
import { BOARD_CONFIG, BOOSTER_TYPE, CHAPTERS } from '../config/GameConfig.js';
import { getLevel, getChapterForLevel } from '../config/LevelData.js';
import { Board } from '../utils/Board.js';
import { SaveSystem } from '../utils/SaveSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.levelId = data.levelId || 1;
    this.saveData = data.saveData || SaveSystem.load();
    this.levelData = getLevel(this.levelId);
    this.chapterId = getChapterForLevel(this.levelId);
    this.chapter = CHAPTERS[this.chapterId - 1];

    // 动态调整方块大小以留出左侧垂直分数条的空间
    BOARD_CONFIG.tileSize = 48;
    BOARD_CONFIG.boardOffsetY = 155;
  }

  create() {
    this.cameras.main.setBackgroundColor(this.chapter.gradientFrom);
    this.cameras.main.fadeIn(300);

    this._drawBackground();
    this._drawTopHUDBars();
    this._drawLeftScoreThermometer();
    this._createBoard();
    this._drawBunnyHelper();
    this._drawBoosterBar();

    // 监听键盘（调试）
    this.input.keyboard?.addKey('ESC')?.on('down', () => this._exitToMap());
  }

  _drawBackground() {
    const { width, height } = this.cameras.main;
    const g = this.add.graphics();
    const c1 = Phaser.Display.Color.HexStringToColor(this.chapter.gradientFrom).color;
    const c2 = Phaser.Display.Color.HexStringToColor(this.chapter.gradientTo).color;
    g.fillGradientStyle(c1, c1, c2, c2, 1);
    g.fillRect(0, 0, width, height);

    // 背景装饰小气泡
    for (let i = 0; i < 6; i++) {
      const x = Phaser.Math.Between(10, width - 10);
      const y = Phaser.Math.Between(50, height - 150);
      const r = Phaser.Math.Between(15, 40);
      const bubble = this.add.graphics();
      bubble.fillStyle(0xffffff, 0.08);
      bubble.fillCircle(x, y, r);
      this.tweens.add({
        targets: bubble,
        y: y - Phaser.Math.Between(20, 50),
        alpha: 0,
        duration: 2500 + Math.random() * 3000,
        repeat: -1,
        delay: Math.random() * 2000,
        onRepeat: () => {
          bubble.clear();
          bubble.fillStyle(0xffffff, 0.08);
          bubble.fillCircle(x, y, r);
        }
      });
    }
  }

  // ── 顶部三色胶囊 HUD ───────────────────────────
  _drawTopHUDBars() {
    const { width } = this.cameras.main;
    const HUD_DEPTH = 50;

    // 动态计算三个胶囊的宽度（基于屏幕宽度）
    const p1W = Math.floor(width * 0.285); // 步数胶囊
    const p2W = Math.floor(width * 0.415); // 目标胶囊
    const p3W = Math.floor(width * 0.265); // 星级胶囊
    const hudH = 44;
    const gap = 6;
    const p1X = 8;
    const p2X = p1X + p1W + gap;
    const p3X = p2X + p2W + gap;

    // 1. 左侧蓝色步数胶囊
    const barLeft = this.add.graphics().setDepth(HUD_DEPTH);
    barLeft.fillStyle(0x448aff, 1);
    barLeft.fillRoundedRect(p1X, 10, p1W, hudH, 22);
    barLeft.lineStyle(2.5, 0xffffff, 0.9);
    barLeft.strokeRoundedRect(p1X, 10, p1W, hudH, 22);

    this.add.text(p1X + p1W * 0.32, 10 + hudH / 2, '🐾', {
      fontSize: '14px',
    }).setOrigin(0.5).setDepth(HUD_DEPTH + 1);

    this.movesText = this.add.text(p1X + p1W * 0.72, 10 + hudH / 2, `${this.levelData.moves}`, {
      fontSize: '22px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#ffffff',
    }).setOrigin(0.5).setDepth(HUD_DEPTH + 1);

    // 2. 中间奶油色目标胶囊
    const barMid = this.add.graphics().setDepth(HUD_DEPTH);
    barMid.fillStyle(0xfff4f8, 1);
    barMid.fillRoundedRect(p2X, 10, p2W, hudH, 22);
    barMid.lineStyle(2.5, 0xffb3d9, 1);
    barMid.strokeRoundedRect(p2X, 10, p2W, hudH, 22);

    this.objGroup = this.add.container(p2X, 10).setDepth(HUD_DEPTH + 1);
    this._updateObjectivesUI(this.levelData.objectives.map(o => ({ ...o, done: 0 })));

    // 3. 右侧星级胶囊
    const barRight = this.add.graphics().setDepth(HUD_DEPTH);
    barRight.fillStyle(0xfff4f8, 1);
    barRight.fillRoundedRect(p3X, 10, p3W, hudH, 22);
    barRight.lineStyle(2.5, 0xffb3d9, 1);
    barRight.strokeRoundedRect(p3X, 10, p3W, hudH, 22);

    this.starsText = this.add.text(p3X + p3W / 2, 10 + hudH / 2, '💗 💗 💗', {
      fontSize: '13px',
    }).setOrigin(0.5).setDepth(HUD_DEPTH + 1);
  }

  _updateObjectivesUI(objectives) {
    if (!this.objGroup) return;
    this.objGroup.removeAll(true);

    const firstObj = objectives[0];
    if (!firstObj) return;

    // 显示当前消除目标的水果 Emoji
    const emojiText = this.add.text(26, 21, firstObj.emoji || '🍓', { fontSize: '20px' }).setOrigin(0.5);
    
    // 显示目标进度文本
    const countText = this.add.text(92, 13, `消除 ${firstObj.done}/${firstObj.count}`, {
      fontSize: '11px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#5a2d82',
    }).setOrigin(0.5);

    // 绿色胶囊进度条背景
    const progressBg = this.add.graphics();
    progressBg.fillStyle(0xe2e6ea, 1);
    progressBg.fillRoundedRect(56, 23, 110, 10, 5);

    // 进度条填充
    const pct = Math.min(firstObj.done / firstObj.count, 1);
    const progressFill = this.add.graphics();
    progressFill.fillStyle(0x20c997, 1);
    progressFill.fillRoundedRect(56, 23, Math.max(8, 110 * pct), 10, 5);

    this.objGroup.add([emojiText, countText, progressBg, progressFill]);

    // 更新步数
    if (this.movesText && this.board) {
      this.movesText.setText(`${this.board.movesLeft}`);
      if (this.board.movesLeft <= 5) {
        this.movesText.setStyle({ fill: '#ff4757' });
      }
    }
  }

  // ── 左侧温度计垂直分数条 ─────────────────────────
  _drawLeftScoreThermometer() {
    const { height } = this.cameras.main;

    // "分数"标题框 (x: 12, y: 70, w: 60, h: 26)
    const lblBg = this.add.graphics();
    lblBg.fillStyle(0xfff4f8, 1);
    lblBg.fillRoundedRect(10, 70, 68, 26, 13);
    lblBg.lineStyle(2.5, 0xffb3d9, 1);
    lblBg.strokeRoundedRect(10, 70, 68, 26, 13);

    this.scoreText = this.add.text(44, 83, '0', {
      fontSize: '11px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#ff6eb4',
    }).setOrigin(0.5);

    // 垂直温度计外壳管道
    const pipeX = 34, pipeY = 110, pipeW = 20, pipeH = 340;
    const p = this.add.graphics();
    // 阴影
    p.fillStyle(0x000000, 0.08);
    p.fillRoundedRect(pipeX - pipeW/2 + 2, pipeY + 3, pipeW, pipeH, pipeW/2);

    // 管道框
    p.fillStyle(0xfff4f8, 1);
    p.fillRoundedRect(pipeX - pipeW/2, pipeY, pipeW, pipeH, pipeW/2);
    p.lineStyle(3, 0xffb3d9, 1);
    p.strokeRoundedRect(pipeX - pipeW/2, pipeY, pipeW, pipeH, pipeW/2);

    // 实时金色填充图层
    this.scoreFillG = this.add.graphics();

    // 在左侧绘制 3 颗星的评级标记
    const starYOffsets = [0.66, 0.33, 0.05]; // 对应 1星、2星、3星高度
    this.starMarks = starYOffsets.map((pct, idx) => {
      const y = pipeY + pipeH * pct;
      return this.add.text(14, y, '⭐', { fontSize: '13px' }).setOrigin(0.5);
    });

    this._updateScoreBar(0);
  }

  _updateScoreBar(score) {
    if (!this.scoreFillG) return;
    const pipeX = 34, pipeY = 110, pipeW = 20, pipeH = 340;
    const maxScore = 30000; // 满分估值
    const pct = Math.min(score / maxScore, 1);

    this.scoreFillG.clear();
    if (pct > 0) {
      this.scoreFillG.fillStyle(0xffd43b, 1);
      const fillH = pipeH * pct;
      this.scoreFillG.fillRoundedRect(pipeX - pipeW/2, pipeY + pipeH - fillH, pipeW, fillH, pipeW/2);
      this.scoreFillG.lineStyle(2, 0xff9800, 1);
      this.scoreFillG.strokeRoundedRect(pipeX - pipeW/2, pipeY + pipeH - fillH, pipeW, fillH, pipeW/2);
    }

    // 动态调整顶部星星 Emoji 的高光
    if (this.starMarks) {
      if (pct >= 0.33) this.starMarks[0].setStyle({ fontSize: '16px' });
      if (pct >= 0.66) this.starMarks[1].setStyle({ fontSize: '16px' });
      if (pct >= 0.95) this.starMarks[2].setStyle({ fontSize: '16px' });
    }

    // 根据星级更新右侧爱心胶囊的文字
    let starCount = 0;
    if (pct >= 0.33) starCount = 1;
    if (pct >= 0.66) starCount = 2;
    if (pct >= 0.95) starCount = 3;
    if (this.starsText) {
      this.starsText.setText('💖'.repeat(starCount) + '🖤'.repeat(3 - starCount));
    }
  }

  // ── 创建棋盘 ───────────────────────────────────
  _createBoard() {
    const { width } = this.cameras.main;
    // 留出左侧 74px 的空间
    const boardW = BOARD_CONFIG.cols * (BOARD_CONFIG.tileSize + BOARD_CONFIG.tileGap) - BOARD_CONFIG.tileGap;
    const boardX = 74;

    this.board = new Board(
      this,
      { ...this.levelData, boardX },
      (score) => {
        this.scoreText?.setText(score.toLocaleString());
        this._updateScoreBar(score);
      },
      (objectives) => this._updateObjectivesUI(objectives),
      (combo) => this._showCombo(combo),
      (result, score, stars) => this._onLevelEnd(result, score, stars),
    );

    this.board.container.setPosition(boardX, BOARD_CONFIG.boardOffsetY);
  }

  // ── 左下角小兔招手助威 ──────────────────────────
  _drawBunnyHelper() {
    const { height } = this.cameras.main;
    if (this.textures.exists('bunny')) {
      const b = this.add.image(44, height - 120, 'bunny').setScale(0.06).setDepth(10);
      this.tweens.add({
        targets: b,
        y: height - 124,
        duration: 800,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      const bText = this.add.text(44, height - 120, '🐰', { fontSize: '36px' }).setOrigin(0.5).setDepth(10);
      this.tweens.add({ targets: bText, y: height - 128, duration: 600, yoyo: true, repeat: -1 });
    }
  }

  // ── 底部道具栏 ─────────────────────────────────
  _drawBoosterBar() {
    const { width, height } = this.cameras.main;
    const boosters = Object.values(BOOSTER_TYPE);
    const BOOSTER_DEPTH = 60;

    const itemSize = 48;
    const itemGap = 10;
    const barW = boosters.length * (itemSize + itemGap) + 16;
    const barX = 90; // 右移防止遮挡小兔
    const barH = 66;
    const barY = height - barH - 10;

    const barBg = this.add.graphics().setDepth(BOOSTER_DEPTH);
    barBg.fillStyle(0xfffcf2, 0.97);
    barBg.fillRoundedRect(barX, barY, barW, barH, 33);
    barBg.lineStyle(2.5, 0xffb3d9, 1);
    barBg.strokeRoundedRect(barX, barY, barW, barH, 33);

    boosters.forEach((booster, i) => {
      const bx = barX + 8 + i * (itemSize + itemGap) + itemSize / 2;
      const by = barY + barH / 2;
      const count = this.saveData.boosters[booster.id] || 0;

      // 蓝色圆形按钮
      const btn = this.add.graphics().setDepth(BOOSTER_DEPTH + 1);
      btn.fillStyle(count > 0 ? 0x448aff : 0xaaaaaa, 1);
      btn.fillCircle(bx, by, itemSize / 2 - 2);
      btn.lineStyle(2.5, 0xffffff, 0.9);
      btn.strokeCircle(bx, by, itemSize / 2 - 2);
      // 高光
      btn.fillStyle(0xffffff, 0.18);
      btn.fillEllipse(bx, by - 7, 22, 12);

      this.add.text(bx, by - 1, booster.emoji, { fontSize: '18px' })
        .setOrigin(0.5).setDepth(BOOSTER_DEPTH + 2);

      // 数量角标
      if (count > 0) {
        const badge = this.add.graphics().setDepth(BOOSTER_DEPTH + 2);
        badge.fillStyle(0xff4757, 1);
        badge.fillCircle(bx + 13, by + 12, 9);
        this.add.text(bx + 13, by + 12, `${count}`, {
          fontSize: '9px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#fff',
        }).setOrigin(0.5).setDepth(BOOSTER_DEPTH + 3);
      } else {
        // 无库存时显示加号提示
        this.add.text(bx, by + 14, '+购买', {
          fontSize: '7px', fontFamily: 'Nunito', fill: '#ffffff',
        }).setOrigin(0.5).setDepth(BOOSTER_DEPTH + 2);
      }

      // 交互区（zone 防止层级问题）
      const hit = this.add.zone(bx, by, itemSize, itemSize).setInteractive().setDepth(BOOSTER_DEPTH + 3);
      hit.on('pointerdown', () => this._useBooster(booster.id, count));
      hit.on('pointerover', () => this.tweens.add({ targets: btn, scaleX: 1.12, scaleY: 1.12, duration: 80 }));
      hit.on('pointerout', () => this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 80 }));
    });
  }

  _useBooster(boosterId, count) {
    if (count <= 0) {
      this._showFloatText('道具不足！', this.cameras.main.width / 2, 400, '#ff4757');
      return;
    }
    switch (boosterId) {
      case 'shuffle':
        this.board?.shuffleBoard();
        this.saveData.boosters.shuffle = Math.max(0, count - 1);
        break;
      case 'extra':
        if (this.board) {
          this.board.movesLeft += 5;
          this.movesText?.setText(`${this.board.movesLeft}`);
          this.saveData.boosters.extra = Math.max(0, count - 1);
          this._showFloatText('+5步！', this.cameras.main.width - 65, 50, '#20c997');
        }
        break;
      case 'hammer':
        this._activateHammerMode(count);
        break;
      default:
        this._showFloatText('道具已激活！', this.cameras.main.width / 2, 400, '#ff9f5a');
    }
    SaveSystem.save(this.saveData);
  }

  _activateHammerMode(count) {
    this._showFloatText('🔨 锤子就绪！点击消除任意格子', this.cameras.main.width / 2, 200, '#ff9f5a');
    this.hammerMode = true;
    this.saveData.boosters.hammer = Math.max(0, count - 1);
  }

  _showCombo(count) {
    const { width } = this.cameras.main;
    const comboTexts = ['', '', 'COMBO!', '超级COMBO!', '太厉害了！', '无敌！！', '传说中的COMBO！！！'];
    const colors = ['', '', '#ff9800', '#ff4757', '#9c27b0', '#ff6eb4', '#ffd43b'];
    const text = comboTexts[Math.min(count, 6)] || `${count}X COMBO!!!`;
    const color = colors[Math.min(count, 6)] || '#ffd43b';

    this._showFloatText(text, width / 2, 300, color, Math.min(count + 1, 4) * 8 + 16);
  }

  _showFloatText(text, x, y, color = '#ffffff', fontSize = 22) {
    const t = this.add.text(x, y, text, {
      fontSize: `${fontSize}px`, fontFamily: 'Nunito, sans-serif', fontStyle: 'bold',
      fill: color, stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(300);

    this.tweens.add({
      targets: t, y: y - 80, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 1200, ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }

  _onLevelEnd(result, score, stars) {
    this.time.delayedCall(500, () => {
      if (result === 'win') {
        this._showWinScreen(score, stars);
      } else {
        this._showLoseScreen(score);
      }
    });
  }

  _showWinScreen(score, stars) {
    const { width, height } = this.cameras.main;
    this.saveData = SaveSystem.updateLevelResult(this.saveData, this.levelId, score, stars);
    this._launchFireworks();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x5a2d82, 0.7);
    overlay.fillRect(0, 0, width, height);

    const panel = this.add.graphics();
    panel.fillStyle(0xffffff, 1);
    panel.fillRoundedRect(width/2 - 150, height/2 - 180, 300, 360, 30);
    panel.lineStyle(4, 0xff6eb4, 1);
    panel.strokeRoundedRect(width/2 - 150, height/2 - 180, 300, 360, 30);

    this.add.text(width/2, height/2 - 130, '🎉🐰🎉', { fontSize: '36px' }).setOrigin(0.5);

    this.add.text(width/2, height/2 - 80, '关卡完成！', {
      fontSize: '26px', fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#5a2d82',
    }).setOrigin(0.5);

    const starEmojis = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const starTxt = this.add.text(width/2, height/2 - 30, starEmojis, { fontSize: '36px' }).setOrigin(0.5);

    this.add.text(width/2, height/2 + 25, `得分: ${score.toLocaleString()}`, {
      fontSize: '18px', fontFamily: 'Nunito, sans-serif', fill: '#9b59b6', fontStyle: 'bold',
    }).setOrigin(0.5);

    this._addWinButton(width/2 - 70, height/2 + 95, '🗺️ 地图', 0xc77dff, 0x9c27b0, () => this._exitToMap());
    this._addWinButton(width/2 + 70, height/2 + 95, '▶ 下一关', 0xff6eb4, 0xff9f5a, () => {
      if (this.levelId < 50) {
        this.scene.restart({ levelId: this.levelId + 1, saveData: this.saveData });
      } else {
        this._exitToMap();
      }
    });
    this._addWinButton(width/2, height/2 + 148, '🔁 再玩一次', 0x74c0fc, 0x339af0, () => {
      this.scene.restart({ levelId: this.levelId, saveData: this.saveData });
    });
  }

  _showLoseScreen(score) {
    const { width, height } = this.cameras.main;
    this._showBunnyCrying();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x2c2c54, 0.75);
    overlay.fillRect(0, 0, width, height);

    const panel = this.add.graphics();
    panel.fillStyle(0xffffff, 1);
    panel.fillRoundedRect(width/2 - 145, height/2 - 170, 290, 340, 28);
    panel.lineStyle(4, 0xc77dff, 1);
    panel.strokeRoundedRect(width/2 - 145, height/2 - 170, 290, 340, 28);

    this.add.text(width/2, height/2 - 130, '😭', { fontSize: '48px' }).setOrigin(0.5);

    this.add.text(width/2, height/2 - 75, '差一点就成功了！', {
      fontSize: '20px', fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#5a2d82',
    }).setOrigin(0.5);

    this.add.text(width/2, height/2 - 15, `本次得分: ${score.toLocaleString()}`, {
      fontSize: '16px', fontFamily: 'Nunito, sans-serif', fill: '#ff6eb4', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width/2, height/2 + 15, '❤️ 体力未扣除，放心重试！', {
      fontSize: '12px', fontFamily: 'Nunito, sans-serif', fill: '#20c997',
    }).setOrigin(0.5);

    this._addWinButton(width/2, height/2 + 75, '🔁 重新挑战', 0xff6eb4, 0xff9f5a, () => {
      this.scene.restart({ levelId: this.levelId, saveData: this.saveData });
    });
    this._addWinButton(width/2, height/2 + 128, '🗺️ 返回地图', 0xc77dff, 0x9c27b0, () => this._exitToMap());
  }

  _showBunnyCrying() {
    const { width, height } = this.cameras.main;
    const cry = this.add.text(width/2, height/2 - 45, '🐰💧', { fontSize: '44px' }).setOrigin(0.5).setDepth(500);
    this.tweens.add({
      targets: cry, scaleX: 0.8, scaleY: 0.8, duration: 400, yoyo: true, repeat: 3,
      onComplete: () => cry.destroy()
    });
  }

  _addWinButton(x, y, label, colorA, colorB, onClick) {
    const w = 126, h = 44;
    const DEPTH = 500;
    const bg = this.add.graphics().setDepth(DEPTH);
    bg.fillGradientStyle(colorA, colorB, colorA, colorB, 1);
    bg.fillRoundedRect(x - w/2, y - h/2, w, h, h/2);
    bg.fillStyle(0xffffff, 0.2);
    bg.fillEllipse(x, y - h/3, w * 0.6, h * 0.35);
    bg.lineStyle(2.5, 0xffffff, 0.7);
    bg.strokeRoundedRect(x - w/2, y - h/2, w, h, h/2);

    const txt = this.add.text(x, y, label, {
      fontSize: '13px', fontFamily: 'Nunito', fontStyle: 'bold', fill: '#fff',
    }).setOrigin(0.5).setDepth(DEPTH + 1);

    // 使用 zone 确保不被遮挡
    const hit = this.add.zone(x, y, w, h).setInteractive().setDepth(DEPTH + 2);
    hit.on('pointerdown', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 0.93, scaleY: 0.93, duration: 80, yoyo: true });
      onClick();
    });
    hit.on('pointerover', () =>
      this.tweens.add({ targets: [bg, txt], scaleX: 1.04, scaleY: 1.04, duration: 80 })
    );
    hit.on('pointerout', () =>
      this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 80 })
    );
  }

  _launchFireworks() {
    const { width, height } = this.cameras.main;
    const colors = ['🎆', '🎇', '✨', '🌟', '💥', '🎉'];
    for (let i = 0; i < 20; i++) {
      const emoji = colors[Math.floor(Math.random() * colors.length)];
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(100, height - 100);
      const fw = this.add.text(x, y, emoji, { fontSize: `${Phaser.Math.Between(18, 36)}px` }).setAlpha(0).setDepth(200);
      this.tweens.add({
        targets: fw, alpha: 1, duration: 200, delay: i * 80,
        onComplete: () => {
          this.tweens.add({
            targets: fw, alpha: 0, scaleX: 2, scaleY: 2, y: y - 60, duration: 600,
            onComplete: () => fw.destroy()
          });
        }
      });
    }
  }

  _exitToMap() {
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.board?.destroy();
      this.scene.start('MapScene', { saveData: this.saveData, chapter: this.chapterId });
    });
  }

  shutdown() { this.board?.destroy(); }
}
