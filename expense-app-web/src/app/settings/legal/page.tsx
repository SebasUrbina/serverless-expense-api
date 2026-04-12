import Link from 'next/link';
import { ArrowLeft, Scale, FileText, ShieldCheck, AlertTriangle, Mail } from 'lucide-react';

const APP_NAME = 'Seva';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0';
const DEVELOPER_EMAIL = 'contacto@sevaapp.com';
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
    <div
      className="rounded-3xl p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
      </div>
      <div className="text-xs leading-relaxed space-y-2" style={{ color: 'var(--text-secondary)' }}>
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
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={17} />
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                Información legal
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Licencia y condiciones de uso
              </p>
            </div>
          </div>

          {/* ── Licencia ── */}
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
              Licencia
            </p>
            <LegalSection icon={Scale} iconBg="bg-indigo-500/10" iconColor="text-indigo-500" title="Licencia de uso">
              <p>
                Al usar <strong style={{ color: 'var(--text-primary)' }}>{APP_NAME}</strong> (versión {APP_VERSION})
                aceptas los términos de esta licencia, vigente desde el{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{EFFECTIVE_DATE}</strong>.
              </p>
              <p>
                Se te concede una licencia <strong style={{ color: 'var(--text-primary)' }}>personal,
                no exclusiva, intransferible y revocable</strong> para usar esta aplicación
                exclusivamente para gestionar tus propias finanzas personales.
              </p>
              <p>Queda expresamente <strong style={{ color: 'var(--text-primary)' }}>prohibido</strong>:</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Copiar, modificar o distribuir la aplicación o su código fuente.</li>
                <li>Usar la aplicación con fines comerciales sin autorización escrita previa.</li>
                <li>Realizar ingeniería inversa sobre el código de la aplicación.</li>
              </ul>
            </LegalSection>
          </div>

          {/* ── Condiciones de Uso ── */}
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
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

              {/* <LegalSection icon={FileText} iconBg="bg-blue-500/10" iconColor="text-blue-500" title="Disponibilidad del servicio">
                <p>
                  El servicio se proporciona <strong style={{ color: 'var(--text-primary)' }}>&quot;tal como está&quot;</strong> (as-is).
                  No se garantiza disponibilidad continua, ausencia de errores ni exactitud
                  en los cálculos.
                </p>
                <p>
                  El equipo de desarrollo se reserva el derecho de modificar, suspender o
                  discontinuar funcionalidades en cualquier momento, notificando los cambios
                  relevantes cuando sea posible.
                </p>
                <p>
                  Las actualizaciones de la aplicación pueden cambiar estas condiciones.
                  El uso continuado tras una actualización implica la aceptación de los nuevos términos.
                </p>
              </LegalSection> */}
            </div>
          </div>

          {/* ── Privacidad ── */}
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
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
                <strong style={{ color: 'var(--text-primary)' }}>No vendemos ni compartimos</strong> tus
                datos personales con terceros.
              </p>
            </LegalSection>
          </div>

          {/* ── Contacto ── */}
          {/* <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
              Contacto
            </p>
            <LegalSection icon={Mail} iconBg="bg-sky-500/10" iconColor="text-sky-500" title="Soporte y consultas">
              <p>
                Para consultas sobre estos términos, solicitudes de eliminación de datos
                o cualquier problema con el servicio:
              </p>
              <div
                className="mt-2 rounded-2xl px-4 py-3"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}
              >
                <p style={{ color: 'var(--text-muted)' }}>{DEVELOPER_EMAIL}</p>
              </div>
            </LegalSection>
          </div> */}

          {/* Footer */}
          <p className="text-center text-xs pb-4" style={{ color: 'var(--text-muted)' }}>
            {APP_NAME} · Versión {APP_VERSION} · Vigente desde {EFFECTIVE_DATE}
          </p>

        </div>
      </div>
    </div>
  );
}
