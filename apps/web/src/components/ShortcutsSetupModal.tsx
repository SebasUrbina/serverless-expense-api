'use client';

import { useRef, useState } from 'react';
import { useDialog } from '@/hooks/useDialog';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Clock,
} from 'lucide-react';
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
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setStep(0);
    setShowKey(false);
    setCopied(false);
    onClose();
  };
  useDialog(isOpen, handleClose, dialogRef);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canGoBack = step > 0;
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--backdrop-bg)] p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Configurar Atajos de iOS, paso ${step + 1} de ${TOTAL_STEPS}`}
        tabIndex={-1}
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl shadow-2xl focus:outline-none"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          maxHeight: '90vh',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Cerrar"
          onClick={handleClose}
          className="text-muted hover:text-primary hover:bg-card-hover focus-ring absolute top-4 right-4 z-10 rounded-xl p-2 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 pt-5 pb-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full transition-all duration-300"
              style={{
                background: i <= step ? 'var(--accent)' : 'var(--border)',
                width: i === step ? 10 : 8,
                height: i === step ? 10 : 8,
              }}
            />
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-4">
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
        <div className="flex gap-3 px-6 pt-2 pb-6">
          {canGoBack && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors"
              style={{
                background: 'var(--bg-inset)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
          )}
          <button
            type="button"
            onClick={isLastStep ? handleClose : () => setStep(step + 1)}
            className="bg-accent focus-ring text-on-accent hover:bg-accent-hover flex flex-[1.5] items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors"
          >
            {isLastStep ? (
              'Cerrar'
            ) : (
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
    <div className="flex flex-col items-center py-4 text-center">
      {/* Shortcuts app icon */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-pink-400 via-purple-400 to-blue-500 shadow-lg shadow-purple-500/20">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="4"
            fill="white"
            fillOpacity="0.3"
          />
          <rect
            x="6"
            y="6"
            width="12"
            height="12"
            rx="3"
            fill="white"
            fillOpacity="0.5"
          />
          <path
            d="M12 8v8M8 12h8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h2
        className="mb-3 text-2xl font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        Crear el atajo
      </h2>

      <p
        className="mb-6 text-sm leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Toca el botón de abajo para agregar la acción de Seva a Atajos, estando
        ahí presiona el botón &apos;Agregar atajo&apos; para que se cree
        automáticamente la acción.
      </p>

      {shortcutUrl ? (
        <a
          href={shortcutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center gap-2 rounded-full bg-[var(--bg-button)] px-6 py-3 text-sm font-semibold shadow-lg transition-colors hover:bg-[var(--bg-card-hover)]"
        >
          <span className="text-lg">＋</span>
          Agregar atajo
        </a>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-zinc-800 px-6 py-3 text-sm font-semibold text-zinc-400"
          >
            <span className="text-lg">＋</span>
            Atajo no encontrado
          </button>
          <p
            className="max-w-xs text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Falta configurar `NEXT_PUBLIC_IOS_SHORTCUT_URL` para poder abrir el
            atajo desde la app.
          </p>
        </div>
      )}
    </div>
  );
}

function StepCreateAutomation() {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <h2
        className="mb-3 text-2xl font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        Crear la automatización
      </h2>

      <p
        className="mb-8 text-sm leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Dentro de la misma app de Atajos, ve a la pestaña
        &apos;Automatizaciones&apos;, ahí toca el botón &apos;+&apos; de la
        esquina superior derecha para crear una nueva automatización.
      </p>

      {/* Mock iOS tab bar */}
      <div
        className="flex w-64 items-center justify-center gap-1 rounded-2xl px-2 py-3"
        style={{
          background: 'var(--bg-inset)',
          border: '1px solid var(--border)',
        }}
      >
        <TabItem icon="📚" label="Library" active={false} />
        <TabItem icon="✅" label="Automation" active={true} />
        <TabItem icon="🧩" label="Gallery" active={false} />
      </div>
    </div>
  );
}

function TabItem({
  icon,
  label,
  active,
}: {
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl px-4 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-blue-500/15 text-blue-500' : ''
      }`}
      style={active ? {} : { color: 'var(--text-muted)' }}
    >
      <span className="mb-0.5 text-base">{icon}</span>
      {label}
    </div>
  );
}

function StepSelectWallet() {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <h2
        className="mb-3 text-2xl font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        Selecciona Wallet
      </h2>

      <p
        className="mb-8 text-sm leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Busca en el listado de acciones &apos;Al realizar un pago sin contacto
        con mi tarjeta o pase de Wallet&apos; o &apos;When I tap a Wallet Card
        or Pass&apos; y selecciónala.
      </p>

      {/* Mock list item */}
      <div
        className="flex w-full items-center gap-3 rounded-2xl p-4"
        style={{
          background: 'var(--bg-inset)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 via-green-400 to-blue-400">
          <span className="text-primary text-lg">💳</span>
        </div>
        <div className="flex-1 text-left">
          <p
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Wallet
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            &quot;Al realizar un pago sin contacto con mi tarjeta o pase de
            Wallet&quot;
          </p>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  );
}

function StepConfigureExecution() {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      {/* Card icon */}
      <div
        className="mb-6 flex h-14 w-20 items-center justify-center rounded-xl"
        style={{ background: 'var(--accent)' }}
      >
        <div className="flex h-8 w-12 items-end rounded-md border-2 border-white/60 pb-1 pl-1.5">
          <div className="h-3 w-4 rounded-sm bg-[var(--text-primary)]/80" />
        </div>
      </div>

      <h2
        className="mb-3 text-2xl font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        Configura la ejecución
      </h2>

      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Selecciona las tarjetas que quieres usar y activa &apos;Ejecutar
        inmediatamente&apos; o &apos;Run Immediately&apos; para que se registren
        los gastos sin preguntar.
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
    <div className="flex flex-col items-center py-4 text-center">
      <h2
        className="mb-3 text-2xl font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        Agrega el atajo de Seva
      </h2>

      <p
        className="mb-4 text-sm leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        En la lista de &apos;Mis atajos&apos; o &apos;My Shortcuts&apos;, busca
        &apos;Seva&apos; y selecciona &apos;Enviar gastos de Wallet a
        Seva&apos;.
      </p>

      {/* API Key section */}
      <div
        className="mb-4 w-full rounded-2xl p-4"
        style={{
          background: 'var(--bg-inset)',
          border: '1px solid var(--border)',
        }}
      >
        <p
          className="mb-3 text-sm font-semibold"
          style={{ color: 'var(--text-muted)' }}
        >
          Tu API Key (la necesitarás al importar)
        </p>

        {isLoading ? (
          <div className="bg-card h-10 animate-pulse rounded-xl" />
        ) : apiKey ? (
          <div className="flex flex-col gap-2">
            <div
              className="flex min-h-[44px] items-center overflow-hidden rounded-xl px-3 py-2.5"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              <span className="text-primary flex-1 truncate text-left font-mono text-xs">
                {showKey ? apiKey : '••••••••••••••••••••••••'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onToggleShow}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-colors"
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                {showKey ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                onClick={onCopy}
                className="bg-accent focus-ring text-on-accent hover:bg-accent-hover flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '¡Copiada!' : 'Copiar Key'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p
              className="py-1 text-sm italic"
              style={{ color: 'var(--text-muted)' }}
            >
              Aún no tienes API Key. Genera una para continuar.
            </p>
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="bg-accent focus-ring text-on-accent hover:bg-accent-hover flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isGenerating ? 'animate-spin' : ''}
              />
              {isGenerating ? 'Generando…' : 'Generar API Key'}
            </button>
          </div>
        )}
      </div>

      {/* Mock shortcut cards */}
      <div className="flex w-full gap-3">
        <div className="text-primary flex-1 rounded-xl bg-cyan-500 p-3 text-center">
          <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--text-primary)]/20">
            <span className="text-xs font-bold">S</span>
          </div>
          <p className="text-[10px] leading-tight font-semibold">
            Enviar gastos a Seva
          </p>
          <Check
            size={14}
            className="mx-auto mt-1 text-[var(--text-primary)]/80"
          />
        </div>
        <div
          className="flex-1 rounded-xl p-3 text-center"
          style={{
            background: 'var(--bg-inset)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--border)' }}
          >
            <span
              className="text-xs font-bold"
              style={{ color: 'var(--text-muted)' }}
            >
              S
            </span>
          </div>
          <p
            className="text-[10px] leading-tight font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Enviar emails de gastos a Seva
          </p>
        </div>
      </div>
    </div>
  );
}

function StepDone() {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      {/* Checkmark */}
      <div className="bg-accent-soft mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <Check size={40} className="text-accent" strokeWidth={3} />
      </div>

      <h2
        className="mb-3 text-2xl font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        ¡Listo!
      </h2>

      <p
        className="mb-8 text-sm leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Toca &apos;Listo&apos; para guardar. Ahora cada vez que pagues con Apple
        Pay, el gasto se agregará automáticamente a Seva. La primera vez que
        hagas un pago, iOS puede mostrar un aviso preguntando si permites el
        acceso. Selecciona &apos;Permitir siempre&apos; para que no vuelva a
        preguntar.
      </p>

      {/* Feature cards */}
      <div
        className="w-full rounded-2xl p-5"
        style={{
          background: 'var(--bg-inset)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="bg-card mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <Sparkles size={18} className="text-secondary" />
          </div>
          <div className="text-left">
            <p
              className="text-sm font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Detección automática de gastos
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              El sistema detecta automáticamente las compras con tus tarjetas
              registradas en Wallet
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="bg-card mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <Clock size={18} className="text-secondary" />
          </div>
          <div className="text-left">
            <p
              className="text-sm font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
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
