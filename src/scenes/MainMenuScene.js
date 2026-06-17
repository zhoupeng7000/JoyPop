// =============================================
// JoyPop 主菜单场景 v3 - 全实体绘制版
// =============================================
import { SaveSystem } from '../utils/SaveSystem.js';
import { APIClient } from '../utils/APIClient.js';
import { ModalSystem } from '../utils/ModalSystem.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MainMenuScene' }); }

  create() {
    this.saveData = SaveSystem.load();
    SaveSystem.rechargeHearts(this.saveData);

    const { width, height } = this.cameras.main;
    this.cameras.main.fadeIn(400);

    this._drawBackground(width, height);
    this._drawTopHUD(width, height);
    this._drawTitle(width, height);
    this._drawCharacter(width, height);
    this._drawPlayButton(width, height);
    this._drawNavBar(width, height, 0);
    this._drawFloatingParticles(width, height);
    this._checkDailyReward();
  }

  // ── 背景 ─────────────────────────────────
  _drawBackground(width, height) {
    // 先尝试加载背景图，失败则用渐变
    if (this.textures.exists('main_menu_bg')) {
      const bg = this.add.image(width / 2, height / 2, 'main_menu_bg');
      bg.setDisplaySize(width, height);
    } else {
      // 程序化渐变背景
      const bg = this.add.graphics();
      bg.fillGradientStyle(0xffd6f0, 0xffd6f0, 0xffecd2, 0xffe4f5, 1);
      bg.fillRect(0, 0, width, height);
      // 顶部大圆弧装饰
      const arc = this.add.graphics();
      arc.fillStyle(0xff6eb4, 0.12);
      arc.fillCircle(width * 0.85, -height * 0.1, height * 0.55);
      const arc2 = this.add.graphics();
      arc2.fillStyle(0xc77dff, 0.10);
      arc2.fillCircle(width * 0.1, height * 0.9, height * 0.45);
    }
  }

  // ── 顶部 HUD ─────────────────────────────
  _drawTopHUD(width, height) {
    const d = this.saveData;
    const g = this.add.graphics();
    g.setDepth(10);

    const hudY = height * 0.016;
    const hudH = height * 0.068;
    const profW = width * 0.42;

    // 1. 玩家 Profile 胶囊
    g.fillStyle(0xffffff, 0.96);
    g.lineStyle(2.5, 0xffb3d9, 1);
    g.fillRoundedRect(10, hudY, profW, hudH, hudH / 2);
    g.strokeRoundedRect(10, hudY, profW, hudH, hudH / 2);

    // 头像圆
    const avatarSize = hudH * 0.78;
    const avatarX = 10 + hudH / 2;
    const avatarY = hudY + hudH / 2;
    g.fillStyle(0xffd6f0, 1);
    g.fillCircle(avatarX, avatarY, avatarSize / 2);
    g.lineStyle(2, 0xff6eb4, 1);
    g.strokeCircle(avatarX, avatarY, avatarSize / 2);
    this.add.text(avatarX, avatarY, '🦊', {
      fontSize: `${Math.floor(avatarSize * 0.55)}px`,
    }).setOrigin(0.5).setDepth(11);

    // 等级徽章
    const lvlBg = this.add.graphics().setDepth(11);
    const lvlX = avatarX + avatarSize / 2 + 8;
    const lvlW = profW - avatarSize - 28;
    lvlBg.fillStyle(0x7950f2, 1);
    lvlBg.fillRoundedRect(lvlX, hudY + 6, lvlW * 0.42, hudH * 0.3, 6);
    this.add.text(lvlX + lvlW * 0.21, hudY + 6 + (hudH * 0.3) / 2,
      `Lv.${d.player.level}`, {
        fontSize: `${Math.floor(hudH * 0.21)}px`, fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold', fill: '#ffffff',
      }).setOrigin(0.5).setDepth(12);

    this.add.text(lvlX, hudY + hudH * 0.5, d.player.name, {
      fontSize: `${Math.floor(hudH * 0.26)}px`, fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold', fill: '#5a2d82',
    }).setDepth(12);

    // 点击打开个人主页
    const profHit = this.add.zone(10 + profW / 2, hudY + hudH / 2, profW, hudH)
      .setInteractive().setDepth(13);
    profHit.on('pointerdown', () => {
      const logged = SaveSystem.getCurrentUser();
      if (logged) ModalSystem.showProfileModal(this, this.saveData);
      else ModalSystem.showAuthModal(this, this.saveData, 'login');
    });

    // 2. 右上角胶囊行
    const rightH = height * 0.05;
    const rightY = hudY + (hudH - rightH) / 2;
    const pill1X = width * 0.638;
    const pill2X = width * 0.82;
    const pillW = width * 0.162;

    // 爱心胶囊
    g.fillStyle(0xffffff, 0.96);
    g.fillRoundedRect(pill1X, rightY, pillW, rightH, rightH / 2);
    g.strokeRoundedRect(pill1X, rightY, pillW, rightH, rightH / 2);
    this.add.text(pill1X + pillW / 2, rightY + rightH / 2,
      `❤️ ${d.player.hearts}`, {
        fontSize: `${Math.floor(rightH * 0.48)}px`, fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold', fill: '#ff4757',
      }).setOrigin(0.5).setDepth(11);

    // 金币胶囊
    g.fillStyle(0xffffff, 0.96);
    g.fillRoundedRect(pill2X, rightY, pillW, rightH, rightH / 2);
    g.strokeRoundedRect(pill2X, rightY, pillW, rightH, rightH / 2);
    this.add.text(pill2X + pillW / 2, rightY + rightH / 2,
      `🪙 ${d.player.coins}`, {
        fontSize: `${Math.floor(rightH * 0.44)}px`, fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold', fill: '#ff9f5a',
      }).setOrigin(0.5).setDepth(11);
  }

  // ── 标题 ─────────────────────────────────
  _drawTitle(width, height) {
    const titleY = height * 0.16;
    // 如果背景图已包含标题，跳过绘制以免重叠
    if (this.textures.exists('main_menu_bg')) return;

    // 标题阴影
    this.add.text(width / 2 + 3, titleY + 3, 'JoyPop', {
      fontSize: `${Math.floor(height * 0.085)}px`,
      fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold',
      fill: 'rgba(180,60,120,0.25)',
    }).setOrigin(0.5).setDepth(5);

    this.add.text(width / 2, titleY, 'JoyPop', {
      fontSize: `${Math.floor(height * 0.085)}px`,
      fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold',
      fill: '#ff6eb4',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);

    this.add.text(width / 2, titleY + height * 0.065, '欢乐消消乐', {
      fontSize: `${Math.floor(height * 0.028)}px`,
      fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold',
      fill: '#9b59b6',
      letterSpacing: 6,
    }).setOrigin(0.5).setDepth(6);
  }

  // ── 中央角色 ─────────────────────────────
  _drawCharacter(width, height) {
    if (this.textures.exists('main_menu_bg')) return;

    const cx = width / 2;
    const charY = height * 0.46;

    // 光晕底盘
    const glow = this.add.graphics().setDepth(4);
    glow.fillStyle(0xffd6f0, 0.55);
    glow.fillEllipse(cx, charY + height * 0.085, width * 0.55, height * 0.065);

    // 使用已生成的 bunny 纹理
    const bunnyKey = this.textures.exists('bunny_happy') ? 'bunny_happy'
      : this.textures.exists('bunny') ? 'bunny' : null;

    if (bunnyKey) {
      const b = this.add.image(cx, charY, bunnyKey)
        .setScale(Math.min(width / 320, 1.4))
        .setDepth(5);
      this.tweens.add({
        targets: b, y: charY - 10,
        duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else {
      // 备用：文字兔子
      const bunnyText = this.add.text(cx, charY, '🐰', {
        fontSize: `${Math.floor(height * 0.14)}px`,
      }).setOrigin(0.5).setDepth(5);
      this.tweens.add({
        targets: bunnyText, y: charY - 12,
        duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
  }

  // ── 开始游戏按钮 ─────────────────────────
  _drawPlayButton(width, height) {
    const cx = width / 2;
    const hasBg = this.textures.exists('main_menu_bg');

    // 背景图已包含按钮视觉 → 只需放透明热区
    // 无背景图 → 绘制实体渐变按钮
    if (hasBg) {
      // 坐标与原背景图中"开始游戏"按钮对齐
      const btnY = height * 0.656;
      const btnW = width * 0.533;
      const btnH = height * 0.0825;

      const hit = this.add.zone(cx, btnY, btnW, btnH).setInteractive().setDepth(17);
      hit.on('pointerdown', () => {
        this.cameras.main.fadeOut(280, 200, 100, 150);
        this.cameras.main.once('camerafadeoutcomplete', () =>
          this.scene.start('MapScene', { saveData: this.saveData })
        );
      });
    } else {
      // ── 无背景图时绘制实体按钮 ──
      const btnY = height * 0.72;
      const btnW = width * 0.58;
      const btnH = height * 0.075;
      const r = btnH / 2;

      const shadow = this.add.graphics().setDepth(14);
      shadow.fillStyle(0xd44f8e, 0.35);
      shadow.fillRoundedRect(cx - btnW / 2 + 3, btnY - btnH / 2 + 5, btnW, btnH, r);

      const btn = this.add.graphics().setDepth(15);
      btn.fillGradientStyle(0xff9f5a, 0xff6eb4, 0xff6eb4, 0xff9f5a, 1);
      btn.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, r);
      btn.lineStyle(3, 0xffffff, 0.85);
      btn.strokeRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, r);
      btn.fillStyle(0xffffff, 0.22);
      btn.fillEllipse(cx, btnY - btnH / 4, btnW * 0.65, btnH * 0.38);

      const btnLabel = this.add.text(cx, btnY, '⭐  开始游戏  ⭐', {
        fontSize: `${Math.floor(btnH * 0.36)}px`,
        fontFamily: 'Nunito, sans-serif', fontStyle: 'bold',
        fill: '#ffffff', stroke: 'rgba(160,40,80,0.3)', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(16);

      const hit = this.add.zone(cx, btnY, btnW, btnH).setInteractive().setDepth(17);
      hit.on('pointerdown', () => {
        this.tweens.add({ targets: [btn, btnLabel], scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true });
        this.time.delayedCall(130, () => {
          this.cameras.main.fadeOut(280, 200, 100, 150);
          this.cameras.main.once('camerafadeoutcomplete', () =>
            this.scene.start('MapScene', { saveData: this.saveData })
          );
        });
      });
      hit.on('pointerover', () =>
        this.tweens.add({ targets: [btn, btnLabel], scaleX: 1.04, scaleY: 1.04, duration: 100 })
      );
      hit.on('pointerout', () =>
        this.tweens.add({ targets: [btn, btnLabel], scaleX: 1, scaleY: 1, duration: 100 })
      );

      const pulse = this.add.graphics().setDepth(14);
      pulse.lineStyle(3, 0xff6eb4, 0.5);
      pulse.strokeRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, r);
      this.tweens.add({ targets: pulse, scaleX: 1.06, scaleY: 1.3, alpha: 0, duration: 1200, repeat: -1 });
    }
  }

  // ── 底部导航栏 ────────────────────────────
  _drawNavBar(width, height, activeIndex = 0) {
    const hasBg = this.textures.exists('main_menu_bg');
    const navH = height * 0.088;
    const navY = height - navH - 2;

    const actions = [
      () => {},  // 首页（当前）
      () => this.scene.start('MapScene', { saveData: this.saveData }),
      () => this.scene.start('PetScene', { saveData: this.saveData }),
      () => ModalSystem.showDailyModal(this, this.saveData),
      () => ModalSystem.showGlobalLeaderboardModal(this),
    ];
    const labels = ['首页', '地图', '宠物', '奖励', '排行'];
    const emojis = ['🏠', '🗺️', '🐰', '🎁', '🏆'];

    if (hasBg) {
      // 背景图已有导航栏视觉 → 仅铺透明热区（与原图对齐）
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
        this.add.text(cx, cy - 10, emojis[i], { fontSize: '19px' })
          .setOrigin(0.5).setDepth(82);
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

  // ── 浮动粒子装饰 ─────────────────────────
  _drawFloatingParticles(width, height) {
    const pool = ['⭐', '✨', '💫', '🌟', '🎀', '🍓', '💎', '🌸', '🍭', '🌺'];
    const navH = height * 0.088;
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(15, width - 15);
      const y = Phaser.Math.Between(280, height - navH - 80);
      const icon = pool[Math.floor(Math.random() * pool.length)];
      const sz = Phaser.Math.Between(13, 22);
      const d = this.add.text(x, y, icon, { fontSize: `${sz}px` })
        .setAlpha(Phaser.Math.FloatBetween(0.2, 0.65)).setDepth(7);
      this.tweens.add({
        targets: d,
        y: y - Phaser.Math.Between(18, 48),
        x: x + Phaser.Math.Between(-20, 20),
        alpha: 0.05,
        duration: 2200 + Math.random() * 3000,
        yoyo: true, repeat: -1,
        delay: Math.random() * 2500,
      });
    }
  }

  // ── 每日签到检查 ──────────────────────────
  _checkDailyReward() {
    const check = SaveSystem.checkDailyReward(this.saveData);
    if (check.available) {
      this.time.delayedCall(1600, () => ModalSystem.showDailyModal(this, this.saveData));
    }
  }

  shutdown() { ModalSystem.hideModal(); }
}
