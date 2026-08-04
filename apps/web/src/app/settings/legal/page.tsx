import Link from 'next/link';
import { ArrowLeft, Scale, FileText, ShieldCheck } from 'lucide-react';

const APP_NAME = 'Seva';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0';
const EFFECTIVE_DATE = '1 de enero de 2026';

type LegalSectionProps = {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
};

function LegalSection({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  children,
}: LegalSectionProps) {
  return (
    <div className="bg-card border-border rounded-3xl border p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon size={16} className={iconColor} />
        </div>
        <h2 className="text-primary text-sm font-bold">{title}</h2>
      </div>
      <div className="text-secondary space-y-2 text-xs leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {/* ── Header ── */}
          <div className="flex items-center gap-3 pt-6 pb-5">
            <Link
              href="/settings"
              className="bg-card border-border text-secondary hover:text-primary hover:bg-card-hover flex h-9 w-9 items-center justify-center rounded-xl border transition-colors"
            >
              <ArrowLeft size={17} />
            </Link>
            <div>
              <h1 className="text-primary text-lg leading-tight font-bold">
                Información legal
              </h1>
              <p className="text-muted text-xs">
                Licencia y condiciones de uso
              </p>
            </div>
          </div>

          {/* ── Licencia ── */}
          <div className="mb-4">
            <p className="text-muted mb-2 px-1 text-[11px] font-bold tracking-widest uppercase">
              Licencia
            </p>
            <LegalSection
              icon={Scale}
              iconBg="bg-indigo-500/10"
              iconColor="text-indigo-500"
              title="Licencia de uso"
            >
              <p>
                Al usar <strong className="text-primary">{APP_NAME}</strong>{' '}
                (versión {APP_VERSION}) aceptas los términos de esta licencia,
                vigente desde el{' '}
                <strong className="text-primary">{EFFECTIVE_DATE}</strong>.
              </p>
              <p>
                Se te concede una licencia{' '}
                <strong className="text-primary">
                  personal, no exclusiva, intransferible y revocable
                </strong>{' '}
                para usar esta aplicación exclusivamente para gestionar tus
                propias finanzas personales.
              </p>
              <p>
                Queda expresamente{' '}
                <strong className="text-primary">prohibido</strong>:
              </p>
              <ul className="list-inside list-disc space-y-1 pl-1">
                <li>
                  Copiar, modificar o distribuir la aplicación o su código
                  fuente.
                </li>
                <li>
                  Usar la aplicación con fines comerciales sin autorización
                  escrita previa.
                </li>
                <li>
                  Realizar ingeniería inversa sobre el código de la aplicación.
                </li>
              </ul>
            </LegalSection>
          </div>

          {/* ── Condiciones de Uso ── */}
          <div className="mb-4">
            <p className="text-muted mb-2 px-1 text-[11px] font-bold tracking-widest uppercase">
              Condiciones de uso
            </p>
            <div className="space-y-3">
              <LegalSection
                icon={FileText}
                iconBg="bg-blue-500/10"
                iconColor="text-blue-500"
                title="Uso aceptable"
              >
                <p>
                  {APP_NAME} está diseñada para el registro y seguimiento de
                  gastos e ingresos personales. Al usarla, te comprometes a:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-1">
                  <li>
                    Usar la aplicación únicamente para fines personales y
                    lícitos.
                  </li>
                  <li>
                    No intentar acceder a cuentas o datos de otros usuarios.
                  </li>
                  <li>
                    No automatizar el uso de la aplicación de formas no
                    previstas (bots, scrapers, etc.), excepto mediante las
                    integraciones oficiales (API / Shortcuts).
                  </li>
                  <li>
                    No introducir código malicioso ni intentar comprometer la
                    seguridad del servicio.
                  </li>
                </ul>
              </LegalSection>

              <LegalSection
                icon={FileText}
                iconBg="bg-blue-500/10"
                iconColor="text-blue-500"
                title="Tu cuenta y tus datos"
              >
                <ul className="list-inside list-disc space-y-1 pl-1">
                  <li>
                    Eres responsable de mantener la confidencialidad de tus
                    credenciales de acceso. No compartas tu cuenta con terceros.
                  </li>
                  <li>
                    Eres el único responsable de la exactitud de los datos
                    financieros que registres en la aplicación.
                  </li>
                  <li>
                    Puedes solicitar la eliminación permanente de tu cuenta y
                    todos tus datos en cualquier momento contactando al soporte.
                  </li>
                </ul>
              </LegalSection>
            </div>
          </div>

          {/* ── Privacidad ── */}
          <div className="mb-4">
            <p className="text-muted mb-2 px-1 text-[11px] font-bold tracking-widest uppercase">
              Privacidad y datos
            </p>
            <LegalSection
              icon={ShieldCheck}
              iconBg="bg-emerald-500/10"
              iconColor="text-emerald-500"
              title="Tratamiento de datos personales"
            >
              <p>{APP_NAME} almacena tus datos de forma segura.</p>
              <p>Los datos que almacenamos incluyen:</p>
              <ul className="list-inside list-disc space-y-1 pl-1">
                <li>Datos de cuenta: correo electrónico e imagen de perfil.</li>
                <li>
                  Datos financieros: transacciones, categorías, cuentas y
                  etiquetas que registres voluntariamente.
                </li>
              </ul>
              <p>
                <strong className="text-primary">
                  No vendemos ni compartimos
                </strong>{' '}
                tus datos personales con terceros.
              </p>
            </LegalSection>
          </div>

          {/* Footer */}
          <p className="text-muted pb-4 text-center text-xs">
            {APP_NAME} · Versión {APP_VERSION} · Vigente desde {EFFECTIVE_DATE}
          </p>
        </div>
      </div>
    </div>
  );
}
