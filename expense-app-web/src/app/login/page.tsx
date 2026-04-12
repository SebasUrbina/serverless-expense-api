'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Key, Loader2, LogIn, UserPlus, User, Smartphone, Zap, BarChart3, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const benefits = [
  {
    icon: Smartphone,
    title: 'Donde estés',
    description: 'Accedé desde tu celular o computadora. Tu info siempre sincronizada.',
  },
  {
    icon: Zap,
    title: 'Atajos de iOS',
    description: 'Registrá gastos al instante con los Atajos de iOS. Pagás y se guarda solo.',
  },
  {
    icon: BarChart3,
    title: 'Todo claro',
    description: 'Visualizá tus gastos, ingresos y tendencias en un dashboard intuitivo.',
  },
];

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess('¡Cuenta creada! Revisá tu email para confirmar y luego iniciá sesión.');
      setLoading(false);
      setMode('login');
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError(null);
  };

  return (
    <div className="relative flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden overflow-y-auto" style={{ background: 'var(--bg-base)' }}>

      {/* ── Theme Toggle (floating) ── */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle compact />
      </div>

      {/* ══════════════════════════════════════════════════
          LEFT — Hero + Benefits
         ══════════════════════════════════════════════════ */}
      <div className="relative flex flex-col justify-center lg:w-[55%] px-6 sm:px-10 lg:px-16 pt-16 pb-8 sm:py-12 lg:py-0 overflow-hidden">

        {/* Background gradient orbs */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto lg:mx-0">
          {/* Logo */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter mb-4 login-fade-up" style={{ color: 'var(--text-primary)' }}>
            Se<span className="text-emerald-500">va</span>
          </h1>

          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 login-fade-up" style={{ color: 'var(--text-primary)', animationDelay: '80ms' }}>
            ¿En qué se va tu plata?
          </h2>

          {/* Subtitle */}
          <p className="text-base sm:text-lg leading-relaxed mb-10 lg:mb-14 login-fade-up" style={{ color: 'var(--text-secondary)', animationDelay: '160ms' }}>
            Tu herramienta de finanzas personales.<br className="hidden sm:block" />
            Simple, multiplataforma y automático.
          </p>

          {/* Benefits */}
          <div className="flex flex-col gap-4 sm:gap-5">
            {benefits.map((b, i) => (
              <div
                key={b.title}
                className="flex items-start gap-4 login-fade-up"
                style={{ animationDelay: `${240 + i * 100}ms` }}
              >
                <div
                  className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--emerald-soft)' }}
                >
                  <b.icon size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>{b.title}</p>
                  <p className="text-sm leading-relaxed mt-0.5" style={{ color: 'var(--text-muted)' }}>{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          RIGHT — Auth Form
         ══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-center lg:w-[45%] px-5 sm:px-8 pt-2 pb-8 sm:py-8 lg:py-0">
        <div className="w-full max-w-[420px] login-fade-up" style={{ animationDelay: '200ms' }}>

          {/* Card */}
          <div
            className="rounded-3xl p-6 sm:p-8"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-elevated)' }}
          >
            {/* Card header */}
            <div className="mb-6">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {mode === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {mode === 'login' ? 'Accedé a tu panel financiero' : 'Empezá a controlar tus finanzas hoy'}
              </p>
            </div>

            {/* Mode Toggle */}
            <div
              className="flex rounded-xl p-1 mb-5"
              style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}
            >
              <button
                onClick={() => { setMode('login'); resetForm(); }}
                className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                style={
                  mode === 'login'
                    ? { background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }
                    : { color: 'var(--text-muted)' }
                }
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setMode('signup'); resetForm(); }}
                className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                style={
                  mode === 'signup'
                    ? { background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }
                    : { color: 'var(--text-muted)' }
                }
              >
                Crear Cuenta
              </button>
            </div>

            {/* Alerts */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl mb-5 text-sm font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl mb-5 text-sm font-medium">
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 pl-0.5" style={{ color: 'var(--text-muted)' }} htmlFor="displayName">
                    Tu nombre
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      <User size={17} />
                    </span>
                    <input
                      id="displayName"
                      type="text"
                      required
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                      style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="ej. Sebastián"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 pl-0.5" style={{ color: 'var(--text-muted)' }} htmlFor="email">
                  Correo electrónico
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    <Mail size={17} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                    style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 pl-0.5" style={{ color: 'var(--text-muted)' }} htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    <Key size={17} />
                  </span>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                    style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full relative group overflow-hidden bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 mt-1"
              >
                {loading ? <Loader2 size={19} className="animate-spin" /> : (
                  <>
                    {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    {mode === 'login' ? <ArrowRight size={17} className="opacity-80" /> : <UserPlus size={17} className="opacity-80" />}
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="px-3 uppercase tracking-widest font-semibold" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                  O continuar con
                </span>
              </div>
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full font-semibold py-3 px-4 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              {googleLoading ? <Loader2 size={19} className="animate-spin" /> : (
                <>
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Google
                </>
              )}
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
            Al continuar, aceptás nuestros términos de uso y política de privacidad.
          </p>
        </div>
      </div>
    </div>
  );
}
