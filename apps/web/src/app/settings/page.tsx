'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Hash,
  LayoutGrid,
  LogOut,
  Scale,
  Settings2,
  Smartphone,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useAccounts, useCategories, useTags } from '@/hooks/usePreferences';
import { AccountManager } from '@/components/AccountManager';
import { CategoryManager } from '@/components/CategoryManager';
import { TagManager } from '@/components/TagManager';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoadingState } from '@/components/ui/LoadingSpinner';

type Section = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  Content: () => React.ReactNode;
};

const SECTIONS: Section[] = [
  {
    id: 'cuentas',
    title: 'Cuentas',
    description:
      'Efectivo, tarjetas y cuentas bancarias donde registras tus movimientos.',
    icon: Wallet,
    Content: AccountManager,
  },
  {
    id: 'categorias',
    title: 'Categorías',
    description: 'Cómo clasificas tus gastos e ingresos.',
    icon: LayoutGrid,
    Content: CategoryManager,
  },
  {
    id: 'etiquetas',
    title: 'Etiquetas',
    description:
      'Agrupa movimientos de distintas categorías, como un viaje o un proyecto.',
    icon: Hash,
    Content: TagManager,
  },
  {
    id: 'atajos',
    title: 'Atajos de iOS',
    description: 'Registra tus pagos con Apple Pay sin abrir la app.',
    icon: Smartphone,
    Content: ApiKeyManager,
  },
];

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** One-line status shown next to each section in the index. */
function useSectionSummaries(): Record<string, string | undefined> {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  return {
    cuentas: accounts && plural(accounts.accounts.length, 'cuenta', 'cuentas'),
    categorias:
      categories &&
      plural(categories.categories.length, 'categoría', 'categorías'),
    etiquetas: tags && plural(tags.tags.length, 'etiqueta', 'etiquetas'),
    atajos: 'Apple Pay',
  };
}

const sectionHref = (id: string) => `/settings?section=${id}`;

export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingState minHeight="h-dvh" />}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const sectionId = useSearchParams().get('section');
  const section = SECTIONS.find((s) => s.id === sectionId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Groups moved to their own page; keep old links working.
  useEffect(() => {
    if (sectionId === 'grupos') router.replace('/groups');
  }, [sectionId, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    document.querySelector('main')?.scrollTo({ top: 0 });
  }, [sectionId]);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-10 sm:px-6"
      >
        <div className="mx-auto max-w-5xl pt-5 sm:pt-6 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start lg:gap-10">
          <aside className={section ? 'hidden lg:block' : ''}>
            <h1 className="text-primary text-xl font-bold tracking-tight sm:text-3xl">
              Ajustes
            </h1>
            <MobileIndex />
            <DesktopNav activeId={section?.id ?? 'general'} />
          </aside>

          <div className={section ? '' : 'hidden lg:block'}>
            {section ? <SectionPanel section={section} /> : <GeneralPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Profile() {
  const { session } = useAuth();
  const user = session?.user;
  const displayName: string =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    user?.email ||
    'Usuario';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="flex min-w-0 items-center gap-3.5">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-14 w-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="bg-inset text-secondary flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold">
          {initials}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-primary truncate text-base font-semibold">
          {displayName}
        </p>
        <p className="text-secondary truncate text-[13px]">
          {user?.email}
          {user?.email_confirmed_at && (
            <span className="text-muted"> · verificado</span>
          )}
        </p>
      </div>
    </div>
  );
}

const rowClass =
  'hover:bg-inset focus-ring flex min-h-14 w-full items-center gap-3.5 px-4 py-3 text-left transition-colors';

function Row({
  href,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  detail?: string;
}) {
  return (
    <li>
      <Link href={href} className={rowClass}>
        <Icon
          size={18}
          className="text-secondary shrink-0"
          aria-hidden="true"
        />
        <span className="text-primary min-w-0 flex-1 truncate text-[15px] font-medium">
          {title}
        </span>
        {detail && (
          <span className="text-muted shrink-0 text-[13px] tabular-nums">
            {detail}
          </span>
        )}
        <ChevronRight
          size={16}
          className="text-muted shrink-0"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="mt-6">
      <h2 className="text-secondary mb-2 px-1 text-[13px] font-medium">
        {title}
      </h2>
      <ul className="bg-card border-border divide-border divide-y overflow-hidden rounded-2xl border shadow-sm">
        {children}
      </ul>
    </section>
  );
}

function ThemeRow() {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <span>
        <span className="text-primary block text-[15px] font-medium">Tema</span>
        <span className="text-muted block text-[13px]">
          Auto sigue la configuración de tu dispositivo.
        </span>
      </span>
      <ThemeToggle />
    </li>
  );
}

function LogoutRow() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!confirming)
    return (
      <li>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={rowClass}
        >
          <LogOut
            size={18}
            className="text-expense shrink-0"
            aria-hidden="true"
          />
          <span className="text-expense text-[15px] font-medium">
            Cerrar sesión
          </span>
        </button>
      </li>
    );

  return (
    <li role="alert" className="px-4 py-4">
      <p className="text-primary text-[15px] font-semibold">
        ¿Cerrar sesión en este dispositivo?
      </p>
      <p className="text-secondary mt-1 text-[13px]">
        Tus datos quedan guardados; solo tendrás que volver a ingresar.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="bg-inset text-primary hover:bg-card-hover focus-ring min-h-11 flex-1 rounded-xl text-sm font-semibold transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={logout}
          className="focus-ring min-h-11 flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </div>
    </li>
  );
}

function AppVersion() {
  return (
    <p className="text-muted mt-6 px-1 text-xs">
      Seva {process.env.NEXT_PUBLIC_APP_VERSION}
    </p>
  );
}

function MobileIndex() {
  const summaries = useSectionSummaries();
  return (
    <div className="lg:hidden">
      <div className="bg-card border-border mt-5 rounded-2xl border p-4 shadow-sm">
        <Profile />
      </div>
      <Group title="Finanzas">
        {SECTIONS.slice(0, 3).map((s) => (
          <Row
            key={s.id}
            href={sectionHref(s.id)}
            icon={s.icon}
            title={s.title}
            detail={summaries[s.id]}
          />
        ))}
      </Group>
      <Group title="Integraciones">
        {SECTIONS.slice(3).map((s) => (
          <Row
            key={s.id}
            href={sectionHref(s.id)}
            icon={s.icon}
            title={s.title}
            detail={summaries[s.id]}
          />
        ))}
      </Group>
      <Group title="Preferencias">
        <ThemeRow />
      </Group>
      <Group title="Tu cuenta">
        <Row href="/settings/legal" icon={Scale} title="Información legal" />
        <LogoutRow />
      </Group>
      <AppVersion />
    </div>
  );
}

function DesktopNav({ activeId }: { activeId: string }) {
  const items = [
    { id: 'general', title: 'General', icon: Settings2, href: '/settings' },
    ...SECTIONS.map((s) => ({ ...s, href: sectionHref(s.id) })),
  ];
  return (
    <nav aria-label="Secciones de ajustes" className="mt-6 hidden lg:block">
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-card text-primary border-border border shadow-sm'
                    : 'text-secondary hover:text-primary hover:bg-card border border-transparent'
                }`}
              >
                <item.icon
                  size={16}
                  aria-hidden="true"
                  className={active ? 'text-accent' : ''}
                />
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function PanelHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-primary text-xl font-bold tracking-tight lg:text-2xl">
        {title}
      </h2>
      <p className="text-secondary mt-1 text-sm">{description}</p>
    </div>
  );
}

function SectionPanel({ section }: { section: Section }) {
  const { Content } = section;
  return (
    <div>
      <Link
        href="/settings"
        className="text-secondary hover:text-primary focus-ring mb-4 -ml-1 inline-flex min-h-10 items-center gap-1 rounded-lg pr-2 text-sm font-medium transition-colors lg:hidden"
      >
        <ChevronLeft size={18} aria-hidden="true" />
        Ajustes
      </Link>
      <section
        aria-label={section.title}
        className="bg-card border-border rounded-3xl border p-5 shadow-sm sm:p-6 lg:mt-1"
      >
        <PanelHeader title={section.title} description={section.description} />
        <Content />
      </section>
    </div>
  );
}

function GeneralPanel() {
  return (
    <div className="lg:mt-1">
      <section
        aria-label="Perfil"
        className="bg-card border-border rounded-3xl border p-5 shadow-sm sm:p-6"
      >
        <Profile />
      </section>
      <Group title="Preferencias">
        <ThemeRow />
      </Group>
      <Group title="Tu cuenta">
        <Row href="/settings/legal" icon={Scale} title="Información legal" />
        <LogoutRow />
      </Group>
      <AppVersion />
    </div>
  );
}
