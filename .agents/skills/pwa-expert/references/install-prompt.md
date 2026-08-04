# Install Prompt Implementation

## usePWAInstall Hook

```typescript
// hooks/usePWAInstall.ts
'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === 'accepted';
  };

  return { isInstallable, isInstalled, install };
}
```

## Install Prompt Component

```tsx
// components/InstallPrompt.tsx
'use client';

import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState } from 'react';

export function InstallPrompt() {
  const { isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="bg-leather-800 border-leather-600 animate-slide-up fixed right-4 bottom-20 left-4 z-50 rounded-lg border p-4 shadow-lg md:right-4 md:left-auto md:w-80">
      <div className="flex items-start gap-3">
        <img src="/icons/icon-64.png" alt="" className="h-12 w-12 rounded-lg" />
        <div className="flex-1">
          <h3 className="font-bitter text-leather-100 text-lg">Install JB4L</h3>
          <p className="text-leather-400 mt-1 text-sm">
            Get quick access and offline support
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-leather-500 hover:text-leather-300"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setDismissed(true)}
          className="text-leather-400 hover:text-leather-200 flex-1 px-4 py-2"
        >
          Not now
        </button>
        <button
          onClick={install}
          className="bg-ember-500 hover:bg-ember-600 flex-1 rounded-lg px-4 py-2 font-medium text-white"
        >
          Install
        </button>
      </div>
    </div>
  );
}
```

## Best Practices

1. **Don't show immediately** - Wait for user engagement or after they've used the app a few times
2. **Respect dismissal** - Store in localStorage if user says "Not now"
3. **Show value first** - Explain benefits: offline access, quick launch, etc.
4. **iOS handling** - iOS doesn't support `beforeinstallprompt`, show manual instructions instead
