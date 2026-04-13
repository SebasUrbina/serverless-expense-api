'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCcw, WifiOff, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function PWAController() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.navigator.onLine;
  });
  const [showInstallCard, setShowInstallCard] = useState(false);
  const [updateReady, setUpdateReady] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowInstallCard(true);
    };
    const handleInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallCard(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      return;
    }

    let isMounted = true;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        if (registration.waiting && isMounted) {
          setUpdateReady(registration);
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller && isMounted) {
              setUpdateReady(registration);
            }
          });
        });
      } catch {
        // Ignore registration errors to avoid breaking the main app.
      }
    };

    void registerServiceWorker();

    return () => {
      isMounted = false;
    };
  }, []);

  const canInstall = useMemo(() => Boolean(deferredPrompt && showInstallCard), [deferredPrompt, showInstallCard]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowInstallCard(false);
    }
    setDeferredPrompt(null);
  };

  const handleApplyUpdate = () => {
    updateReady?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  return (
    <>
      {!isOnline ? (
        <div className="fixed inset-x-3 top-3 z-[120] flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg animate-seva-slide-up sm:left-auto sm:right-4 sm:top-4 sm:w-[360px]"
          style={{ background: 'rgba(8,11,15,0.92)', color: '#ecfdf5', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-400">
            <WifiOff size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Estás sin conexión</p>
            <p className="text-xs text-emerald-50/70">Seva seguirá mostrando contenido cacheado cuando esté disponible.</p>
          </div>
        </div>
      ) : null}

      {canInstall ? (
        <div className="fixed inset-x-3 bottom-[6.2rem] z-[115] animate-seva-slide-up sm:bottom-4 sm:left-auto sm:right-4 sm:w-[360px]">
          <div className="rounded-[1.6rem] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(12,16,21,0.95))',
              border: '1px solid rgba(16,185,129,0.22)',
              backdropFilter: 'blur(18px)',
            }}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300/75">Instalar app</p>
                <h2 className="mt-1 text-base font-semibold text-white">Guarda Seva en tu pantalla de inicio.</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallCard(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-emerald-100/70 transition-colors hover:bg-white/8 hover:text-white"
                aria-label="Cerrar recomendación de instalación"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm leading-5 text-emerald-50/72">
              Vas a entrar más rápido, con experiencia tipo app y acceso sin conexión a las pantallas que ya viste.
            </p>
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: '#10b981' }}
            >
              <Download size={16} />
              Instalar Seva
            </button>
          </div>
        </div>
      ) : null}

      {updateReady ? (
        <div className="fixed inset-x-3 bottom-[6.2rem] z-[115] animate-seva-slide-up sm:bottom-4 sm:left-auto sm:right-4 sm:w-[360px]">
          <div className="rounded-[1.6rem] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>Actualización lista</p>
            <h2 className="mt-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Hay una nueva versión de Seva.</h2>
            <p className="mt-2 text-sm leading-5" style={{ color: 'var(--text-secondary)' }}>
              Recarga para usar la versión más reciente y mantener el caché sincronizado.
            </p>
            <button
              type="button"
              onClick={handleApplyUpdate}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: '#10b981' }}
            >
              <RefreshCcw size={16} />
              Actualizar ahora
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}