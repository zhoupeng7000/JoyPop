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
    // 移除了底部导航栏，符合图片2的无导航设计
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
    // 阴影
    g.fillStyle(0x000000, 0.08);
    g.fillRoundedRect(x + 1.5, y + 2, w, h, h / 2);
    // 奶油色底盘
    g.fillStyle(0xfffbeb, 1);
    g.fillRoundedRect(x, y, w, h, h / 2);
    g.lineStyle(2.5, 0xfcd34d, 1); // 金黄色描边
    g.strokeRoundedRect(x, y, w, h, h / 2);

    // 左侧图标
    const iconSize = h * 0.9;
    const icon = this.add.image(x + h / 2 + 1, y + h / 2, iconKey)
      .setDisplaySize(iconSize, iconSize)
      .setDepth(21);

    // 数值文本 (缩小一点防止超出)
    const textX = x + h + 2;
    const text = this.add.text(textX, y + h / 2, valueText, {
      fontSize: `${Math.floor(h * 0.38)}px`,
      fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold',
      fill: '#5d4037', // 深褐字
    }).setOrigin(0, 0.5).setDepth(21);

    // 右侧加号按钮
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

  // ── 标题 ─────────────────────────────────
  _drawTitle(width, height) {
    const titleY = height * 0.14;
    const cx = width / 2;

    // 绘制 arched 黄金大标题 "HAPPY POP"
    const titleText = this.add.text(cx, titleY, 'HAPPY POP', {
      fontSize: `${Math.floor(height * 0.052)}px`,
      fontFamily: 'Outfit, Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      fill: '#fbbf24', // 黄金光泽
      stroke: '#5d4037', // 粗黑描边
      strokeThickness: 7,
      shadow: { color: '#3e2723', fill: true, offsetX: 3, offsetY: 4, blur: 0 }
    }).setOrigin(0.5).setDepth(6);

    // 呼吸动画
    this.tweens.add({
      targets: titleText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 绘制棕色木制横幅 plaque
    const signW = 150;
    const signH = 26;
    const signY = titleY + height * 0.055;

    const sign = this.add.graphics().setDepth(15);
    // 阴影
    sign.fillStyle(0x000000, 0.15);
    sign.fillRoundedRect(cx - signW / 2 + 2, signY - signH / 2 + 2, signW, signH, 6);
    // 木牌
    sign.fillStyle(0x8d6e63, 1);
    sign.fillRoundedRect(cx - signW / 2, signY - signH / 2, signW, signH, 6);
    sign.lineStyle(2, 0xfbbf24, 1); // 金边
    sign.strokeRoundedRect(cx - signW / 2, signY - signH / 2, signW, signH, 6);

    this.add.text(cx, signY, 'VINE VILLAGE', {
      fontSize: '11px',
      fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold',
      fill: '#ffffff',
    }).setOrigin(0.5).setDepth(16);
  }

  // ── 中央角色 ─────────────────────────────
  _drawCharacter(width, height) {
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
        .setScale(Math.min(width / 450, 0.85))
        .setDepth(5);
      this.tweens.add({
        targets: b, y: charY - 10,
        duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else {
      // 备用：矢量图片兔子
      const bunnyImg = this.add.image(cx, charY, 'ui_animal_bunny').setDisplaySize(height * 0.14, height * 0.14).setDepth(5);
      this.tweens.add({
        targets: bunnyImg, y: charY - 12,
        duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
  }

  // ── 开始游戏按钮 ─────────────────────────
  _drawPlayButton(width, height) {
    const cx = width / 2;
    const btnY = height * 0.72;
    const btnW = width * 0.58;
    const btnH = height * 0.075;
    const r = btnH / 2;

    // 创建按钮容器，设在 (cx, btnY) 并居中
    const btnContainer = this.add.container(cx, btnY).setDepth(15);

    // 阴影 (在容器内，中心点为 0,0)
    const shadow = this.add.graphics();
    shadow.fillStyle(0xd44f8e, 0.35);
    shadow.fillRoundedRect(-btnW / 2 + 3, -btnH / 2 + 5, btnW, btnH, r);
    btnContainer.add(shadow);

    // 按钮本体
    const btn = this.add.graphics();
    btn.fillGradientStyle(0xffc048, 0xffa801, 0xff5e57, 0xff3f34, 1);
    btn.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, r);
    btn.lineStyle(3, 0xffffff, 0.85);
    btn.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, r);
    btn.fillStyle(0xffffff, 0.28);
    btn.fillEllipse(0, -btnH / 4, btnW * 0.65, btnH * 0.38);
    btnContainer.add(btn);

    // 绘制绿叶装饰 (左右两侧)
    const leaves = this.add.graphics();
    const lx = -btnW / 2 + 4;
    const ly = -btnH / 3;
    leaves.fillStyle(0x2ed573, 1);
    leaves.fillPoints([
      { x: lx, y: ly },
      { x: lx - 12, y: ly - 8 },
      { x: lx - 20, y: ly },
      { x: lx - 8, y: ly + 10 }
    ], true);
    leaves.fillStyle(0x7bed9f, 1);
    leaves.fillPoints([
      { x: lx - 2, y: ly },
      { x: lx - 10, y: ly - 5 },
      { x: lx - 16, y: ly },
      { x: lx - 8, y: ly + 6 }
    ], true);

    const rx = btnW / 2 - 4;
    const ry = btnH / 3;
    leaves.fillStyle(0x2ed573, 1);
    leaves.fillPoints([
      { x: rx, y: ry },
      { x: rx + 12, y: ry + 8 },
      { x: rx + 20, y: ry },
      { x: rx + 8, y: ry - 10 }
    ], true);
    leaves.fillStyle(0x7bed9f, 1);
    leaves.fillPoints([
      { x: rx + 2, y: ry },
      { x: rx + 10, y: ry + 5 },
      { x: rx + 16, y: ry },
      { x: rx + 8, y: ry - 6 }
    ], true);
    btnContainer.add(leaves);

    const btnLabel = this.add.text(0, 0, '开始游戏', {
      fontSize: `${Math.floor(btnH * 0.36)}px`,
      fontFamily: 'Nunito, sans-serif', fontStyle: 'bold',
      fill: '#ffffff', stroke: 'rgba(160,40,80,0.45)', strokeThickness: 3.5,
    }).setOrigin(0.5);
    btnContainer.add(btnLabel);

    const hit = this.add.zone(cx, btnY, btnW, btnH).setInteractive().setDepth(17);
    hit.on('pointerdown', () => {
      this.tweens.add({ targets: btnContainer, scaleX: 0.93, scaleY: 0.93, duration: 80, yoyo: true });
      this.time.delayedCall(130, () => {
        this.cameras.main.fadeOut(280, 200, 100, 150);
        this.cameras.main.once('camerafadeoutcomplete', () =>
          this.scene.start('MapScene', { saveData: this.saveData })
        );
      });
    });
    hit.on('pointerover', () =>
      this.tweens.add({ targets: [btn, btnLabel, leaves], scaleX: 1.05, scaleY: 1.05, duration: 100 })
    );
    hit.on('pointerout', () =>
      this.tweens.add({ targets: [btn, btnLabel, leaves], scaleX: 1, scaleY: 1, duration: 100 })
    );

    const pulse = this.add.graphics().setDepth(14);
    pulse.lineStyle(3, 0xffa801, 0.5);
    pulse.strokeRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, r);
    this.tweens.add({ targets: pulse, scaleX: 1.06, scaleY: 1.3, alpha: 0, duration: 1200, repeat: -1 });
  }

  // ── 底部导航栏 ────────────────────────────
  _drawNavBar(width, height, activeIndex = 0) {
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
    const navTextures = ['ui_nav_home', 'ui_nav_map', 'ui_nav_pet', 'ui_nav_gift', 'ui_nav_trophy'];

    // 总是绘制实体导航栏以搭配新森林背景图
    const bg = this.add.graphics().setDepth(80);
    // 使用温润的奶白色配木粉色边框，完美搭配森林风
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
      
      // 使用全新的高拟真矢量纹理代替 flat Emojis
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

  // ── 浮动粒子装饰 ─────────────────────────
  _drawFloatingParticles(width, height) {
    const pool = ['star_gold', 'tile_crystal', 'tile_diamond', 'tile_strawberry', 'ui_status_drop', 'ui_heart'];
    const navH = height * 0.088;
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(15, width - 15);
      const y = Phaser.Math.Between(280, height - navH - 80);
      const icon = pool[Math.floor(Math.random() * pool.length)];
      const sz = Phaser.Math.Between(13, 22);
      const d = this.add.image(x, y, icon).setDisplaySize(sz, sz)
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
