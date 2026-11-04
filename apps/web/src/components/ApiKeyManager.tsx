'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, RefreshCw, Check, Smartphone } from 'lucide-react';
import { useApiKey, useGenerateApiKey } from '@/hooks/usePreferences';
import { ShortcutsSetupModal } from '@/components/ShortcutsSetupModal';
import { IconButton, PrimaryButton, secondaryButtonClass } from './settings/ui';

export function ApiKeyManager() {
  const { data, isLoading } = useApiKey();
  const generateMutation = useGenerateApiKey();

  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const apiKey = data?.key || '';

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generate = () =>
    generateMutation.mutate(undefined, {
      onSuccess: () => setConfirmRegenerate(false),
    });

  return (
    <div className="space-y-6">
      <div className="bg-inset flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
        <Smartphone
          size={22}
          className="text-secondary hidden shrink-0 sm:block"
          aria-hidden="true"
        />
        <p className="text-secondary flex-1 text-sm">
          Registra cada pago con Apple Pay automáticamente. La guía te lleva
          paso a paso por la automatización en Atajos.
        </p>
        <PrimaryButton type="button" onClick={() => setShowSetupModal(true)}>
          Configurar en iPhone
        </PrimaryButton>
      </div>

      <div>
        <h3 className="text-primary text-sm font-semibold">Clave privada</h3>
        <p className="text-secondary mt-1 text-sm">
          Los atajos la usan para registrar movimientos en tu nombre. No la
          compartas con nadie.
        </p>

        <div className="mt-3">
          {isLoading ? (
            <div className="bg-inset h-11 animate-pulse rounded-xl" />
          ) : apiKey ? (
            <div className="border-border flex h-11 items-center gap-1 rounded-xl border pr-1 pl-3.5">
              <span className="text-primary min-w-0 flex-1 truncate font-mono text-sm">
                {showKey ? apiKey : '•••••••••••••••••••••••••'}
              </span>
              <IconButton
                label={showKey ? 'Ocultar clave' : 'Mostrar clave'}
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </IconButton>
              <IconButton
                label={copied ? 'Clave copiada' : 'Copiar clave'}
                onClick={handleCopy}
              >
                {copied ? (
                  <Check size={16} className="text-accent" />
                ) : (
                  <Copy size={16} />
                )}
              </IconButton>
            </div>
          ) : (
            <p className="text-secondary text-sm">Aún no tienes una clave.</p>
          )}
        </div>

        <div className="mt-3">
          {!apiKey ? (
            <PrimaryButton
              type="button"
              onClick={generate}
              loading={generateMutation.isPending}
              disabled={isLoading}
            >
              Crear clave
            </PrimaryButton>
          ) : !confirmRegenerate ? (
            <button
              type="button"
              onClick={() => setConfirmRegenerate(true)}
              disabled={isLoading}
              className={secondaryButtonClass}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Generar una nueva clave
            </button>
          ) : (
            <div role="alert" className="bg-inset rounded-2xl p-4">
              <p className="text-primary text-sm font-semibold">
                ¿Generar una nueva clave?
              </p>
              <p className="text-secondary mt-1 text-sm">
                La clave actual dejará de funcionar y tendrás que actualizarla
                en tus atajos.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmRegenerate(false)}
                  className={secondaryButtonClass}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={generate}
                  disabled={generateMutation.isPending}
                  className="focus-ring inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {generateMutation.isPending && (
                    <RefreshCw size={15} className="animate-spin" />
                  )}
                  Generar nueva
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ShortcutsSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
      />
    </div>
  );
}
