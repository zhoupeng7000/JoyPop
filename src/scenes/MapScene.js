// =============================================
// JoyPop 关卡地图场景 v3 - 全实体绘制版
// =============================================
import { CHAPTERS } from '../config/GameConfig.js';
import { SaveSystem } from '../utils/SaveSystem.js';
import { APIClient } from '../utils/APIClient.js';
import { getLevel } from '../config/LevelData.js';
import { ModalSystem } from '../utils/ModalSystem.js';

export class MapScene extends Phaser.Scene {
  constructor() { super({ key: 'MapScene' }); }

  init(data) {
    this.saveData = data.saveData || SaveSystem.load();
    
    // 自动根据用户的 maxLevel 决定初始展示的章节
    const maxLevel = this.saveData.progress.maxLevel || 1;
    let autoChapter = 1;
    if (maxLevel <= 10) autoChapter = 1;
    else if (maxLevel <= 20) autoChapter = 2;
    else if (maxLevel <= 30) autoChapter = 3;
    else if (maxLevel <= 40) autoChapter = 4;
    else autoChapter = 5;

    this.currentChapter = data.chapter || autoChapter;
  }

  create() {
    this.cameras.main.fadeIn(400);

    this._sliceMapTexture();
    this._drawBackground();
    this._drawTopHUD();
    this._drawTitle(this.cameras.main.width, this.cameras.main.height);
    this._drawLevelNodes();
  }

  _sliceMapTexture() {
    const texture = this.textures.get('level_map_full');
    if (texture) {
      if (!texture.has('ch1')) {
        texture.add('ch1', 0, 0, 0, 512, 1024);
      }
      if (!texture.has('ch2')) {
        texture.add('ch2', 0, 512, 0, 512, 1024);
      }
    }
  }

  // ── 背景 ─────────────────────────────────
  _drawBackground() {
    const { width, height } = this.cameras.main;
    const textureKey = 'level_map_full';

    if (this.textures.exists(textureKey)) {
      // 奇数章节使用左半边 ch1，偶数章节使用右半边 ch2
      const frame = (this.currentChapter % 2 === 1) ? 'ch1' : 'ch2';
      const bg = this.add.image(width / 2, height / 2, textureKey, frame);
      bg.setDisplaySize(width, height);
    } else {
      // 程序化背景
      const bg = this.add.graphics();
      bg.fillGradientStyle(0xffecd2, 0xffecd2, 0xffd6f0, 0xffd6f0, 1);
      bg.fillRect(0, 0, width, height);
    }
  }

  // ── 顶部 HUD ─────────────────────────────
  _drawTopHUD() {
    const { width, height } = this.cameras.main;
    const d = this.saveData;
    const hudY = height * 0.016;
    const hudH = Math.min(38, height * 0.05);

    const margin = 8;
    const gap = 6;
    const gearSize = hudH * 1.1;

    // 设置齿轮按钮 (右上角)
    const gearX = width - margin - gearSize / 2;
    const gearY = hudY + hudH / 2;

    const gearBtn = this.add.image(gearX, gearY, 'ui_settings_btn')
      .setDisplaySize(gearSize, gearSize)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });

    gearBtn.on('pointerdown', () => {
      this.tweens.add({ targets: gearBtn, scaleX: 0.88, scaleY: 0.88, duration: 80, yoyo: true });
      this.time.delayedCall(100, () => {
        ModalSystem.showNavigationSettingsModal(this, this.saveData);
      });
    });
    gearBtn.on('pointerover', () => this.tweens.add({ targets: gearBtn, scaleX: 1.08, scaleY: 1.08, duration: 80 }));
    gearBtn.on('pointerout', () => this.tweens.add({ targets: gearBtn, scaleX: 1, scaleY: 1, duration: 80 }));

    // 计算三个胶囊的可用宽度 (金币、星星、体力)
    const availableW = gearX - gearSize / 2 - margin - gap * 3;
    const pillW = Math.floor(availableW / 3);

    const coinX = margin;
    const starX = coinX + pillW + gap;
    const heartX = starX + pillW + gap;

    // 统计星星总数
    let totalStars = 0;
    if (d.progress && d.progress.levelStars) {
      totalStars = Object.values(d.progress.levelStars).reduce((sum, s) => sum + s, 0);
    }

    // 1. 金币胶囊
    this._drawHUDCapsule(coinX, hudY, pillW, hudH, 'ui_coin', `${d.player.coins}`, () => {
      d.player.coins += 100;
      SaveSystem.save(d);
      this.scene.restart({ saveData: d });
    });

    // 2. 星星胶囊
    this._drawHUDCapsule(starX, hudY, pillW, hudH, 'star_gold', `${totalStars}`, () => {
      ModalSystem.showAchievementsModal(this);
    });

    // 3. 体力胶囊
    this._drawHUDCapsule(heartX, hudY, pillW, hudH, 'ui_heart', `${d.player.hearts}/5`, () => {
      if (d.player.hearts < 5) {
        d.player.hearts = 5;
        SaveSystem.save(d);
        this.scene.restart({ saveData: d });
      }
    });
  }

  _drawHUDCapsule(x, y, w, h, iconKey, valueText, onClickPlus) {
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x000000, 0.08);
    g.fillRoundedRect(x + 1.5, y + 2, w, h, h / 2);
    g.fillStyle(0xfffbeb, 1);
    g.fillRoundedRect(x, y, w, h, h / 2);
    g.lineStyle(2.5, 0xfcd34d, 1);
    g.strokeRoundedRect(x, y, w, h, h / 2);

    const iconSize = h * 0.9;
    const icon = this.add.image(x + h / 2 + 1, y + h / 2, iconKey)
      .setDisplaySize(iconSize, iconSize)
      .setDepth(21);

    const textX = x + h + 2;
    const text = this.add.text(textX, y + h / 2, valueText, {
      fontSize: `${Math.floor(h * 0.38)}px`,
      fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold',
      fill: '#5d4037',
    }).setOrigin(0, 0.5).setDepth(21);

    const plusSize = h * 0.85;
    const plusBtn = this.add.image(x + w - plusSize / 2 - 2, y + h / 2, 'ui_plus_btn')
      .setDisplaySize(plusSize, plusSize)
      .setDepth(22)
      .setInteractive({ useHandCursor: true });

    plusBtn.on('pointerdown', () => {
      this.tweens.add({ targets: plusBtn, scaleX: 0.85, scaleY: 0.85, duration: 80, yoyo: true });
      onClickPlus();
    });

    return [g, icon, text, plusBtn];
  }

  _getLevelPositions(chapterId) {
    if (chapterId % 2 === 1) {
      // 奇数章节 (1, 3, 5) 关卡百分比位置坐标 (对应 512x1024 设计稿)
      return [
        { xPct: 240 / 512, yPct: 800 / 1024, color: 0x2ed573 },
        { xPct: 150 / 512, yPct: 765 / 1024, color: 0x2ed573 },
        { xPct: 115 / 512, yPct: 680 / 1024, color: 0xff4757 },
        { xPct: 150 / 512, yPct: 610 / 1024, color: 0x1e90ff },
        { xPct: 245 / 512, yPct: 560 / 1024, color: 0xff4757 },
        { xPct: 330 / 512, yPct: 480 / 1024, color: 0x1e90ff },
        { xPct: 210 / 512, yPct: 400 / 1024, color: 0xff4757 },
        { xPct: 120 / 512, yPct: 350 / 1024, color: 0x9c27b0 },
        { xPct: 193 / 512, yPct: 260 / 1024, color: 0xff9f43 },
        { xPct: 285 / 512, yPct: 175 / 1024, color: 0x1e90ff },
      ];
    } else {
      // 偶数章节 (2, 4) 关卡百分比位置坐标 (对应 512x1024 设计稿)
      return [
        { xPct: 245 / 512, yPct: 330 / 1024, color: 0x9c27b0 },
        { xPct: 115 / 512, yPct: 435 / 1024, color: 0x2ed573 },
        { xPct: 260 / 512, yPct: 525 / 1024, color: 0xff9f43 },
        { xPct: 385 / 512, yPct: 590 / 1024, color: 0xff9f43 },
        { xPct: 193 / 512, yPct: 680 / 1024, color: 0xff6b81 },
        { xPct: 375 / 512, yPct: 755 / 1024, color: 0x9c27b0 },
        { xPct: 136 / 512, yPct: 845 / 1024, color: 0xff4757 },
        { xPct: 398 / 512, yPct: 922 / 1024, color: 0xff9f43 },
        { xPct: 205 / 512, yPct: 998 / 1024, color: 0x2ed573 },
        { xPct: 318 / 512, yPct: 1038 / 1024, color: 0x1e90ff },
      ];
    }
  }

  // ── 标题 ─────────────────────────────────
  _drawTitle(width, height) {
    const titleY = height * 0.12;
    const cx = width / 2;

    const chapter = CHAPTERS[this.currentChapter - 1] || CHAPTERS[0];

    const titleText = this.add.text(cx, titleY, 'HAPPY POP', {
      fontSize: `${Math.floor(height * 0.046)}px`,
      fontFamily: 'Outfit, Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      fill: '#fbbf24',
      stroke: '#5d4037',
      strokeThickness: 6,
      shadow: { color: '#3e2723', fill: true, offsetX: 2, offsetY: 3, blur: 0 }
    }).setOrigin(0.5).setDepth(14);

    this.tweens.add({
      targets: titleText, scaleX: 1.04, scaleY: 1.04, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    const chapterText = `Chapter ${chapter.id}: ${chapter.name}`;
    const signW = 160;
    const signH = 22;
    const signY = titleY + height * 0.045;

    const sign = this.add.graphics().setDepth(15);
    sign.fillStyle(0x000000, 0.12);
    sign.fillRoundedRect(cx - signW / 2 + 2, signY - signH / 2 + 2, signW, signH, 6);
    sign.fillStyle(0x8d6e63, 1);
    sign.fillRoundedRect(cx - signW / 2, signY - signH / 2, signW, signH, 6);
    sign.lineStyle(1.8, 0xfbbf24, 1);
    sign.strokeRoundedRect(cx - signW / 2, signY - signH / 2, signW, signH, 6);

    this.add.text(cx, signY, chapterText, {
      fontSize: '11px', fontFamily: 'Outfit, Nunito, Arial, sans-serif', fontStyle: 'bold', fill: '#ffffff',
      stroke: '#4a2f1b', strokeThickness: 2.5
    }).setOrigin(0.5).setDepth(16);

    // 绘制左右切页按钮
    if (this.currentChapter > 1) {
      const leftBtn = this.add.text(cx - signW / 2 - 20, signY, '◀', {
        fontSize: '14px', fontFamily: 'Arial, sans-serif', fill: '#ffffff',
        stroke: '#4a2f1b', strokeThickness: 3
      }).setOrigin(0.5).setDepth(16).setInteractive({ useHandCursor: true });
      
      leftBtn.on('pointerdown', () => {
        this.tweens.add({ targets: leftBtn, scaleX: 0.8, scaleY: 0.8, duration: 80, yoyo: true });
        this.time.delayedCall(100, () => {
          this.scene.restart({ saveData: this.saveData, chapter: this.currentChapter - 1 });
        });
      });
    }

    if (this.currentChapter < CHAPTERS.length) {
      const rightBtn = this.add.text(cx + signW / 2 + 20, signY, '▶', {
        fontSize: '14px', fontFamily: 'Arial, sans-serif', fill: '#ffffff',
        stroke: '#4a2f1b', strokeThickness: 3
      }).setOrigin(0.5).setDepth(16).setInteractive({ useHandCursor: true });
      
      rightBtn.on('pointerdown', () => {
        this.tweens.add({ targets: rightBtn, scaleX: 0.8, scaleY: 0.8, duration: 80, yoyo: true });
        this.time.delayedCall(100, () => {
          this.scene.restart({ saveData: this.saveData, chapter: this.currentChapter + 1 });
        });
      });
    }
  }

  _drawLevelNodes() {
    const { width, height } = this.cameras.main;
    const maxUnlocked = this.saveData.progress.maxLevel;
    const chapter = CHAPTERS[this.currentChapter - 1] || CHAPTERS[0];
    const positions = this._getLevelPositions(this.currentChapter);

    positions.forEach((pos, idx) => {
      const levelId = chapter.levels[0] + idx;
      
      // 防止绘制越界关卡 (最大50关)
      if (levelId > 50) return;

      const nodeX = width * pos.xPct;
      const nodeY = height * pos.yPct;

      const stars = this.saveData.progress.levelStars[levelId] || 0;
      const unlocked = levelId <= maxUnlocked;
      const isCurrent = levelId === maxUnlocked;

      this._drawLevelNode(nodeX, nodeY, levelId, stars, unlocked, isCurrent, pos.color);
    });

    this._placeAnimals(width, height);
    this._drawNavBar(width, height, 1);
  }

  _drawLevelNode(x, y, levelId, stars, unlocked, isCurrent, nodeColor) {
    const { height } = this.cameras.main;
    const radius = isCurrent ? height * 0.032 : height * 0.026;
    const baseDepth = 30;

    if (!unlocked) {
      const node = this.add.graphics().setDepth(baseDepth);
      node.fillStyle(0xd0d0d0, 0.95);
      node.fillCircle(x, y, radius);
      node.lineStyle(3, 0xaaaaaa, 1);
      node.strokeCircle(x, y, radius);
      
      this.add.image(x, y, 'ui_lock')
        .setDisplaySize(radius * 1.3, radius * 1.3)
        .setDepth(baseDepth + 1);
      return;
    }

    if (isCurrent) {
      const glow = this.add.graphics().setDepth(baseDepth - 1);
      glow.setPosition(x, y);
      glow.fillStyle(0xfff59d, 0.4);
      glow.fillCircle(0, 0, radius + 10);
      this.tweens.add({ targets: glow, scaleX: 1.25, scaleY: 1.25, alpha: 0, duration: 1000, repeat: -1 });
    }

    const nodeBg = this.add.graphics().setDepth(baseDepth);
    // 阴影
    nodeBg.fillStyle(0x000000, 0.15);
    nodeBg.fillCircle(x + 1.5, y + 2, radius);
    
    // 圆形节点
    nodeBg.fillStyle(nodeColor, 1);
    nodeBg.fillCircle(x, y, radius);
    nodeBg.lineStyle(isCurrent ? 4 : 2.5, 0xffffff, 1);
    nodeBg.strokeCircle(x, y, radius);

    // 内部高光
    nodeBg.fillStyle(0xffffff, 0.3);
    nodeBg.fillEllipse(x - radius / 3, y - radius / 3, radius * 0.45, radius * 0.28);

    // 关卡号
    this.add.text(x, y, `${levelId}`, {
      fontSize: `${Math.floor(radius * 0.95)}px`,
      fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#ffffff',
    }).setOrigin(0.5).setDepth(baseDepth + 1);

    // 绘制三个拱形小星星 (始终占位)
    const starY = y - radius - 8;
    const starSize = radius * 0.52;
    const starKeys = [
      stars >= 1 ? 'star_gold' : 'star_gray',
      stars >= 2 ? 'star_gold' : 'star_gray',
      stars >= 3 ? 'star_gold' : 'star_gray',
    ];
    const offsets = [
      { dx: -starSize * 1.1, dy: 3 },
      { dx: 0, dy: 0 },
      { dx: starSize * 1.1, dy: 3 }
    ];
    starKeys.forEach((key, sIdx) => {
      const offset = offsets[sIdx];
      this.add.image(x + offset.dx, starY + offset.dy, key)
        .setDisplaySize(starSize, starSize)
        .setDepth(baseDepth + 1);
    });

    // Level 文本标签
    this.add.text(x, y + radius + 11, `Level ${levelId}`, {
      fontSize: '8px', fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#ffffff',
      stroke: '#4a2f1b', strokeThickness: 3
    }).setOrigin(0.5).setDepth(baseDepth + 1);

    // 交互区
    const hitArea = this.add.zone(x, y, (radius + 8) * 2, (radius + 8) * 2)
      .setInteractive().setDepth(baseDepth + 2);
    hitArea.on('pointerdown', () => this._showLevelStartModal(levelId));
  }

  _placeAnimals(width, height) {
    const isOdd = this.currentChapter % 2 === 1;
    const animalPositions = isOdd ? [
      { key: 'ui_animal_bunny', xPct: 0.62, yPct: 0.45, scale: 0.38, isBunny: true },
      { key: 'ui_animal_frog',  xPct: 0.42, yPct: 0.66, scale: 0.38 },
      { key: 'ui_animal_chick', xPct: 0.28, yPct: 0.34, scale: 0.38 },
    ] : [
      { key: 'ui_animal_bunny', xPct: 0.32, yPct: 0.45, scale: 0.38, isBunny: true },
      { key: 'ui_animal_frog',  xPct: 0.72, yPct: 0.66, scale: 0.38 },
      { key: 'ui_animal_chick', xPct: 0.62, yPct: 0.34, scale: 0.38 },
    ];

    animalPositions.forEach(p => {
      const ax = width * p.xPct;
      const ay = height * p.yPct;
      const animal = this.add.image(ax, ay, p.key)
        .setDisplaySize(80 * p.scale, 80 * p.scale)
        .setDepth(35);

      this.tweens.add({
        targets: animal,
        y: ay - 6,
        duration: 1000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      if (p.isBunny) {
        animal.setInteractive({ useHandCursor: true });
        animal.on('pointerdown', () => {
          this.tweens.add({ targets: animal, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
          this.time.delayedCall(150, () => {
            this.cameras.main.fadeOut(220);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.start('PetScene', { saveData: this.saveData });
            });
          });
        });
      }
    });
  }

  // ── 底部导航栏 ────────────────────────────
  _drawNavBar(width, height, activeIndex = 0) {
    const navH = height * 0.088;
    const navY = height - navH - 2;

    const actions = [
      () => { this.cameras.main.fadeOut(220); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenuScene')); },
      () => {},
      () => { this.cameras.main.fadeOut(220); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('PetScene', { saveData: this.saveData })); },
      () => ModalSystem.showDailyModal(this, this.saveData),
      () => ModalSystem.showGlobalLeaderboardModal(this),
    ];
    const labels = ['首页', '地图', '宠物', '奖励', '排行'];
    const navTextures = ['ui_nav_home', 'ui_nav_map', 'ui_nav_pet', 'ui_nav_gift', 'ui_nav_trophy'];

    const bg = this.add.graphics().setDepth(80);
    bg.fillStyle(0xffffff, 0.94);
    bg.fillRoundedRect(8, navY + 4, width - 16, navH - 4, 22);
    bg.lineStyle(2.5, 0xffb3d9, 1);
    bg.strokeRoundedRect(8, navY + 4, width - 16, navH - 4, 22);

    const itemW = (width - 16) / actions.length;
    actions.forEach((action, i) => {
      const cx = 8 + itemW * i + itemW / 2;
      const cy = navY + 4 + (navH - 4) / 2;

      if (i === activeIndex) {
        const pill = this.add.graphics().setDepth(81);
        pill.fillStyle(0xff6eb4, 1);
        pill.fillRoundedRect(cx - 28, cy - 20, 56, 40, 20);
      }

      const labelColor = i === activeIndex ? '#ffffff' : '#b39ddb';
      
      const icon = this.add.image(cx, cy - 8, navTextures[i])
        .setDisplaySize(28, 28).setDepth(82);
      icon.setAlpha(i === activeIndex ? 1 : 0.65);

      this.add.text(cx, cy + 12, labels[i], {
        fontSize: '9px', fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold', fill: labelColor,
      }).setOrigin(0.5).setDepth(82);

      const hit = this.add.zone(cx, cy, itemW - 4, navH - 4)
        .setInteractive().setDepth(83);
      hit.on('pointerdown', action);
    });
  }

  _drawBackButton() {
    const { height } = this.cameras.main;
    const hudH = height * 0.068;
    const btnY = height * 0.016 + hudH + 8;
    const btnSize = Math.max(34, Math.floor(height * 0.046));

    // 使用我们全新的圆形返回箭头纹理 ui_arrow_back
    const btn = this.add.image(10 + btnSize / 2, btnY + btnSize / 2, 'ui_arrow_back')
      .setDisplaySize(btnSize, btnSize).setDepth(51).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.tweens.add({ targets: btn, scaleX: 0.93, scaleY: 0.93, duration: 80, yoyo: true });
      this.cameras.main.fadeOut(220);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenuScene'));
    });
    btn.on('pointerover', () =>
      this.tweens.add({ targets: btn, scaleX: 1.08, scaleY: 1.08, duration: 80 })
    );
    btn.on('pointerout', () =>
      this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 80 })
    );
  }

  // ── 关卡开始弹窗 ─────────────────────────
  async _showLevelStartModal(levelId) {
    const prevScore = this.saveData.progress.levelScores?.[levelId] || 0;
    const prevStars = this.saveData.progress.levelStars?.[levelId] || 0;
    const levelData = getLevel(levelId);

    const overlay = document.createElement('div');
    overlay.className = 'game-modal-overlay';
    overlay.id = 'game-modal';

    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.style.width = '330px';

    const h = document.createElement('div');
    h.className = 'modal-title';
    h.textContent = `第 ${levelId} 关`;

    const objTitle = document.createElement('div');
    objTitle.style.cssText = 'font-weight:bold;color:#5a2d82;font-size:14px;margin-top:10px;';
    objTitle.textContent = '通关目标';

    const objs = document.createElement('div');
    objs.style.cssText = 'display:flex;justify-content:center;gap:14px;margin:8px 0 14px;flex-wrap:wrap;';
    levelData.objectives.forEach(obj => {
      const item = document.createElement('div');
      item.style.cssText = 'background:#fff0f8;padding:6px 12px;border-radius:20px;border:1.5px solid #ffb3d9;font-size:12px;color:#ff6eb4;font-weight:bold;display:flex;align-items:center;';
      const iconUrl = this.textures.getBase64(obj.icon || 'tile_strawberry');
      item.innerHTML = `<img src="${iconUrl}" style="width:18px;height:18px;margin-right:6px;" /> 消除 x ${obj.count}`;
      objs.appendChild(item);
    });

    const myBest = document.createElement('div');
    myBest.style.cssText = 'background:#fdfbf7;border:2px solid #ffdcb9;border-radius:16px;padding:10px;margin:10px 0;font-size:12px;color:#5a2d82;';
    myBest.innerHTML = `
      <div>我的历史最高分: <span style="font-weight:bold;color:#ff9f5a;">${prevScore.toLocaleString()} 分</span></div>
      <div style="margin-top:6px;display:flex;gap:4px;">
        ${Array.from({length:3}).map((_, i) => `<img src="${this.textures.getBase64(i < prevStars ? 'star_gold' : 'star_gray')}" style="width:18px;height:18px;" />`).join('')}
      </div>
    `;

    const boardTitle = document.createElement('div');
    boardTitle.style.cssText = 'font-weight:bold;color:#5a2d82;font-size:13px;border-top:1px dashed #ffb3d9;padding-top:10px;margin-top:10px;';
    boardTitle.innerHTML = `<img src="${this.textures.getBase64('ui_nav_trophy')}" style="width:16px;vertical-align:middle;margin-right:4px;" /> 本关排行榜 (Top 5)`;

    const boardList = document.createElement('div');
    boardList.style.cssText = 'font-size:12px;color:#9b59b6;margin:8px 0;min-height:65px;max-height:140px;overflow-y:auto;';
    boardList.textContent = '排行榜加载中...';

    const startBtn = document.createElement('button');
    startBtn.className = 'modal-btn btn-primary';
    startBtn.style.cssText = 'width:100%;margin:10px 0 6px 0;display:flex;align-items:center;justify-content:center;gap:6px;';
    startBtn.innerHTML = `<img src="${this.textures.getBase64('ui_nav_map')}" style="width:18px;" /> 开始挑战 (消耗 <img src="${this.textures.getBase64('ui_heart')}" style="width:14px;" /> 1)`;
    startBtn.onclick = () => {
      if (this.saveData.player.hearts <= 0) {
        alert('体力不足！请等待回复或稍后再试。');
        return;
      }
      this.saveData.player.hearts--;
      this.saveData.player.lastHeartTime = Date.now();
      SaveSystem.save(this.saveData);
      ModalSystem.hideModal();
      this.cameras.main.fadeOut(220);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('GameScene', { levelId, saveData: this.saveData })
      );
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.style.width = '100%';
    closeBtn.textContent = '关闭';
    closeBtn.onclick = () => ModalSystem.hideModal();

    modal.appendChild(h);
    modal.appendChild(objTitle);
    modal.appendChild(objs);
    modal.appendChild(myBest);
    modal.appendChild(boardTitle);
    modal.appendChild(boardList);
    modal.appendChild(startBtn);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // 异步加载排行榜
    const res = await APIClient.getLevelLeaderboard(levelId);
    if (res.success && res.leaderboard && res.leaderboard.length > 0) {
      boardList.innerHTML = '';
      const table = document.createElement('table');
      table.style.cssText = 'width:100%;border-collapse:collapse;color:#5a2d82;';
      res.leaderboard.forEach((item, i) => {
        const tr = document.createElement('tr');
        tr.style.cssText = 'height:26px;border-bottom:1px solid #fff0f8;';
        const starsHtml = Array.from({length: item.stars || 0}).map(() => `<img src="${this.textures.getBase64('star_gold')}" style="width:14px;height:14px;vertical-align:middle;" />`).join('');
        tr.innerHTML = `
          <td style="width:25px;font-weight:bold;">${i + 1}</td>
          <td style="font-weight:bold;">${item.username}</td>
          <td style="text-align:right;color:#ff9f5a;">${starsHtml}</td>
          <td style="text-align:right;font-weight:bold;color:#ff6eb4;">${item.score.toLocaleString()}</td>
        `;
        table.appendChild(tr);
      });
      boardList.appendChild(table);
    } else {
      boardList.textContent = '暂无本关排名数据，抢先挑战夺魁！';
    }
  }

  shutdown() { ModalSystem.hideModal(); }
}
