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
      }
    });
  };

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-sky-500/10">
          <Key className="text-sky-500" size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Atajos de Apple</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Automatiza tus movimientos de forma simple y segura</p>
        </div>
      </div>
      
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Crea una clave privada para registrar movimientos desde tus atajos de iPhone. Usa esta clave solo en tus automatizaciones personales y no la compartas con nadie.
      </p>

      <div
        className="rounded-2xl p-4 mb-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Tu clave privada</p>
        
        {isLoading ? (
          <div className="h-10 animate-pulse rounded-xl" style={{ background: 'var(--bg-inset)' }}></div>
        ) : apiKey ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <div
              className="flex-1 flex items-center rounded-xl px-4 py-2.5 min-h-[44px] overflow-hidden"
              style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}
            >
              <span className="font-mono truncate text-sm" style={{ color: 'var(--color-income)' }}>
                {showKey ? apiKey : '••••••••••••••••••••••••'}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowKey(!showKey)}
                className="flex items-center justify-center w-11 h-11 rounded-xl transition-colors"
                style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                title={showKey ? 'Ocultar clave' : 'Mostrar clave'}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center w-11 h-11 rounded-xl transition-colors"
                style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                title="Copiar clave"
              >
                {copied ? <Check size={18} style={{ color: 'var(--color-income)' }} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm italic py-2" style={{ color: 'var(--text-secondary)' }}>Todavía no tienes una clave creada.</div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {!confirmRegenerate ? (
          <button 
            onClick={() => setConfirmRegenerate(true)}
            disabled={generateMutation.isPending || isLoading}
            className="flex-1 bg-card-hover hover:bg-border text-primary font-medium py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-border-subtle"
          >
            <RefreshCw size={16} className={generateMutation.isPending ? "animate-spin" : ""} />
            {apiKey ? 'Generar una nueva clave' : 'Crear clave'}
          </button>
        ) : (
          <div className="flex-1 flex gap-2">
            <button 
              onClick={handleRegenerate}
              className="flex-1 bg-red-500 hover:bg-red-400 text-white font-medium py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center"
            >
              Confirmar
            </button>
            <button 
              onClick={() => setConfirmRegenerate(false)}
              className="flex-1 bg-card-hover hover:bg-border text-primary font-medium py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center"
            >
              Cancelar
            </button>
          </div>
        )}

        <button 
          onClick={() => setShowSetupModal(true)}
          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Zap size={16} className="fill-emerald-100" />
          Configurar atajo en iPhone
        </button>
      </div>

      <ShortcutsSetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} />
    </div>
  );
}
