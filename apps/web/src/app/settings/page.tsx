'use client';

import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import {
  LogOut,
  Wallet,
  Users,
  Code2,
  LayoutGrid,
  Sun,
  CheckCircle2,
  Hash,
  Scale,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SettingsAccordionSection } from '@/components/settings/SettingsAccordionSection';

const AccountManager = dynamic(() =>
  import('@/features/preferences/components/AccountManager').then(
    (module) => module.AccountManager,
  ),
);
const CategoryManager = dynamic(() =>
  import('@/features/preferences/components/CategoryManager').then(
    (module) => module.CategoryManager,
  ),
);
const TagManager = dynamic(() =>
  import('@/features/preferences/components/TagManager').then(
    (module) => module.TagManager,
  ),
);
const GroupManager = dynamic(() =>
  import('@/features/preferences/components/GroupManager').then(
    (module) => module.GroupManager,
  ),
);
const ApiKeyManager = dynamic(() =>
  import('@/features/preferences/components/ApiKeyManager').then(
    (module) => module.ApiKeyManager,
  ),
);

type SectionId = 'accounts' | 'categories' | 'tags' | 'groups' | 'integration';

export default function SettingsPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const toggleSection = (id: SectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const user = session?.user;
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    user?.email ||
    'Usuario';
  const email = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Accordion section definitions
  const financeSections: {
    id: SectionId;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    accentBorder: string;
    accentBg: string;
    title: string;
    subtitle: string;
    content: React.ReactNode;
  }[] = [
    {
      id: 'accounts',
      icon: Wallet,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      accentBorder: 'rgba(59,130,246,0.28)',
      accentBg: 'rgba(59,130,246,0.08)',
      title: 'Mis cuentas',
      subtitle: 'Efectivo, tarjetas, billeteras…',
      content: <AccountManager />,
    },
    {
      id: 'categories',
      icon: LayoutGrid,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
      accentBorder: 'rgba(139,92,246,0.28)',
      accentBg: 'rgba(139,92,246,0.08)',
      title: 'Categorías',
      subtitle: 'Organiza tus gastos e ingresos',
      content: <CategoryManager />,
    },
    {
      id: 'tags',
      icon: Hash,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      accentBorder: 'rgba(245,158,11,0.3)',
      accentBg: 'rgba(245,158,11,0.08)',
      title: 'Etiquetas',
      subtitle: 'Agrega contexto a tus movimientos',
      content: <TagManager />,
    },
    {
      id: 'groups',
      icon: Users,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      accentBorder: 'rgba(16,185,129,0.28)',
      accentBg: 'rgba(16,185,129,0.08)',
      title: 'Grupos compartidos',
      subtitle: 'Divide gastos con otras personas',
      content: <GroupManager />,
    },
  ];

  const integrationSection = {
    id: 'integration' as SectionId,
    icon: Code2,
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-500',
    accentBorder: 'rgba(14,165,233,0.28)',
    accentBg: 'rgba(14,165,233,0.08)',
    title: 'API / iOS Shortcuts',
    subtitle: 'Conecta con apps externas',
    content: <ApiKeyManager />,
  };
  const IntegrationIcon = integrationSection.icon;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {/* ── Profile Header ── */}
          <div className="flex flex-col items-center pt-8 pb-6 text-center">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar"
                width={80}
                height={80}
                referrerPolicy="no-referrer"
                className="ring-border mb-3 h-20 w-20 rounded-full object-cover shadow-sm ring-2"
              />
            ) : (
              <div className="bg-card text-secondary border-border mb-3 flex h-20 w-20 items-center justify-center rounded-full border text-2xl font-bold shadow-sm">
                {initials}
              </div>
            )}
            <h1 className="text-primary text-xl font-bold">{displayName}</h1>
            <div className="mt-1 flex items-center gap-1.5">
              <p className="text-muted text-sm">{email}</p>
              <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-500">
                <CheckCircle2 size={12} />
                Verificado
              </span>
            </div>
          </div>

          {/* ── Apariencia ── */}
          <div className="mb-5">
            <p className="text-muted mb-2 px-1 text-[11px] font-bold tracking-widest uppercase">
              Apariencia
            </p>
            <div className="bg-card border-border flex items-center justify-between rounded-3xl border p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                  <Sun size={17} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-primary text-sm font-semibold">
                    Modo de pantalla
                  </p>
                  <p className="text-muted text-xs">
                    Claro, oscuro o automático
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* ── Finanzas (Accordion) ── */}
          <div className="mb-5">
            <p className="text-muted mb-2 px-1 text-[11px] font-bold tracking-widest uppercase">
              Finanzas
            </p>
            <div className="space-y-3">
              {financeSections.map((section) => (
                <SettingsAccordionSection
                  key={section.id}
                  title={section.title}
                  subtitle={section.subtitle}
                  icon={section.icon}
                  iconBg={section.iconBg}
                  iconColor={section.iconColor}
                  accentBorder={section.accentBorder}
                  accentBg={section.accentBg}
                  isOpen={openSection === section.id}
                  onToggle={() => toggleSection(section.id)}
                >
                  {section.content}
                </SettingsAccordionSection>
              ))}
            </div>
          </div>

          {/* ── Integraciones ── */}
          <div className="mb-5">
            <p className="text-muted mb-2 px-1 text-[11px] font-bold tracking-widest uppercase">
              Integraciones
            </p>
            <SettingsAccordionSection
              title={integrationSection.title}
              subtitle={integrationSection.subtitle}
              icon={IntegrationIcon}
              iconBg={integrationSection.iconBg}
              iconColor={integrationSection.iconColor}
              accentBorder={integrationSection.accentBorder}
              accentBg={integrationSection.accentBg}
              isOpen={openSection === 'integration'}
              onToggle={() => toggleSection('integration')}
            >
              {integrationSection.content}
            </SettingsAccordionSection>
          </div>

          {/* ── Legal ── */}
          <div className="mb-5">
            <p className="text-muted mb-2 px-1 text-[11px] font-bold tracking-widest uppercase">
              Legal
            </p>
            <Link
              href="/settings/legal"
              className="bg-card border-border hover:bg-card-hover flex w-full items-center gap-3.5 rounded-3xl border p-4 shadow-sm transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                <Scale size={17} className="text-indigo-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-primary text-sm font-semibold">
                  Información legal
                </p>
                <p className="text-muted text-xs">
                  Licencia, términos y privacidad
                </p>
              </div>
              <ChevronRight size={16} className="text-muted shrink-0" />
            </Link>
          </div>

          {/* ── Cerrar sesión ── */}
          <div className="mb-6">
            {!showLogoutConfirm ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="bg-card border-border hover:bg-card-hover flex w-full items-center gap-3.5 rounded-3xl border p-4 shadow-sm transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                  <LogOut size={17} className="text-red-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-red-500">
                    Cerrar sesión
                  </p>
                  <p className="text-muted text-xs">
                    Salir de tu cuenta en este dispositivo
                  </p>
                </div>
              </button>
            ) : (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="mb-1 text-sm font-semibold text-red-500">
                  ¿Seguro que quieres salir?
                </p>
                <p className="text-muted mb-4 text-xs">
                  Tendrás que iniciar sesión otra vez para acceder a tu cuenta.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="bg-inset text-secondary border-border hover:bg-card flex-1 rounded-xl border py-2 text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                  >
                    Sí, cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-muted pb-4 text-center text-xs">
            Seva Web · Tus finanzas, tu control · Versión{' '}
            {process.env.NEXT_PUBLIC_APP_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
}
