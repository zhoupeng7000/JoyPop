// =============================================
// JoyPop 统一 HTML 弹窗系统
// =============================================
import { SaveSystem } from './SaveSystem.js';
import { APIClient } from './APIClient.js';

export class ModalSystem {
  /**
   * 关闭当前弹窗
   */
  static hideModal() {
    document.getElementById('game-modal')?.remove();
  }

  /**
   * 通用基础弹窗
   */
  static showModal(scene, title, body, buttons) {
    this.hideModal();
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

  /**
   * 每日签到弹窗
   */
  static showDailyModal(scene, saveData) {
    const check = SaveSystem.checkDailyReward(saveData);
    const streak = (saveData.dailyReward?.streak || 0) + 1;
    const content = check.available
      ? `连续签到第 ${streak} 天！\n奖励：🪙 ${streak * 20} 金币`
      : `今日已签到 ✅\n明天再来哦！`;
    const btns = check.available
      ? [{ text: '🎁 领取奖励', color: 'primary', onClick: () => {
          SaveSystem.claimDailyReward(saveData);
          this.hideModal();
          scene.scene.restart({ saveData });
        }}]
      : [{ text: '好的~', color: 'secondary', onClick: () => this.hideModal() }];
    this.showModal(scene, '📅 每日签到', content, btns);
  }

  /**
   * 游戏成就弹窗
   */
  static showAchievementsModal(scene) {
    this.showModal(scene, '🏆 我的成就',
      '🌟 初出茅庐 - 完成第1关\n⭐ 小有成就 - 完成第10关\n🔥 连击高手 - 达成5连击\n🐰 萌宠好友 - 宠物升到5级',
      [{ text: '太棒了！', color: 'primary', onClick: () => this.hideModal() }]
    );
  }

  /**
   * 游戏设置弹窗
   */
  static showSettingsModal(scene) {
    this.showModal(scene, '⚙️ 游戏设置',
      '🎵 背景音乐：开启\n🔊 音效：开启\n📳 震动反馈：开启',
      [
        { text: '💾 保存', color: 'primary', onClick: () => this.hideModal() },
        { text: '取消', color: 'outline', onClick: () => this.hideModal() },
      ]
    );
  }

  /**
   * 玩家登录/注册弹窗
   */
  static showAuthModal(scene, saveData, mode = 'login') {
    this.hideModal();
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
    form.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin:14px 0;';

    const userIn = document.createElement('input');
    userIn.type = 'text';
    userIn.placeholder = '输入玩家名称 (4-12位)';
    userIn.maxLength = 12;
    userIn.className = 'modal-input';

    const passIn = document.createElement('input');
    passIn.type = 'password';
    passIn.placeholder = '输入密码 (6-18位)';
    passIn.maxLength = 18;
    passIn.className = 'modal-input';

    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = 'color:#ff4757;font-size:11px;height:14px;font-weight:bold;';

    form.appendChild(userIn);
    form.appendChild(passIn);
    form.appendChild(errorMsg);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'modal-btn btn-primary';
    submitBtn.textContent = mode === 'login' ? '🚀 登录并同步' : '🎁 注册并初始化';
    submitBtn.style.cssText = 'width:100%;margin:0 0 10px 0;';

    submitBtn.onclick = async () => {
      const username = userIn.value.trim();
      const password = passIn.value;
      if (username.length < 3) { errorMsg.textContent = '❌ 用户名至少需要3位'; return; }
      if (password.length < 6) { errorMsg.textContent = '❌ 密码至少需要6位'; return; }
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ 处理中...';
      const res = mode === 'login'
        ? await APIClient.login(username, password)
        : await APIClient.register(username, password);
      if (res.success) {
        SaveSystem.setCurrentUser(res.user.username);
        SaveSystem.save(res.saveData);
        this.hideModal();
        scene.scene.restart({ saveData: res.saveData });
      } else {
        errorMsg.textContent = `❌ ${res.message || '操作失败'}`;
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'login' ? '🚀 登录并同步' : '🎁 注册并初始化';
      }
    };

    const switchLink = document.createElement('a');
    switchLink.href = '#';
    switchLink.style.cssText = 'color:#7950f2;font-size:12px;text-decoration:none;font-weight:bold;display:block;margin:6px 0;';
    switchLink.textContent = mode === 'login' ? '还没有账号？点击注册' : '已有账号？点击登录';
    switchLink.onclick = (e) => {
      e.preventDefault();
      this.showAuthModal(scene, saveData, mode === 'login' ? 'register' : 'login');
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = 'width:100%;margin-top:8px;';
    closeBtn.onclick = () => this.hideModal();

    modal.appendChild(h);
    modal.appendChild(form);
    modal.appendChild(submitBtn);
    modal.appendChild(switchLink);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  /**
   * 玩家个人中心弹窗
   */
  static showProfileModal(scene, saveData) {
    this.hideModal();
    const user = SaveSystem.getCurrentUser();
    const d = saveData;

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
    info.style.cssText = 'text-align:left;margin:14px 0;color:#5a2d82;font-size:13px;line-height:1.8;';
    info.innerHTML = `
      <div style="font-weight:bold;border-bottom:2px dashed #ffb3d9;padding-bottom:6px;margin-bottom:8px;">
        当前账号: <span style="color:#ff6eb4;">${user || '游客'}</span>
      </div>
      <div>✨ 关卡进度: 第 <b>${d.progress.maxLevel}</b> 关</div>
      <div>🪙 金币余额: <b>${d.player.coins}</b></div>
      <div>❤️ 剩余体力: <b>${d.player.hearts} / 5</b></div>
    `;

    const achievementsBtn = document.createElement('button');
    achievementsBtn.className = 'modal-btn btn-primary';
    achievementsBtn.style.cssText = 'width:100%;margin:0 0 8px 0;';
    achievementsBtn.textContent = '🏆 我的成就';
    achievementsBtn.onclick = () => this.showAchievementsModal(scene);

    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'modal-btn btn-secondary';
    settingsBtn.style.cssText = 'width:100%;margin:0 0 8px 0;';
    settingsBtn.textContent = '⚙️ 游戏设置';
    settingsBtn.onclick = () => this.showSettingsModal(scene);

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'modal-btn btn-outline';
    logoutBtn.style.cssText = 'width:100%;margin:0 0 8px 0;color:#ff4757;border-color:#ffb3d9;';
    logoutBtn.textContent = user ? '🚪 退出登录' : '🔐 登录账号';
    logoutBtn.onclick = () => {
      if (user) {
        SaveSystem.setCurrentUser(null);
        this.hideModal();
        scene.scene.restart({ saveData: SaveSystem.load() });
      } else {
        this.showAuthModal(scene, saveData, 'login');
      }
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.style.width = '100%';
    closeBtn.textContent = '返回游戏';
    closeBtn.onclick = () => this.hideModal();

    modal.appendChild(h);
    modal.appendChild(info);
    modal.appendChild(achievementsBtn);
    modal.appendChild(settingsBtn);
    modal.appendChild(logoutBtn);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  /**
   * 全球总分排行榜弹窗
   */
  static async showGlobalLeaderboardModal(scene) {
    this.hideModal();
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
    listContainer.style.cssText = 'margin:14px 0;max-height:200px;overflow-y:auto;text-align:left;font-size:13px;';
    listContainer.textContent = '⏳ 排行榜加载中...';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn btn-outline';
    closeBtn.textContent = '关闭';
    closeBtn.style.width = '100%';
    closeBtn.onclick = () => this.hideModal();

    modal.appendChild(h);
    modal.appendChild(listContainer);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    try {
      const res = await APIClient.getGlobalLeaderboard();
      if (res.success && res.leaderboard && res.leaderboard.length > 0) {
        listContainer.innerHTML = '';
        const table = document.createElement('table');
        table.style.cssText = 'width:100%;border-collapse:collapse;color:#5a2d82;';
        res.leaderboard.forEach((item, i) => {
          const tr = document.createElement('tr');
          tr.style.cssText = 'border-bottom:1px solid #fff0f8;height:32px;';
          const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
          tr.innerHTML = `
            <td style="width:30px;font-weight:bold;text-align:center;font-size:14px;">${rankEmoji}</td>
            <td style="font-weight:bold;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.username}</td>
            <td style="text-align:right;color:#ff9f5a;padding-right:6px;">通关:${item.maxLevel}</td>
            <td style="text-align:right;font-weight:bold;color:#ff6eb4;">${item.totalScore.toLocaleString()}分</td>
          `;
          table.appendChild(tr);
        });
        listContainer.appendChild(table);
      } else {
        listContainer.textContent = '📭 暂无全球排行数据，快去通关创造纪录！';
      }
    } catch (e) {
      listContainer.textContent = '⚠️ 加载失败，请稍后重试';
    }
  }
}
