'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Copy, Check, Eye, EyeOff, RefreshCw, Sparkles, Clock } from 'lucide-react';
import { useApiKey, useGenerateApiKey } from '@/hooks/usePreferences';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const TOTAL_STEPS = 6;
const SHORTCUT_URL = process.env.NEXT_PUBLIC_IOS_SHORTCUT_URL?.trim() || '';

export function ShortcutsSetupModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useApiKey();
  const generateMutation = useGenerateApiKey();
  const apiKey = data?.key || '';

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep(0);
    setShowKey(false);
    setCopied(false);
    onClose();
  };

  const canGoNext = step < TOTAL_STEPS - 1;
  const canGoBack = step > 0;
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '90vh' }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl text-muted hover:text-primary hover:bg-card-hover transition-colors"
        >
          <X size={20} />
        </button>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 pt-5 pb-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background: i <= step ? 'var(--color-brand-500, #0d9488)' : 'var(--border)',
                width: i === step ? 10 : 8,
                height: i === step ? 10 : 8,
              }}
            />
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 pt-2">
          {step === 0 && <StepCreateShortcut shortcutUrl={SHORTCUT_URL} />}
          {step === 1 && <StepCreateAutomation />}
          {step === 2 && <StepSelectWallet />}
          {step === 3 && <StepConfigureExecution />}
          {step === 4 && (
            <StepAddShortcut
              apiKey={apiKey}
              isLoading={isLoading}
              showKey={showKey}
              copied={copied}
              onToggleShow={() => setShowKey(!showKey)}
              onCopy={handleCopy}
              onGenerate={() => generateMutation.mutate()}
              isGenerating={generateMutation.isPending}
            />
          )}
          {step === 5 && <StepDone />}
        </div>

        {/* Footer buttons */}
        <div className="px-6 pb-6 pt-2 flex gap-3">
          {canGoBack && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors"
              style={{ background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
          )}
          <button
            onClick={isLastStep ? handleClose : () => setStep(step + 1)}
            className="flex-[1.5] flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white transition-colors bg-teal-700 hover:bg-teal-600"
          >
            {isLastStep ? 'Cerrar' : (
              <>
                Siguiente
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Step Components ──────────────────────────────────── */

function StepCreateShortcut({ shortcutUrl }: { shortcutUrl: string }) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      {/* Shortcuts app icon */}
      <div className="w-24 h-24 rounded-[1.5rem] bg-gradient-to-br from-pink-400 via-purple-400 to-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="4" fill="white" fillOpacity="0.3" />
          <rect x="6" y="6" width="12" height="12" rx="3" fill="white" fillOpacity="0.5" />
          <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        Crear el atajo
      </h2>

      <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
        Toca el botón de abajo para agregar la acción de Seva a Atajos, estando ahí presiona el botón
        &apos;Agregar atajo&apos; para que se cree automáticamente la acción.
      </p>

      {shortcutUrl ? (
        <a
          href={shortcutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-black text-white font-semibold py-3 px-6 rounded-full text-sm hover:bg-zinc-800 transition-colors shadow-lg"
        >
          <span className="text-lg">＋</span>
          Agregar atajo
        </a>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 bg-zinc-800 text-zinc-400 font-semibold py-3 px-6 rounded-full text-sm cursor-not-allowed"
          >
            <span className="text-lg">＋</span>
            Atajo no configurado
          </button>
          <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>
            Falta configurar `NEXT_PUBLIC_IOS_SHORTCUT_URL` para poder abrir el atajo desde la app.
          </p>
        </div>
      )}
    </div>
  );
}

function StepCreateAutomation() {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        Crear la automatización
      </h2>

      <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
        Dentro de la misma app de Atajos, ve a la pestaña &apos;Automatizaciones&apos;, ahí toca el botón &apos;+&apos;
        de la esquina superior derecha para crear una nueva automatización.
      </p>

      {/* Mock iOS tab bar */}
      <div
        className="rounded-2xl px-2 py-3 flex items-center justify-center gap-1 w-64"
        style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)' }}
      >
        <TabItem icon="📚" label="Library" active={false} />
        <TabItem icon="✅" label="Automation" active={true} />
        <TabItem icon="🧩" label="Gallery" active={false} />
      </div>
    </div>
  );
}

function TabItem({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <div
      className={`flex flex-col items-center px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${
        active ? 'bg-blue-500/15 text-blue-500' : ''
      }`}
      style={active ? {} : { color: 'var(--text-muted)' }}
    >
      <span className="text-base mb-0.5">{icon}</span>
      {label}
    </div>
  );
}

function StepSelectWallet() {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        Selecciona Wallet
      </h2>

      <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
        Busca en el listado de acciones &apos;Al realizar un pago sin contacto con mi tarjeta o pase de
        Wallet&apos; o &apos;When I tap a Wallet Card or Pass&apos; y selecciónala.
      </p>

      {/* Mock list item */}
      <div
        className="w-full rounded-2xl p-4 flex items-center gap-3"
        style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 via-green-400 to-blue-400 flex items-center justify-center shrink-0">
          <span className="text-white text-lg">💳</span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Wallet</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            &quot;Al realizar un pago sin contacto con mi tarjeta o pase de Wallet&quot;
          </p>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  );
}

function StepConfigureExecution() {
  return (
    <div className="flex flex-col items-center text-center py-4">
      {/* Card icon */}
      <div
        className="w-20 h-14 rounded-xl flex items-center justify-center mb-6"
        style={{ background: 'var(--color-brand-500, #0d9488)' }}
      >
        <div className="w-12 h-8 rounded-md border-2 border-white/60 flex items-end pl-1.5 pb-1">
          <div className="w-4 h-3 rounded-sm bg-white/80" />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        Configura la ejecución
      </h2>

      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Selecciona las tarjetas que quieres usar y activa &apos;Ejecutar inmediatamente&apos; o
        &apos;Run Immediately&apos; para que se registren los gastos sin preguntar.
      </p>
    </div>
  );
}

function StepAddShortcut({
  apiKey,
  isLoading,
  showKey,
  copied,
  onToggleShow,
  onCopy,
  onGenerate,
  isGenerating,
}: {
  apiKey: string;
  isLoading: boolean;
  showKey: boolean;
  copied: boolean;
  onToggleShow: () => void;
  onCopy: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        Agrega el atajo de Seva
      </h2>

      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
        En la lista de &apos;Mis atajos&apos; o &apos;My Shortcuts&apos;, busca &apos;Seva&apos; y selecciona
        &apos;Enviar gastos de Wallet a Seva&apos;.
      </p>

      {/* API Key section */}
      <div
        className="w-full rounded-2xl p-4 mb-4"
        style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Tu API Key (la necesitarás al importar)
        </p>

        {isLoading ? (
          <div className="h-10 bg-card animate-pulse rounded-xl" />
        ) : apiKey ? (
          <div className="flex flex-col gap-2">
            <div
              className="flex items-center rounded-xl px-3 py-2.5 min-h-[44px] overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <span className="font-mono text-emerald-400 truncate text-xs flex-1 text-left">
                {showKey ? apiKey : '••••••••••••••••••••••••'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onToggleShow}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors"
                style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                {showKey ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                onClick={onCopy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-colors bg-emerald-500 hover:bg-emerald-400"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '¡Copiada!' : 'Copiar Key'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm italic py-1" style={{ color: 'var(--text-muted)' }}>
              Aún no tienes API Key. Genera una para continuar.
            </p>
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 transition-colors"
            >
              <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? 'Generando…' : 'Generar API Key'}
            </button>
          </div>
        )}
      </div>

      {/* Mock shortcut cards */}
      <div className="flex gap-3 w-full">
        <div className="flex-1 rounded-xl p-3 text-center bg-cyan-500 text-white">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mx-auto mb-1.5">
            <span className="text-xs font-bold">m</span>
          </div>
          <p className="text-[10px] font-semibold leading-tight">Enviar gastos a Seva</p>
          <Check size={14} className="mx-auto mt-1 text-white/80" />
        </div>
        <div
          className="flex-1 rounded-xl p-3 text-center"
          style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5"
            style={{ background: 'var(--border)' }}
          >
            <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>m</span>
          </div>
          <p className="text-[10px] font-semibold leading-tight" style={{ color: 'var(--text-muted)' }}>
            Enviar emails de gastos a Miga
          </p>
        </div>
      </div>
    </div>
  );
}

function StepDone() {
  return (
    <div className="flex flex-col items-center text-center py-4">
      {/* Checkmark */}
      <div className="w-20 h-20 rounded-full bg-teal-700 flex items-center justify-center mb-6 shadow-lg shadow-teal-700/30">
        <Check size={40} className="text-white" strokeWidth={3} />
      </div>

      <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        ¡Listo!
      </h2>

      <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
        Toca &apos;Listo&apos; para guardar. Ahora cada vez que pagues con Apple Pay, el gasto se agregará
        automáticamente a Miga. La primera vez que hagas un pago, iOS puede mostrar un aviso preguntando si
        permites el acceso. Selecciona &apos;Permitir siempre&apos; para que no vuelva a preguntar.
      </p>

      {/* Feature cards */}
      <div
        className="w-full rounded-2xl p-5"
        style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={18} className="text-teal-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Detección automatica de gastos
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              El sistema detecta automáticamente las compras con tus tarjetas registradas en Wallet
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
            <Clock size={18} className="text-blue-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Sin intervención manual
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Los gastos se registran automáticamente al pagar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
