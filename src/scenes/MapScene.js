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
    this.currentChapter = data.chapter || 1;
  }

  create() {
    this.cameras.main.fadeIn(400);
    const chapter = CHAPTERS[this.currentChapter - 1];

    this._drawBackground(chapter);
    this._drawTopHUD();
    this._drawChapterBanner(chapter);
    this._drawLevelNodes(chapter);
    this._drawNavBar(1); // 地图标签激活
    this._drawBackButton();
  }

  // ── 背景 ─────────────────────────────────
  _drawBackground(chapter) {
    const { width, height } = this.cameras.main;

    if (this.textures.exists('level_map_full')) {
      // 分割地图大图纹理帧
      const texture = this.textures.get('level_map_full');
      if (texture && !texture.has('ch1')) texture.add('ch1', 0, 0, 0, 512, 1024);
      if (texture && !texture.has('ch2')) texture.add('ch2', 0, 512, 0, 512, 1024);
      const frame = chapter.id === 1 ? 'ch1' : 'ch2';
      const bg = this.add.image(width / 2, height / 2, 'level_map_full', frame);
      bg.setDisplaySize(width, height);
    } else {
      // 程序化背景
      const bg = this.add.graphics();
      const c1 = chapter.id === 1 ? 0xffecd2 : 0xd6eaff;
      const c2 = chapter.id === 1 ? 0xffd6f0 : 0xc3e0ff;
      bg.fillGradientStyle(c1, c1, c2, c2, 1);
      bg.fillRect(0, 0, width, height);

      // 装饰路径
      const path = this.add.graphics();
      path.lineStyle(18, 0xffd43b, 0.4);
      path.beginPath();
      path.moveTo(width * 0.5, height * 0.85);
      path.lineTo(width * 0.3, height * 0.72);
      path.lineTo(width * 0.22, height * 0.6);
      path.lineTo(width * 0.3, height * 0.48);
      path.lineTo(width * 0.48, height * 0.4);
      path.lineTo(width * 0.65, height * 0.32);
      path.lineTo(width * 0.42, height * 0.22);
      path.lineTo(width * 0.24, height * 0.16);
      path.strokePath();
    }

    this._drawFloatingDecorations(chapter);
  }

  _drawFloatingDecorations(chapter) {
    const { width, height } = this.cameras.main;
    const navH = height * 0.088;
    const decorEmojis = {
      1: ['🍰', '🧁', '🍭', '🍬', '🎂', '🌸'],
      2: ['❄️', '⛄', '🌨️', '💙', '✨', '🦋'],
    };
    const emojis = decorEmojis[chapter.id] || ['✨'];
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(20, width - 20);
      const y = Phaser.Math.Between(130, height - navH - 100);
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const d = this.add.text(x, y, emoji, {
        fontSize: `${Phaser.Math.Between(14, 22)}px`,
      }).setAlpha(Phaser.Math.FloatBetween(0.2, 0.5)).setDepth(3);
      this.tweens.add({
        targets: d,
        y: y - Phaser.Math.Between(15, 30),
        rotation: Phaser.Math.FloatBetween(-0.2, 0.2),
        alpha: d.alpha * 0.3,
        duration: 2500 + Math.random() * 2500,
        yoyo: true, repeat: -1,
        delay: Math.random() * 1500,
      });
    }
  }

  // ── 顶部 HUD ─────────────────────────────
  _drawTopHUD() {
    const { width, height } = this.cameras.main;
    const d = this.saveData;
    const g = this.add.graphics().setDepth(20);

    const hudY = height * 0.016;
    const hudH = height * 0.068;
    const profW = width * 0.42;

    // 玩家 Profile 胶囊
    g.fillStyle(0xffffff, 0.97);
    g.lineStyle(2.5, 0xffb3d9, 1);
    g.fillRoundedRect(10, hudY, profW, hudH, hudH / 2);
    g.strokeRoundedRect(10, hudY, profW, hudH, hudH / 2);

    const avatarSize = hudH * 0.78;
    const avatarX = 10 + hudH / 2;
    const avatarY = hudY + hudH / 2;
    g.fillStyle(0xffd6f0, 1);
    g.fillCircle(avatarX, avatarY, avatarSize / 2);
    g.lineStyle(2, 0xff6eb4, 1);
    g.strokeCircle(avatarX, avatarY, avatarSize / 2);
    this.add.text(avatarX, avatarY, '🦊', {
      fontSize: `${Math.floor(avatarSize * 0.55)}px`,
    }).setOrigin(0.5).setDepth(21);

    const lvlBg = this.add.graphics().setDepth(21);
    const lvlX = avatarX + avatarSize / 2 + 8;
    const lvlW = profW - avatarSize - 28;
    lvlBg.fillStyle(0x7950f2, 1);
    lvlBg.fillRoundedRect(lvlX, hudY + 6, lvlW * 0.42, hudH * 0.3, 6);
    this.add.text(lvlX + lvlW * 0.21, hudY + 6 + (hudH * 0.3) / 2,
      `Lv.${d.player.level}`, {
        fontSize: `${Math.floor(hudH * 0.21)}px`, fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold', fill: '#ffffff',
      }).setOrigin(0.5).setDepth(22);

    this.add.text(lvlX, hudY + hudH * 0.5, d.player.name, {
      fontSize: `${Math.floor(hudH * 0.26)}px`, fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold', fill: '#5a2d82',
    }).setDepth(22);

    // 右上角胶囊
    const rightH = height * 0.05;
    const rightY = hudY + (hudH - rightH) / 2;
    const pill1X = width * 0.638;
    const pill2X = width * 0.82;
    const pillW = width * 0.162;

    g.fillStyle(0xffffff, 0.97);
    g.fillRoundedRect(pill1X, rightY, pillW, rightH, rightH / 2);
    g.strokeRoundedRect(pill1X, rightY, pillW, rightH, rightH / 2);
    this.add.text(pill1X + pillW / 2, rightY + rightH / 2,
      `❤️ ${d.player.hearts}`, {
        fontSize: `${Math.floor(rightH * 0.48)}px`, fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold', fill: '#ff4757',
      }).setOrigin(0.5).setDepth(21);

    g.fillStyle(0xffffff, 0.97);
    g.fillRoundedRect(pill2X, rightY, pillW, rightH, rightH / 2);
    g.strokeRoundedRect(pill2X, rightY, pillW, rightH, rightH / 2);
    this.add.text(pill2X + pillW / 2, rightY + rightH / 2,
      `🪙 ${d.player.coins}`, {
        fontSize: `${Math.floor(rightH * 0.44)}px`, fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold', fill: '#ff9f5a',
      }).setOrigin(0.5).setDepth(21);

    // 点击头像打开个人主页/登录
    const profHit = this.add.zone(10 + profW / 2, hudY + hudH / 2, profW, hudH)
      .setInteractive().setDepth(23);
    profHit.on('pointerdown', () => {
      const logged = SaveSystem.getCurrentUser();
      if (logged) ModalSystem.showProfileModal(this, this.saveData);
      else ModalSystem.showAuthModal(this, this.saveData, 'login');
    });
  }

  // ── 章节标题横幅 ─────────────────────────
  _drawChapterBanner(chapter) {
    const { width, height } = this.cameras.main;
    const navH = height * 0.088;
    const bannerH = height * 0.055;
    const bannerY = height - navH - bannerH - 10;

    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0xffffff, 0.96);
    g.fillRoundedRect(40, bannerY, width - 80, bannerH, 14);
    g.lineStyle(2.5, 0xffb3d9, 1);
    g.strokeRoundedRect(40, bannerY, width - 80, bannerH, 14);

    this.add.text(width / 2, bannerY + bannerH / 2,
      `${chapter.emoji} 第${chapter.id}章：${chapter.name}`, {
        fontSize: `${Math.floor(bannerH * 0.40)}px`,
        fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#5a2d82',
      }).setOrigin(0.5).setDepth(21);
  }

  // ── 关卡节点 ─────────────────────────────
  _drawLevelNodes(chapter) {
    const { width, height } = this.cameras.main;
    const maxUnlocked = this.saveData.progress.maxLevel;
    const positions = this._getLevelPositions(chapter.id);

    for (let i = 0; i < 10; i++) {
      const levelId = chapter.levels[0] + i;
      const pos = positions[i];
      if (!pos) continue;
      const nodeX = width * pos.xPct;
      const nodeY = height * pos.yPct;
      const stars = this.saveData.progress.levelStars[levelId] || 0;
      const unlocked = levelId <= maxUnlocked;
      const isCurrent = levelId === maxUnlocked;
      this._drawLevelNode(nodeX, nodeY, levelId, stars, unlocked, isCurrent);
    }
  }

  _getLevelPositions(chapterId) {
    if (chapterId === 1) {
      return [
        { xPct: 240 / 512, yPct: 800 / 1024 },
        { xPct: 150 / 512, yPct: 765 / 1024 },
        { xPct: 115 / 512, yPct: 680 / 1024 },
        { xPct: 150 / 512, yPct: 610 / 1024 },
        { xPct: 245 / 512, yPct: 560 / 1024 },
        { xPct: 330 / 512, yPct: 480 / 1024 },
        { xPct: 210 / 512, yPct: 400 / 1024 },
        { xPct: 120 / 512, yPct: 350 / 1024 },
        { xPct: 193 / 512, yPct: 260 / 1024 },
        { xPct: 285 / 512, yPct: 175 / 1024 },
      ];
    } else {
      return [
        { xPct: 245 / 512, yPct: 330 / 1024 },
        { xPct: 115 / 512, yPct: 435 / 1024 },
        { xPct: 260 / 512, yPct: 525 / 1024 },
        { xPct: 385 / 512, yPct: 590 / 1024 },
        { xPct: 193 / 512, yPct: 680 / 1024 },
        { xPct: 375 / 512, yPct: 755 / 1024 },
        { xPct: 136 / 512, yPct: 845 / 1024 },
        { xPct: 398 / 512, yPct: 870 / 1024 },
        { xPct: 205 / 512, yPct: 910 / 1024 },
        { xPct: 318 / 512, yPct: 950 / 1024 },
      ];
    }
  }

  _drawLevelNode(x, y, levelId, stars, unlocked, isCurrent) {
    const { height } = this.cameras.main;
    const radius = isCurrent ? height * 0.037 : height * 0.028;
    const baseDepth = 30;

    if (!unlocked) {
      const node = this.add.graphics().setDepth(baseDepth);
      node.fillStyle(0xd0d0d0, 0.95);
      node.fillCircle(x, y, radius);
      node.lineStyle(3, 0xaaaaaa, 1);
      node.strokeCircle(x, y, radius);
      this.add.text(x, y, '🔒', {
        fontSize: `${Math.floor(radius * 1.0)}px`,
      }).setOrigin(0.5).setDepth(baseDepth + 1);
      return;
    }

    // 当前关卡脉冲光晕
    if (isCurrent) {
      const glow = this.add.graphics().setDepth(baseDepth - 1);
      glow.fillStyle(0x448aff, 0.22);
      glow.fillCircle(x, y, radius + 10);
      this.tweens.add({ targets: glow, scaleX: 1.22, scaleY: 1.22, alpha: 0.05, duration: 900, yoyo: true, repeat: -1 });
    }

    // 节点背景
    const nodeBg = this.add.graphics().setDepth(baseDepth);
    nodeBg.fillStyle(stars > 0 ? 0x64b5f6 : 0x80cbc4, 1);
    nodeBg.fillCircle(x, y, radius);
    nodeBg.lineStyle(isCurrent ? 4 : 3, isCurrent ? 0x0d47a1 : 0x00796b, 1);
    nodeBg.strokeCircle(x, y, radius);

    // 关卡号
    this.add.text(x, y - (stars > 0 ? radius * 0.18 : 0), `${levelId}`, {
      fontSize: `${Math.floor(radius * 1.05)}px`,
      fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#ffffff',
    }).setOrigin(0.5).setDepth(baseDepth + 1);

    // 星星
    if (stars > 0) {
      this.add.text(x, y + radius * 0.5, '⭐'.repeat(stars), {
        fontSize: `${Math.floor(radius * 0.55)}px`,
      }).setOrigin(0.5).setDepth(baseDepth + 1);
    }

    // 交互区（明确设置 depth 确保可点击）
    const hitArea = this.add.zone(x, y, (radius + 8) * 2, (radius + 8) * 2)
      .setInteractive().setDepth(baseDepth + 2);
    hitArea.on('pointerdown', () => this._showLevelStartModal(levelId));
    hitArea.on('pointerover', () =>
      this.tweens.add({ targets: nodeBg, scaleX: 1.12, scaleY: 1.12, duration: 100 })
    );
    hitArea.on('pointerout', () =>
      this.tweens.add({ targets: nodeBg, scaleX: 1, scaleY: 1, duration: 100 })
    );
  }

  // ── 底部导航栏（按需绘制）──────────────────
  _drawNavBar(activeIndex = 1) {
    const { width, height } = this.cameras.main;
    const hasBg = this.textures.exists('level_map_full');
    const navH = height * 0.088;
    const navY = height - navH - 2;

    const actions = [
      () => { this.cameras.main.fadeOut(220); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenuScene')); },
      () => {},  // 地图（当前）
      () => { this.cameras.main.fadeOut(220); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('PetScene', { saveData: this.saveData })); },
      () => ModalSystem.showDailyModal(this, this.saveData),
      () => ModalSystem.showGlobalLeaderboardModal(this),
    ];
    const labels = ['首页', '地图', '宠物', '奖励', '排行'];
    const emojis = ['🏠', '🗺️', '🐰', '🎁', '🏆'];

    if (hasBg) {
      // 背景图已有导航栏视觉 → 仅铺透明热区
      const itemW = width / actions.length;
      actions.forEach((action, i) => {
        const cx = itemW * i + itemW / 2;
        const cy = height * 0.908;
        const hit = this.add.zone(cx, cy, itemW - 4, navH)
          .setInteractive().setDepth(83);
        hit.on('pointerdown', action);
      });
    } else {
      // 无背景图 → 绘制实体导航栏
      const bg = this.add.graphics().setDepth(80);
      bg.fillStyle(0xffffff, 0.97);
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
        this.add.text(cx, cy - 10, emojis[i], { fontSize: '19px' }).setOrigin(0.5).setDepth(82);
        this.add.text(cx, cy + 12, labels[i], {
          fontSize: '9px', fontFamily: 'Nunito, sans-serif',
          fontStyle: 'bold', fill: labelColor,
        }).setOrigin(0.5).setDepth(82);

        const hit = this.add.zone(cx, cy, itemW - 4, navH - 4)
          .setInteractive().setDepth(83);
        hit.on('pointerdown', action);
      });
    }
  }

  // ── 返回按钮（修复层级）──────────────────
  _drawBackButton() {
    const { height } = this.cameras.main;
    const hudH = height * 0.068;
    const btnY = height * 0.016 + hudH + 10;
    const btnH = height * 0.04;
    const btnW = 90;

    // 按钮背景
    const btnBg = this.add.graphics().setDepth(50);
    btnBg.fillStyle(0x7950f2, 0.9);
    btnBg.fillRoundedRect(10, btnY, btnW, btnH, btnH / 2);

    const btnLabel = this.add.text(10 + btnW / 2, btnY + btnH / 2, '← 返回', {
      fontSize: `${Math.floor(btnH * 0.45)}px`,
      fontFamily: 'Nunito, sans-serif', fontStyle: 'bold',
      fill: '#ffffff',
    }).setOrigin(0.5).setDepth(51);

    // 点击区域（明确高 depth 确保不被遮挡）
    const hit = this.add.zone(10 + btnW / 2, btnY + btnH / 2, btnW, btnH)
      .setInteractive().setDepth(52);
    hit.on('pointerdown', () => {
      this.tweens.add({ targets: [btnBg, btnLabel], scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true });
      this.cameras.main.fadeOut(220);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenuScene'));
    });
    hit.on('pointerover', () =>
      this.tweens.add({ targets: btnBg, scaleX: 1.05, scaleY: 1.05, duration: 80 })
    );
    hit.on('pointerout', () =>
      this.tweens.add({ targets: btnBg, scaleX: 1, scaleY: 1, duration: 80 })
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
    h.textContent = `🌸 第 ${levelId} 关`;

    const objTitle = document.createElement('div');
    objTitle.style.cssText = 'font-weight:bold;color:#5a2d82;font-size:14px;margin-top:10px;';
    objTitle.textContent = '🎯 通关目标';

    const objs = document.createElement('div');
    objs.style.cssText = 'display:flex;justify-content:center;gap:14px;margin:8px 0 14px;flex-wrap:wrap;';
    levelData.objectives.forEach(obj => {
      const item = document.createElement('div');
      item.style.cssText = 'background:#fff0f8;padding:6px 12px;border-radius:20px;border:1.5px solid #ffb3d9;font-size:12px;color:#ff6eb4;font-weight:bold;';
      item.textContent = `${obj.emoji || '🍓'} 消除 x ${obj.count}`;
      objs.appendChild(item);
    });

    const myBest = document.createElement('div');
    myBest.style.cssText = 'background:#fdfbf7;border:2px solid #ffdcb9;border-radius:16px;padding:10px;margin:10px 0;font-size:12px;color:#5a2d82;';
    myBest.innerHTML = `
      <div>我的历史最高分: <span style="font-weight:bold;color:#ff9f5a;">${prevScore.toLocaleString()} 分</span></div>
      <div style="font-size:16px;margin-top:4px;">${'⭐'.repeat(prevStars) + '☆'.repeat(3 - prevStars)}</div>
    `;

    const boardTitle = document.createElement('div');
    boardTitle.style.cssText = 'font-weight:bold;color:#5a2d82;font-size:13px;border-top:1px dashed #ffb3d9;padding-top:10px;margin-top:10px;';
    boardTitle.textContent = '🏆 本关排行榜 (Top 5)';

    const boardList = document.createElement('div');
    boardList.style.cssText = 'font-size:12px;color:#9b59b6;margin:8px 0;min-height:65px;max-height:140px;overflow-y:auto;';
    boardList.textContent = '⏳ 排行榜加载中...';

    const startBtn = document.createElement('button');
    startBtn.className = 'modal-btn btn-primary';
    startBtn.style.cssText = 'width:100%;margin:10px 0 6px 0;';
    startBtn.textContent = '🎮 开始挑战 (消耗 ❤️ 1)';
    startBtn.onclick = () => {
      if (this.saveData.player.hearts <= 0) {
        alert('💔 体力不足！请等待回复或稍后再试。');
        return;
      }
      this.saveData.player.hearts--;
      this.saveData.player.lastHeartTime = Date.now();
      SaveSystem.save(this.saveData);
      this._hideModal();
      this.cameras.main.fadeOut(220);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('GameScene', { levelId, saveData: this.saveData })
      );
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.style.width = '100%';
    closeBtn.textContent = '关闭';
    closeBtn.onclick = () => this._hideModal();

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
        const starsStr = '⭐'.repeat(item.stars || 0);
        tr.innerHTML = `
          <td style="width:25px;font-weight:bold;">${i + 1}</td>
          <td style="font-weight:bold;">${item.username}</td>
          <td style="text-align:right;color:#ff9f5a;">${starsStr}</td>
          <td style="text-align:right;font-weight:bold;color:#ff6eb4;">${item.score.toLocaleString()}</td>
        `;
        table.appendChild(tr);
      });
      boardList.appendChild(table);
    } else {
      boardList.textContent = '📭 暂无本关排名数据，抢先挑战夺魁！';
    }
  }

  shutdown() { ModalSystem.hideModal(); }
}
