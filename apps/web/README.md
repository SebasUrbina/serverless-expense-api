# Seva Web

PWA de finanzas personales construida con Next.js 16, React 19, TanStack
Query, Supabase Auth y Tailwind CSS. Se exporta como sitio estático y consume
la API de Cloudflare Workers del monorepo.

## Desarrollo

```bash
npm run dev
npm run lint
npm run build
```

Variables requeridas (ver `.env.example`):

- `NEXT_PUBLIC_API_URL`: URL base de la API, incluyendo `/api`.
- `NEXT_PUBLIC_SUPABASE_URL`: URL pública del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave pública/anon de Supabase.

## Arquitectura

```text
src/
├── app/          # rutas y composición de páginas
├── components/   # componentes compartidos y shell de la aplicación
├── hooks/        # acceso a server state mediante TanStack Query
├── lib/          # clientes externos, providers y utilidades sin UI
├── store/        # estado exclusivamente visual (Zustand)
└── types/        # contratos de la API compartidos por las features
```

La migración hacia módulos por dominio es incremental. Una feature nueva que
crezca más allá de una página debe vivir en `src/features/<feature>/`:

```text
features/transactions/
├── api/          # funciones HTTP y query options
├── components/   # UI específica del dominio
├── hooks/        # orquestación de React/TanStack Query
└── model/        # tipos, esquemas y transformaciones puras
```

No mover componentes compartidos a una feature sólo para conseguir una
estructura simétrica. La estructura debe reflejar dependencias reales.

## Estado y caché

- TanStack Query es la única fuente de estado remoto.
- Zustand se reserva para estado de UI, como abrir/cerrar modales.
- Las query keys se declaran en `src/lib/query-keys.ts`; no se escriben strings
  ad hoc al invalidar caché.
- El caché offline dura hasta 24 horas y se invalida por versión y usuario.
- Datos sensibles como claves de API no se persisten en `localStorage`.
- El service worker usa network-first para documentos y
  stale-while-revalidate para assets same-origin. Nunca intercepta mutaciones.

## Criterios para componentes

- Una página compone secciones; la lógica HTTP vive en hooks o módulos `api`.
- Dependencias pesadas se cargan dinámicamente cuando la UI que las usa está
  cerrada durante la carga inicial.
- Extraer componentes por responsabilidad, no por cantidad arbitraria de
  líneas. Un bloque merece extracción cuando tiene estado, reglas de negocio,
  reutilización o una interfaz verificable propia.
- Mantener los límites `'use client'` lo más abajo posible. Esta aplicación es
  mayormente interactiva, pero layout, metadata y páginas legales siguen siendo
  Server Components.

## PWA

Pruebas manuales recomendadas después de cambiar `public/sw.js`:

1. Build de producción y servir `out/` sobre HTTPS o localhost.
2. DevTools → Application: validar manifest, worker y Cache Storage.
3. Simular Offline y abrir una ruta visitada y `/offline`.
4. Publicar una nueva versión y comprobar el aviso antes de `SKIP_WAITING`.
