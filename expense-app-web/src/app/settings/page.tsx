'use client';

import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import {
  LogOut, Wallet, Users, Code2,
  Tag, LayoutGrid, Sun, CheckCircle2, ChevronDown, Hash
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CategoryManager } from '@/components/CategoryManager';
import { TagManager } from '@/components/TagManager';
import { AccountManager } from '@/components/AccountManager';
import { GroupManager } from '@/components/GroupManager';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { ThemeToggle } from '@/components/ThemeToggle';

type SectionId = 'accounts' | 'categories' | 'tags' | 'groups' | 'integration';

export default function SettingsPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggleSection = (id: SectionId) => {
    setOpenSection(prev => (prev === id ? null : id));
  };

  const user = session?.user;
  const displayName = user?.user_metadata?.full_name || user?.email || 'Usuario';
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
      subtitle: 'Añade contexto a tus movimientos',
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-10">
        <div className="max-w-2xl mx-auto">

          {/* ── Profile Header ── */}
          <div className="pt-8 pb-6 flex flex-col items-center text-center">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover mb-3"
                style={{ boxShadow: '0 0 0 2px var(--border)' }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3"
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                {initials}
              </div>
            )}
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {displayName}
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{email}</p>
              <span className="flex items-center gap-0.5 text-emerald-500 text-xs font-semibold">
                <CheckCircle2 size={12} />
                Verificado
              </span>
            </div>
          </div>

          {/* ── Apariencia ── */}
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
              Apariencia
            </p>
            <div
              className="rounded-3xl p-4 flex items-center justify-between"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Sun size={17} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Modo de pantalla</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Claro, oscuro o automático</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* ── Finanzas (Accordion) ── */}
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
              Finanzas
            </p>
            <div className="space-y-3">
              {financeSections.map((section) => {
                const Icon = section.icon;
                const isOpen = openSection === section.id;
                return (
                  <div
                    key={section.id}
                    className="rounded-3xl overflow-hidden transition-all duration-200"
                    style={{
                      background: isOpen ? section.accentBg : 'var(--bg-card)',
                      border: `1px solid ${isOpen ? section.accentBorder : 'var(--border)'}`,
                      boxShadow: isOpen ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
                    }}
                  >
                    {/* Row trigger */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center gap-3.5 px-4 py-4 transition-all duration-200 text-left"
                      style={{
                        background: isOpen ? 'transparent' : 'transparent',
                      }}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 ${section.iconBg} ${isOpen ? 'scale-105' : ''}`}>
                        <Icon size={17} className={section.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {section.title}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {section.subtitle}
                        </p>
                      </div>
                      <ChevronDown
                        size={16}
                        style={{ color: 'var(--text-muted)' }}
                        className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Expanded content */}
                    {isOpen && (
                      <div
                        className="px-3 pb-3 pt-0 animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        <div
                          className="rounded-[1.35rem] px-4 pb-5 pt-4"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                        >
                          {section.content}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Integraciones ── */}
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
              Integraciones
            </p>
            <div
              className="rounded-3xl overflow-hidden transition-all duration-200"
              style={{
                background: openSection === 'integration' ? integrationSection.accentBg : 'var(--bg-card)',
                border: `1px solid ${openSection === 'integration' ? integrationSection.accentBorder : 'var(--border)'}`,
                boxShadow: openSection === 'integration' ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
              }}
            >
              <button
                onClick={() => toggleSection('integration')}
                className="w-full flex items-center gap-3.5 px-4 py-4 transition-all duration-200 text-left"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 ${integrationSection.iconBg} ${openSection === 'integration' ? 'scale-105' : ''}`}>
                  <IntegrationIcon size={17} className={integrationSection.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {integrationSection.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {integrationSection.subtitle}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  style={{ color: 'var(--text-muted)' }}
                  className={`shrink-0 transition-transform duration-200 ${openSection === 'integration' ? 'rotate-180' : ''}`}
                />
              </button>
              {openSection === 'integration' && (
                <div
                  className="px-3 pb-3 pt-0 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div
                    className="rounded-[1.35rem] px-4 pb-5 pt-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                  >
                    {integrationSection.content}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Cerrar sesión ── */}
          <div className="mb-6">
            {!showLogoutConfirm ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full rounded-3xl p-4 flex items-center gap-3.5 transition-colors"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <LogOut size={17} className="text-red-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-red-500">Cerrar sesión</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Salir de tu cuenta en este dispositivo
                  </p>
                </div>
              </button>
            ) : (
              <div
                className="rounded-3xl p-4"
                style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <p className="text-sm font-semibold text-red-500 mb-1">¿Seguro que quieres salir?</p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  Tendrás que iniciar sesión otra vez para acceder a tu cuenta.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    Sí, cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs pb-4" style={{ color: 'var(--text-muted)' }}>
            Seva Web · Tus finanzas, tu control.
          </p>

        </div>
      </div>
    </div>
  );
}
