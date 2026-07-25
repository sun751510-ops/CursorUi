/**
 * Native Capacitor helpers for the mobile WebView app.
 */
(function () {
  function getCapacitor() {
    return window.Capacitor || null;
  }

  function getPlugin(name) {
    const cap = getCapacitor();
    if (!cap) return null;
    return cap.Plugins?.[name] || null;
  }

  window.CwayNative = {
    isNative() {
      const cap = getCapacitor();
      return Boolean(cap?.isNativePlatform?.());
    },
    platform() {
      const cap = getCapacitor();
      return cap?.getPlatform?.() || 'web';
    },
    async ready() {
      if (!this.isNative()) return false;
      const StatusBar = getPlugin('StatusBar');
      const SplashScreen = getPlugin('SplashScreen');
      try {
        await StatusBar?.setBackgroundColor?.({ color: '#071018' });
        await StatusBar?.setStyle?.({ style: 'DARK' });
      } catch {
        /* ignore */
      }
      try {
        await SplashScreen?.hide?.();
      } catch {
        /* ignore */
      }
      return true;
    },
    speech: {
      plugin() {
        return getPlugin('SpeechRecognition');
      },
      async available() {
        const p = this.plugin();
        if (!p) return false;
        try {
          const res = await p.available();
          return Boolean(res?.available);
        } catch {
          return false;
        }
      },
      async requestPermissions() {
        const p = this.plugin();
        if (!p) return false;
        try {
          if (p.requestPermissions) {
            const res = await p.requestPermissions();
            const values = Object.values(res || {});
            if (values.some((v) => v === 'granted' || v === 'prompt')) return true;
            if (res?.permission === 'granted') return true;
          }
          if (p.requestPermission) {
            const res = await p.requestPermission();
            return res?.permission === 'granted' || res === true;
          }
          return true;
        } catch (err) {
          console.warn('speech permission', err);
          return false;
        }
      },
      async start(opts = {}) {
        const p = this.plugin();
        if (!p) throw new Error('Native speech unavailable');
        return p.start({
          language: opts.language || navigator.language || 'en-US',
          maxResults: 3,
          prompt: 'Speak to CwayClient',
          partialResults: true,
          popup: false
        });
      },
      async stop() {
        const p = this.plugin();
        if (!p) return;
        try {
          await p.stop();
        } catch {
          /* ignore */
        }
      },
      async addPartialListener(cb) {
        const p = this.plugin();
        if (!p?.addListener) return () => {};
        const handle = await p.addListener('partialResults', (data) => {
          const matches = data?.matches || [];
          cb(matches[0] || '', matches);
        });
        return () => {
          try {
            handle?.remove?.();
          } catch {
            /* ignore */
          }
        };
      },
      async addListeningListener(cb) {
        const p = this.plugin();
        if (!p?.addListener) return () => {};
        const handle = await p.addListener('listeningState', (data) => cb(data?.status));
        return () => {
          try {
            handle?.remove?.();
          } catch {
            /* ignore */
          }
        };
      }
    }
  };
})();
