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

function LegalSection({ icon: Icon, iconBg, iconColor, title, children }: LegalSectionProps) {
  return (
    <div className="rounded-3xl p-5 bg-card border border-border shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
        <h2 className="text-sm font-bold text-primary">
          {title}
        </h2>
      </div>
      <div className="text-xs leading-relaxed space-y-2 text-secondary">
        {children}
      </div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-10">
        <div className="max-w-2xl mx-auto">

          {/* ── Header ── */}
          <div className="pt-6 pb-5 flex items-center gap-3">
            <Link
              href="/settings"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors bg-card border border-border text-secondary hover:text-primary hover:bg-card-hover"
            >
              <ArrowLeft size={17} />
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight text-primary">
                Información legal
              </h1>
              <p className="text-xs text-muted">
                Licencia y condiciones de uso
              </p>
            </div>
          </div>

          {/* ── Licencia ── */}
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 px-1 text-muted">
              Licencia
            </p>
            <LegalSection icon={Scale} iconBg="bg-indigo-500/10" iconColor="text-indigo-500" title="Licencia de uso">
              <p>
                Al usar <strong className="text-primary">{APP_NAME}</strong> (versión {APP_VERSION})
                aceptas los términos de esta licencia, vigente desde el{' '}
                <strong className="text-primary">{EFFECTIVE_DATE}</strong>.
              </p>
              <p>
                Se te concede una licencia <strong className="text-primary">personal,
                no exclusiva, intransferible y revocable</strong> para usar esta aplicación
                exclusivamente para gestionar tus propias finanzas personales.
              </p>
              <p>Queda expresamente <strong className="text-primary">prohibido</strong>:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Copiar, modificar o distribuir la aplicación o su código fuente.</li>
                <li>Usar la aplicación con fines comerciales sin autorización escrita previa.</li>
                <li>Realizar ingeniería inversa sobre el código de la aplicación.</li>
              </ul>
            </LegalSection>
          </div>

          {/* ── Condiciones de Uso ── */}
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 px-1 text-muted">
              Condiciones de uso
            </p>
            <div className="space-y-3">
              <LegalSection icon={FileText} iconBg="bg-blue-500/10" iconColor="text-blue-500" title="Uso aceptable">
                <p>
                  {APP_NAME} está diseñada para el registro y seguimiento de gastos e ingresos
                  personales. Al usarla, te comprometes a:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>
                    Usar la aplicación únicamente para fines personales y lícitos.
                  </li>
                  <li>
                    No intentar acceder a cuentas o datos de otros usuarios.
                  </li>
                  <li>
                    No automatizar el uso de la aplicación de formas no previstas
                    (bots, scrapers, etc.), excepto mediante las integraciones oficiales (API / Shortcuts).
                  </li>
                  <li>
                    No introducir código malicioso ni intentar comprometer la seguridad del servicio.
                  </li>
                </ul>
              </LegalSection>

              <LegalSection icon={FileText} iconBg="bg-blue-500/10" iconColor="text-blue-500" title="Tu cuenta y tus datos">
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>
                    Eres responsable de mantener la confidencialidad de tus credenciales
                    de acceso. No compartas tu cuenta con terceros.
                  </li>
                  <li>
                    Eres el único responsable de la exactitud de los datos financieros
                    que registres en la aplicación.
                  </li>
                  <li>
                    Puedes solicitar la eliminación permanente de tu cuenta y todos
                    tus datos en cualquier momento contactando al soporte.
                  </li>
                </ul>
              </LegalSection>
            </div>
          </div>

          {/* ── Privacidad ── */}
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 px-1 text-muted">
              Privacidad y datos
            </p>
            <LegalSection icon={ShieldCheck} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" title="Tratamiento de datos personales">
              <p>
                {APP_NAME} almacena tus datos de forma segura.
              </p>
              <p>Los datos que almacenamos incluyen:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Datos de cuenta: correo electrónico e imagen de perfil.</li>
                <li>
                  Datos financieros: transacciones, categorías, cuentas y etiquetas que
                  registres voluntariamente.
                </li>
              </ul>
              <p>
                <strong className="text-primary">No vendemos ni compartimos</strong> tus
                datos personales con terceros.
              </p>
            </LegalSection>
          </div>

          {/* Footer */}
          <p className="text-center text-xs pb-4 text-muted">
            {APP_NAME} · Versión {APP_VERSION} · Vigente desde {EFFECTIVE_DATE}
          </p>

        </div>
      </div>
    </div>
  );
}
