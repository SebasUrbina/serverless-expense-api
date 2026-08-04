'use client';

import { useState } from 'react';
import { Key, Eye, EyeOff, Copy, RefreshCw, Check, Zap } from 'lucide-react';
import { useApiKey, useGenerateApiKey } from '@/hooks/usePreferences';
import { ShortcutsSetupModal } from '@/components/ShortcutsSetupModal';

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

  const handleRegenerate = () => {
    generateMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmRegenerate(false);
      },
    });
  };

  return (
    <div className="space-y-5 pt-2">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10">
          <Key className="text-sky-500" size={20} />
        </div>
        <div>
          <h3 className="text-primary text-xl font-bold tracking-tight">
            Atajos de Apple
          </h3>
          <p className="text-muted text-xs">
            Automatiza tus movimientos de forma simple y segura
          </p>
        </div>
      </div>

      <p className="text-secondary mb-6 text-sm">
        Crea una clave privada para registrar movimientos desde tus atajos de
        iPhone. Usa esta clave solo en tus automatizaciones personales y no la
        compartas con nadie.
      </p>

      <div className="bg-card border-border mb-6 rounded-2xl border p-4">
        <p className="text-secondary mb-2 text-xs font-semibold uppercase">
          Tu clave privada
        </p>

        {isLoading ? (
          <div className="bg-inset h-10 animate-pulse rounded-xl" />
        ) : apiKey ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="bg-inset border-border-subtle flex min-h-[44px] flex-1 items-center overflow-hidden rounded-xl border px-4 py-2.5">
              <span className="truncate font-mono text-sm text-emerald-400">
                {showKey ? apiKey : '••••••••••••••••••••••••'}
              </span>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setShowKey(!showKey)}
                className="bg-inset text-muted border-border-subtle hover:text-primary flex h-11 w-11 items-center justify-center rounded-xl border transition-colors"
                title={showKey ? 'Ocultar clave' : 'Mostrar clave'}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                onClick={handleCopy}
                className="bg-inset text-muted border-border-subtle hover:text-primary flex h-11 w-11 items-center justify-center rounded-xl border transition-colors"
                title="Copiar clave"
              >
                {copied ? (
                  <Check size={18} className="text-emerald-400" />
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-secondary py-2 text-sm italic">
            Todavía no tienes una clave creada.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {!confirmRegenerate ? (
          <button
            onClick={() => setConfirmRegenerate(true)}
            disabled={generateMutation.isPending || isLoading}
            className="bg-card-hover hover:bg-border text-primary border-border-subtle flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
          >
            <RefreshCw
              size={16}
              className={generateMutation.isPending ? 'animate-spin' : ''}
            />
            {apiKey ? 'Generar una nueva clave' : 'Crear clave'}
          </button>
        ) : (
          <div className="flex flex-1 gap-2">
            <button
              onClick={handleRegenerate}
              className="text-primary flex flex-1 items-center justify-center rounded-xl bg-red-500 px-4 py-3 text-sm font-medium transition-colors hover:bg-red-400"
            >
              Confirmar
            </button>
            <button
              onClick={() => setConfirmRegenerate(false)}
              className="bg-card-hover hover:bg-border text-primary flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        <button
          onClick={() => setShowSetupModal(true)}
          className="text-primary flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400"
        >
          <Zap size={16} className="fill-emerald-100" />
          Configurar atajo en iPhone
        </button>
      </div>

      <ShortcutsSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
      />
    </div>
  );
}
