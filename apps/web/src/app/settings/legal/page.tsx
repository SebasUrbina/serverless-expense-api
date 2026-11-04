import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const APP_NAME = 'Seva';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0';
const EFFECTIVE_DATE = '1 de enero de 2026';

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border border-t pt-5 first:border-t-0 first:pt-0">
      <h2 className="text-primary text-base font-semibold">{title}</h2>
      <div className="text-secondary mt-2 space-y-2 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function LegalPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-10 sm:px-6">
        <div className="mx-auto max-w-2xl pt-5 sm:pt-6">
          <Link
            href="/settings"
            className="text-secondary hover:text-primary focus-ring mb-4 -ml-1 inline-flex min-h-10 items-center gap-1 rounded-lg pr-2 text-sm font-medium transition-colors"
          >
            <ChevronLeft size={18} aria-hidden="true" />
            Ajustes
          </Link>
          <h1 className="text-primary text-xl font-bold tracking-tight sm:text-3xl">
            Información legal
          </h1>
          <p className="text-secondary mt-1 text-sm">
            Licencia, condiciones de uso y privacidad · Vigente desde el{' '}
            {EFFECTIVE_DATE}
          </p>

          <article className="bg-card border-border mt-6 space-y-5 rounded-3xl border p-5 shadow-sm sm:p-6">
            <LegalSection title="Licencia de uso">
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
            <LegalSection title="Uso aceptable">
              <p>
                {APP_NAME} está diseñada para el registro y seguimiento de
                gastos e ingresos personales. Al usarla, te comprometes a:
              </p>
              <ul className="list-inside list-disc space-y-1 pl-1">
                <li>
                  Usar la aplicación únicamente para fines personales y lícitos.
                </li>
                <li>
                  No intentar acceder a cuentas o datos de otros usuarios.
                </li>
                <li>
                  No automatizar el uso de la aplicación de formas no previstas
                  (bots, scrapers, etc.), excepto mediante las integraciones
                  oficiales (API / Shortcuts).
                </li>
                <li>
                  No introducir código malicioso ni intentar comprometer la
                  seguridad del servicio.
                </li>
              </ul>
            </LegalSection>
            <LegalSection title="Tu cuenta y tus datos">
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
            <LegalSection title="Tratamiento de datos personales">
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
          </article>

          <p className="text-muted mt-6 px-1 text-xs">
            {APP_NAME} · Versión {APP_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
}
