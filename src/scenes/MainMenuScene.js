// =============================================
// JoyPop 主菜单场景 v2 - 精致版
// =============================================
import { SaveSystem } from '../utils/SaveSystem.js';
import { APIClient } from '../utils/APIClient.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MainMenuScene' }); }

  create() {
    this.saveData = SaveSystem.load();
    SaveSystem.rechargeHearts(this.saveData);

    const { width, height } = this.cameras.main;
    this.cameras.main.fadeIn(400);

    this._drawBackground(width, height);
    this._drawTopHUD(width);
    this._drawTitle(width);
    this._drawBunnyAndBubble(width, height);
    this._drawButtons(width, height);
    this._drawFloatingParticles(width, height);
    this._checkDailyReward();
  }

  // ── 背景 ─────────────────────────────────
  _drawBackground(width, height) {
    const bg = this.add.image(width / 2, height / 2, 'main_menu_bg');
    bg.setDisplaySize(width, height);
  }

  // ── 顶部 HUD ─────────────────────────────
  _drawTopHUD(width) {
    const { height } = this.cameras.main;
    const d = this.saveData;
    const g = this.add.graphics();

    // 根据背景图比例计算顶部 HUD 尺寸和位置
    const hudY = height * 0.055; 
    const hudH = height * 0.063; 
    const profW = width * 0.38; 
    
    // 1. 左上角玩家 Profile 覆盖胶囊
    g.fillStyle(0xfff4f8, 1);
    g.lineStyle(3, 0xffb3d9, 1);
    g.fillRoundedRect(12, hudY, profW, hudH, hudH / 2);
    g.strokeRoundedRect(12, hudY, profW, hudH, hudH / 2);

    const profHit = this.add.rectangle(12 + profW/2, hudY + hudH/2, profW, hudH).setInteractive();
    profHit.on('pointerdown', () => {
      const logged = SaveSystem.getCurrentUser();
      if (logged) {
        this._showProfileModal();
      } else {
        this._showAuthModal('login');
      }
    });

    // 头像背景圈和文字
    const avatarSize = hudH * 0.8;
    const avatarX = 12 + hudH / 2;
    const avatarY = hudY + hudH / 2;
    g.fillStyle(0xffffff, 1);
    g.fillCircle(avatarX, avatarY, avatarSize / 2);
    g.strokeCircle(avatarX, avatarY, avatarSize / 2);
    this.add.text(avatarX, avatarY, '🦊', { fontSize: `${Math.floor(avatarSize * 0.6)}px` }).setOrigin(0.5);

    // 等级背景框
    const lvlPill = this.add.graphics();
    lvlPill.fillStyle(0x448aff, 1);
    lvlPill.fillRoundedRect(avatarX + avatarSize/2 + 8, hudY + 6, profW - avatarSize - 24, hudH * 0.32, 8);

    // 等级和用户名文字
    this.add.text(avatarX + avatarSize/2 + 8 + (profW - avatarSize - 24)/2, hudY + 6 + (hudH * 0.32)/2, `Lv.${d.player.level}`, {
      fontSize: `${Math.floor(hudH * 0.22)}px`, fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(avatarX + avatarSize/2 + 8, hudY + hudH * 0.52, d.player.name, {
      fontSize: `${Math.floor(hudH * 0.24)}px`, fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#5a2d82',
    });

    // 2. 右上角体力爱心胶囊
    const heartX = width * 0.635; 
    const heartW = width * 0.17; 
    const rightPillH = height * 0.046; 
    const rightPillY = height * 0.040; 

    g.fillStyle(0xfff4f8, 1);
    g.fillRoundedRect(heartX, rightPillY, heartW, rightPillH, rightPillH / 2);
    g.strokeRoundedRect(heartX, rightPillY, heartW, rightPillH, rightPillH / 2);

    this.add.text(heartX + heartW/2, rightPillY + rightPillH/2, `❤️ ${d.player.hearts}`, {
      fontSize: `${Math.floor(rightPillH * 0.47)}px`, fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#ff4757',
    }).setOrigin(0.5);

    // 3. 右上角金币胶囊
    const coinX = width * 0.81; 
    const coinW = width * 0.17; 

    g.fillStyle(0xfff4f8, 1);
    g.fillRoundedRect(coinX, rightPillY, coinW, rightPillH, rightPillH / 2);
    g.strokeRoundedRect(coinX, rightPillY, coinW, rightPillH, rightPillH / 2);

    this.add.text(coinX + coinW/2, rightPillY + rightPillH/2, `🪙 ${d.player.coins}`, {
      fontSize: `${Math.floor(rightPillH * 0.44)}px`, fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', fill: '#ff9f5a',
    }).setOrigin(0.5);
  }

  // ── 标题 ─────────────────────────────────
  _drawTitle(width) {
    // 标题与角色已完美融合在背景图中，此处仅作预留，不额外创建文字
  }

  // ── 小兔角色 + 气泡 ───────────────────────
  _drawBunnyAndBubble(width, height) {
    // 角色与对话框已完美融合在背景图中，此处仅作预留，不额外创建文字
  }

  // ── 按钮组 ────────────────────────────────
  _drawButtons(width, height) {
    const cx = width / 2;

    // 1. 开始游戏按钮高光交互热区 (覆盖原图中的“开始游戏”金色按钮)
    // 适配高度比，中心 Y 点在 height * 0.656 处，尺寸 w: width * 0.533, h: height * 0.0825
    const playY = height * 0.656;
    const playW = width * 0.533;
    const playH = height * 0.0825;

    const playBtnGlow = this.add.graphics();
    playBtnGlow.fillStyle(0xffffff, 0);
    playBtnGlow.fillRoundedRect(cx - playW/2, playY - playH/2, playW, playH, playH/2);

    const hit = this.add.rectangle(cx, playY, playW, playH).setInteractive();
    hit.on('pointerdown', () => {
      playBtnGlow.clear();
      playBtnGlow.fillStyle(0xffffff, 0.4);
      playBtnGlow.fillRoundedRect(cx - playW/2, playY - playH/2, playW, playH, playH/2);
      this.time.delayedCall(120, () => {
        this.cameras.main.fadeOut(280, 200, 100, 150);
        this.cameras.main.once('camerafadeoutcomplete', () =>
          this.scene.start('MapScene', { saveData: this.saveData })
        );
      });
    });
    hit.on('pointerover', () => {
      playBtnGlow.clear();
      playBtnGlow.fillStyle(0xffffff, 0.2);
      playBtnGlow.fillRoundedRect(cx - playW/2, playY - playH/2, playW, playH, playH/2);
    });
    hit.on('pointerout', () => {
      playBtnGlow.clear();
    });

    // 2. 底部奶油色导航栏 (透明热区，完美贴合背景设计图)
    const navH = height * 0.086;
    const navItems = [
      { action: () => {} },
      { action: () => this.scene.start('PetScene', { saveData: this.saveData }) },
      { action: () => this._showAchievementsModal() },
      { action: () => this._showDailyModal() },
      { action: () => this._showLeaderboardModal() },
    ];

    const itemW = width / navItems.length;
    navItems.forEach((item, i) => {
      const x = itemW * i + itemW / 2;
      const y = height * 0.908;

      const navHit = this.add.rectangle(x, y, itemW - 4, navH).setInteractive();
      navHit.on('pointerdown', item.action);
    });
  }

  // ── 浮动粒子装饰 ─────────────────────────
  _drawFloatingParticles(width, height) {
    const pool = ['⭐', '✨', '💫', '🌟', '🎀', '🍓', '💎', '🌸', '🍭', '🌺'];
    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(15, width - 15);
      const y = Phaser.Math.Between(290, height - 90);
      const icon = pool[Math.floor(Math.random() * pool.length)];
      const sz = Phaser.Math.Between(13, 22);
      const d = this.add.text(x, y, icon, { fontSize: `${sz}px` })
        .setAlpha(Phaser.Math.FloatBetween(0.25, 0.75));
      this.tweens.add({
        targets: d,
        y: y - Phaser.Math.Between(18, 48),
        x: x + Phaser.Math.Between(-22, 22),
        alpha: 0.1,
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
      this.time.delayedCall(1600, () => this._showDailyModal());
    }
  }

  // ── 弹窗 ─────────────────────────────────
  _showDailyModal() {
    const check = SaveSystem.checkDailyReward(this.saveData);
    const streak = (this.saveData.dailyReward?.streak || 0) + 1;
    const content = check.available
      ? `连续签到第 ${streak} 天！\n奖励：🪙 ${streak * 20} 金币`
      : `今日已签到 ✅\n明天再来哦！`;

    const btns = check.available
      ? [{ text: '🎁 领取奖励', color: 'primary', onClick: () => {
          SaveSystem.claimDailyReward(this.saveData);
          this._hideModal();
          this.scene.restart(); // ✅ 重启场景刷新 HUD
        }}]
      : [{ text: '好的~', color: 'secondary', onClick: () => this._hideModal() }];

    this._showModal('📅 每日签到', content, btns);
  }

  _showAchievementsModal() {
    this._showModal('🏆 我的成就',
      '🌟 初出茅庐 - 完成第1关\n⭐ 小有成就 - 完成第10关\n🔥 连击高手 - 达成5连击\n🐰 萌宠好友 - 宠物升到5级',
      [{ text: '太棒了！', color: 'primary', onClick: () => this._hideModal() }]
    );
  }

  _showSettingsModal() {
    this._showModal('⚙️ 游戏设置',
      '🎵 背景音乐：开启\n🔊 音效：开启\n📳 震动反馈：开启',
      [
        { text: '💾 保存', color: 'primary', onClick: () => this._hideModal() },
        { text: '取消', color: 'outline', onClick: () => this._hideModal() },
      ]
    );
  }

  _showAuthModal(mode = 'login') {
    this._hideModal();
    const overlay = document.createElement('div');
    overlay.className = 'game-modal-overlay';
    overlay.id = 'game-modal';

    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.style.width = '320px';

    const h = document.createElement('div');
    h.className = 'modal-title';
    h.textContent = mode === 'login' ? '🔐 玩家登录' : '📝 玩家注册';

    const form = document.createElement('div');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = '10px';
    form.style.margin = '14px 0';

    const userIn = document.createElement('input');
    userIn.type = 'text';
    userIn.placeholder = '输入玩家名称 (4-12位)';
    userIn.maxLength = 12;
    userIn.style.padding = '8px 12px';
    userIn.style.borderRadius = '10px';
    userIn.style.border = '2px solid #ffb3d9';
    userIn.style.fontFamily = 'inherit';
    userIn.style.outline = 'none';

    const passIn = document.createElement('input');
    passIn.type = 'password';
    passIn.placeholder = '输入密码 (6-18位)';
    passIn.maxLength = 18;
    passIn.style.padding = '8px 12px';
    passIn.style.borderRadius = '10px';
    passIn.style.border = '2px solid #ffb3d9';
    passIn.style.fontFamily = 'inherit';
    passIn.style.outline = 'none';

    const errorMsg = document.createElement('div');
    errorMsg.style.color = '#ff4757';
    errorMsg.style.fontSize = '11px';
    errorMsg.style.height = '14px';
    errorMsg.style.fontWeight = 'bold';

    form.appendChild(userIn);
    form.appendChild(passIn);
    form.appendChild(errorMsg);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'modal-btn btn-primary';
    submitBtn.textContent = mode === 'login' ? '🚀 登录并同步' : '🎁 注册并初始化';
    submitBtn.style.width = '100%';
    submitBtn.style.margin = '0 0 10px 0';

    submitBtn.onclick = async () => {
      const username = userIn.value.trim();
      const password = passIn.value;

      if (username.length < 3) {
        errorMsg.textContent = '❌ 用户名至少需要3位';
        return;
      }
      if (password.length < 6) {
        errorMsg.textContent = '❌ 密码至少需要6位';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ 处理中...';

      let res;
      if (mode === 'login') {
        res = await APIClient.login(username, password);
      } else {
        res = await APIClient.register(username, password);
      }

      if (res.success) {
        SaveSystem.setCurrentUser(res.user.username);
        SaveSystem.save(res.saveData);
        this._hideModal();
        this.scene.restart();
      } else {
        errorMsg.textContent = `❌ ${res.message || '操作失败'}`;
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'login' ? '🚀 登录并同步' : '🎁 注册并初始化';
      }
    };

    const switchLink = document.createElement('a');
    switchLink.href = '#';
    switchLink.style.color = '#7950f2';
    switchLink.style.fontSize = '12px';
    switchLink.style.textDecoration = 'none';
    switchLink.style.fontWeight = 'bold';
    switchLink.textContent = mode === 'login' ? '还没有账号？点击注册' : '已有账号？点击登录';
    switchLink.onclick = (e) => {
      e.preventDefault();
      this._showAuthModal(mode === 'login' ? 'register' : 'login');
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.textContent = '关闭';
    closeBtn.style.width = '100%';
    closeBtn.style.marginTop = '10px';
    closeBtn.onclick = () => this._hideModal();

    modal.appendChild(h);
    modal.appendChild(form);
    modal.appendChild(submitBtn);
    modal.appendChild(switchLink);
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  _showProfileModal() {
    this._hideModal();
    const user = SaveSystem.getCurrentUser();
    const d = this.saveData;

    const overlay = document.createElement('div');
    overlay.className = 'game-modal-overlay';
    overlay.id = 'game-modal';

    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.style.width = '320px';

    const h = document.createElement('div');
    h.className = 'modal-title';
    h.textContent = '🦊 玩家账号';

    const info = document.createElement('div');
    info.style.textAlign = 'left';
    info.style.margin = '14px 0';
    info.style.color = '#5a2d82';
    info.style.fontSize = '13px';
    info.style.lineHeight = '1.8';
    info.innerHTML = `
      <div style="font-weight: bold; border-bottom: 2px dashed #ffb3d9; padding-bottom: 6px; margin-bottom: 8px;">
        当前账号: <span style="color: #ff6eb4;">${user}</span>
      </div>
      <div>✨ 关卡进度: 第 <b>${d.progress.maxLevel}</b> 关</div>
      <div>🪙 金币余额: <b>${d.player.coins}</b></div>
      <div>❤️ 剩余体力: <b>${d.player.hearts} / 5</b></div>
    `;

    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'modal-btn btn-primary';
    settingsBtn.style.width = '100%';
    settingsBtn.style.margin = '0 0 8px 0';
    settingsBtn.textContent = '⚙️ 游戏设置';
    settingsBtn.onclick = () => this._showSettingsModal();

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'modal-btn btn-secondary';
    logoutBtn.style.width = '100%';
    logoutBtn.style.margin = '0 0 8px 0';
    logoutBtn.textContent = '🚪 退出登录';
    logoutBtn.onclick = () => {
      SaveSystem.setCurrentUser(null);
      this._hideModal();
      this.scene.restart();
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.textContent = '返回游戏';
    closeBtn.style.width = '100%';
    closeBtn.onclick = () => this._hideModal();

    modal.appendChild(h);
    modal.appendChild(info);
    modal.appendChild(settingsBtn);
    modal.appendChild(logoutBtn);
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  async _showLeaderboardModal() {
    this._hideModal();
    const overlay = document.createElement('div');
    overlay.className = 'game-modal-overlay';
    overlay.id = 'game-modal';

    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.style.width = '330px';

    const h = document.createElement('div');
    h.className = 'modal-title';
    h.textContent = '🏆 全球总分榜';

    const listContainer = document.createElement('div');
    listContainer.style.margin = '14px 0';
    listContainer.style.maxHeight = '200px';
    listContainer.style.overflowY = 'auto';
    listContainer.style.textAlign = 'left';
    listContainer.style.fontSize = '13px';
    listContainer.textContent = '⏳ 排行榜加载中...';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.textContent = '关闭';
    closeBtn.style.width = '100%';
    closeBtn.onclick = () => this._hideModal();

    modal.appendChild(h);
    modal.appendChild(listContainer);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const res = await APIClient.getGlobalLeaderboard();

    if (res.success && res.leaderboard && res.leaderboard.length > 0) {
      listContainer.innerHTML = '';
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.color = '#5a2d82';

      res.leaderboard.forEach((item, i) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #fff0f8';
        tr.style.height = '32px';

        const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
        
        tr.innerHTML = `
          <td style="width: 30px; font-weight: bold; text-align: center; font-size: 14px;">${rankEmoji}</td>
          <td style="font-weight: bold; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.username}</td>
          <td style="text-align: right; color: #ff9f5a; padding-right: 6px;">通关:${item.maxLevel}</td>
          <td style="text-align: right; font-weight: bold; color: #ff6eb4;">${item.totalScore.toLocaleString()}分</td>
        `;
        table.appendChild(tr);
      });
      listContainer.appendChild(table);
    } else {
      listContainer.textContent = '📭 暂无排行榜数据，快去通关创造纪录！';
    }
  }

  _showModal(title, body, buttons) {
    this._hideModal();
    const overlay = document.createElement('div');
    overlay.className = 'game-modal-overlay';
    overlay.id = 'game-modal';

    const modal = document.createElement('div');
    modal.className = 'game-modal';

    const h = document.createElement('div');
    h.className = 'modal-title';
    h.textContent = title;

    const p = document.createElement('p');
    p.className = 'modal-score';
    p.textContent = body;

    modal.appendChild(h);
    modal.appendChild(p);

    buttons.forEach(btn => {
      const b = document.createElement('button');
      b.className = `modal-btn btn-${btn.color}`;
      b.textContent = btn.text;
      b.onclick = btn.onClick;
      modal.appendChild(b);
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  _hideModal() {
    document.getElementById('game-modal')?.remove();
  }

  shutdown() { this._hideModal(); }
}
