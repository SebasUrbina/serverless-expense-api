'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCcw, WifiOff, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function PWAController() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.navigator.onLine;
  });
  const [showInstallCard, setShowInstallCard] = useState(false);
  const [updateReady, setUpdateReady] =
    useState<ServiceWorkerRegistration | null>(null);

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
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
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
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        if (registration.waiting && isMounted) {
          setUpdateReady(registration);
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller &&
              isMounted
            ) {
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

  const canInstall = useMemo(
    () => Boolean(deferredPrompt && showInstallCard),
    [deferredPrompt, showInstallCard],
  );

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
        <div
          role="status"
          className="animate-seva-slide-up bg-card border-border shadow-elevated fixed inset-x-3 top-3 z-[120] flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm sm:top-4 sm:right-4 sm:left-auto sm:w-[360px]"
        >
          <WifiOff
            size={18}
            className="text-secondary shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-primary font-semibold">Estás sin conexión</p>
            <p className="text-muted text-xs">
              Seva seguirá mostrando contenido cacheado cuando esté disponible.
            </p>
          </div>
        </div>
      ) : null}

      {canInstall ? (
        <div className="animate-seva-slide-up fixed inset-x-3 bottom-[6.2rem] z-[115] sm:right-4 sm:bottom-4 sm:left-auto sm:w-[360px]">
          <div className="bg-card border-border shadow-elevated rounded-3xl border p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-primary text-base font-bold">
                Guarda Seva en tu pantalla de inicio
              </h2>
              <button
                type="button"
                onClick={() => setShowInstallCard(false)}
                className="text-muted hover:text-primary hover:bg-card-hover focus-ring inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
                aria-label="Cerrar recomendación de instalación"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-secondary text-xs leading-relaxed">
              Ábrela más rápido, como una app, y consulta tus datos aunque no
              tengas conexión.
            </p>
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="bg-accent focus-ring text-on-accent hover:bg-accent-hover mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors"
            >
              <Download size={16} />
              Instalar Seva
            </button>
          </div>
        </div>
      ) : null}

      {updateReady ? (
        <div className="animate-seva-slide-up fixed inset-x-3 bottom-[6.2rem] z-[115] sm:right-4 sm:bottom-4 sm:left-auto sm:w-[360px]">
          <div className="bg-card border-border shadow-elevated rounded-3xl border p-5">
            <h2 className="text-primary text-base font-bold">
              Hay una nueva versión de Seva
            </h2>
            <p className="text-secondary mt-2 text-xs leading-relaxed">
              Recarga para usar la versión más reciente y mantener el caché
              sincronizado.
            </p>
            <button
              type="button"
              onClick={handleApplyUpdate}
              className="bg-accent focus-ring text-on-accent hover:bg-accent-hover mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors"
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
