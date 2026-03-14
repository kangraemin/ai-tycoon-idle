const Analytics = {
  _send(event, params) {
    if (typeof gtag === 'function') gtag('event', event, params);
  },

  sessionStart(isReturning) {
    this._send('session_start', { is_returning: isReturning });
  },

  sessionEnd() {
    this._send('session_end');
  },

  screenView(screenName) {
    this._send('screen_view', { screen_name: screenName });
  },

  lockedTabClick(tabName, currentReputation) {
    this._send('locked_tab_click', { tab_name: tabName, current_reputation: currentReputation });
  },

  challengeStart(type, isPaid, tokenBalance) {
    this._send('challenge_start', { challenge_type: type, is_paid: isPaid, token_balance: tokenBalance });
  },

  challengeComplete(type, grade, score) {
    this._send('challenge_complete', { challenge_type: type, grade: grade, score: score });
  },

  researchPull(rarity, isHallucination, papersSpent) {
    this._send('research_pull', { rarity: rarity, is_hallucination: isHallucination, papers_spent: papersSpent });
  },

  upgradePurchase(category, id, level, cost) {
    this._send('upgrade_purchase', { category: category, upgrade_id: id, level: level, cost: cost });
  },

  gpuExpansion(slotCount, cost) {
    this._send('gpu_expansion', { slot_count: slotCount, cost: cost });
  },

  fusionAttempt(resultModel, cost) {
    this._send('fusion_attempt', { result_model: resultModel, cost: cost });
  },

  careerAdvance(stage, multiplier, reputation, historyCount) {
    this._send('career_advance', { stage: stage, multiplier: multiplier, reputation: reputation, history_count: historyCount });
  },

  offlineCollect(minutes, locEarned) {
    this._send('offline_collect', { minutes: minutes, loc_earned: locEarned });
  },

  achievementUnlock(id, name, papersReward) {
    this._send('achievement_unlock', { achievement_id: id, achievement_name: name, papers_reward: papersReward });
  },

  tutorialStep(step, action) {
    this._send('tutorial_step', { step: step, action: action });
  },

  eventResolved(eventId, eventType, fixTaps) {
    this._send('event_resolved', { event_id: eventId, event_type: eventType, fix_taps: fixTaps });
  }
};
