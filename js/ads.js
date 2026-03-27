// ads.js - AdMob 광고 통합 모듈
// TODO: 실제 배포 시 ADS_CONFIG의 테스트 ID를 AdMob 콘솔에서 발급한 실제 Unit ID로 교체

const ADS_CONFIG = {
  // Google 공식 테스트 ID (실제 배포 전 반드시 교체)
  banner:       { android: 'ca-app-pub-3940256099942544/6300978111', ios: 'ca-app-pub-3940256099942544/2934735716' },
  interstitial: { android: 'ca-app-pub-3940256099942544/1033173712', ios: 'ca-app-pub-3940256099942544/4411468910' },
  rewarded:     { android: 'ca-app-pub-3940256099942544/5224354917', ios: 'ca-app-pub-3940256099942544/1712485313' },
};

const AdMobManager = (function () {
  let _ready = false;
  let _platform = 'web';
  let _plugin = null;

  function _getAdId(type) {
    return ADS_CONFIG[type]?.[_platform] || null;
  }

  async function init() {
    if (typeof window === 'undefined') return;
    if (window.electronAPI) return; // Electron: 광고 비활성화
    if (!window.Capacitor?.isNativePlatform?.()) return; // 웹: 광고 불가

    _platform = window.Capacitor.getPlatform?.() || 'web';
    _plugin = window.Capacitor.Plugins?.AdMob;
    if (!_plugin) return;

    try {
      await _plugin.initialize({ testingDevices: [], initializeForTesting: false });
      _ready = true;
      document.body.classList.add('ads-active');
      _showBanner();
    } catch (e) {
      console.warn('[AdMob] init failed:', e);
    }
  }

  function _showBanner() {
    if (!_ready || !_plugin) return;
    _plugin.showBanner({
      adId: _getAdId('banner'),
      adSize: 'ADAPTIVE_BANNER',
      position: 'BOTTOM_CENTER',
      margin: 0,
    }).catch(e => console.warn('[AdMob] banner error:', e));
  }

  async function showRewarded(placementId) {
    if (!_ready || !_plugin) return false;
    const adId = _getAdId('rewarded');
    if (!adId) return false;
    try {
      await _plugin.prepareRewardVideoAd({ adId });
      return new Promise(resolve => {
        let settled = false;
        function settle(v) { if (!settled) { settled = true; resolve(v); } }
        _plugin.addListener('onRewardedVideoAdRewarded', () => settle(true));
        _plugin.addListener('onRewardedVideoAdFailedToLoad', () => settle(false));
        _plugin.addListener('onRewardedVideoAdClosed', () => setTimeout(() => settle(false), 300));
        _plugin.showRewardVideoAd().catch(() => settle(false));
      });
    } catch (e) {
      console.warn('[AdMob] rewarded error:', e);
      return false;
    }
  }

  async function showInterstitial(placementId) {
    if (!_ready || !_plugin) return;
    const adId = _getAdId('interstitial');
    if (!adId) return;
    try {
      await _plugin.prepareInterstitial({ adId });
      await _plugin.showInterstitial();
    } catch (e) {
      console.warn('[AdMob] interstitial error:', e);
    }
  }

  return {
    init,
    showRewarded,
    showInterstitial,
    get ready() { return _ready; },
  };
})();

window.AdMobManager = AdMobManager;
