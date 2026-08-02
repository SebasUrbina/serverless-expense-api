# 🎨 Propuesta de Rediseño — Seva (expense-app-web)

> Estado: **propuesta**. No se ha modificado código de producción todavía.
> Dirección elegida: **Fintech limpio** · Vistas prioritarias: **Ritmo vs presupuesto** y **Tendencia por categoría 12m**.
> Decisiones cerradas: ✅ acento **índigo** · ✅ presupuesto **sincronizado en backend** (tabla `budgets` + endpoints CRUD).

## 1. Contexto y problema

La app ya tiene:
- Modo oscuro completo con variables semánticas (`globals.css`) y selector Claro/Oscuro/Sistema.
- Vistas: Inicio, Movimientos, Recurrentes, Análisis, Ajustes.
- Endpoints de resumen: `monthly`, `category`, `kpis`.

**Problema:** el diseño actual es un "glassmorphism neon" cargado (glows verdes, `drop-shadow`, gradientes, `rounded-[2.5rem]`) que **roba jerarquía visual** y no resulta minimalista. Los números clave se diluyen en la decoración.

## 2. Principios de diseño

1. **Jerarquía por contraste, no por decoración.** Un solo número hero al mes; el resto acompaña.
2. **Superficies planas y limpias.** Menos glass/blur/glow; más bordes sutiles y espacio en blanco.
3. **Paleta contenida.** Un acento + verde (ingreso) + rojo (gasto). Nada más.
4. **Tipografía como heroína.** Números con `tabular-nums`, titulares `font-black`, contraste fuerte.
5. **Dark mode premium.** Negro puro, superficies en escala de grises, alto contraste, sin halos.

## 3. Tokens de diseño (Light & Dark)

El sistema de `@theme` / variables CSS **se mantiene**; solo se reajustan los valores.

### Paleta común
| Token | Light | Dark | Uso |
|---|---|---|---|
| `--bg-base` | `#f7f8fa` | `#000000` | Fondo |
| `--bg-card` | `#ffffff` | `#0d0d0f` | Superficie principal |
| `--bg-inset` | `#f1f2f4` | `#17171a` | Superficie interna/inset |
| `--border` | `#e6e8eb` | `#232326` | Bordes (1px, sutil) |
| `--text-primary` | `#0b0f14` | `#f5f5f7` | Texto principal |
| `--text-secondary` | `#4a5560` | `#a1a1aa` | Texto secundario |
| `--text-muted` | `#8a929c` | `#52525b` | Texto tenue |
| `--accent` | `#6366f1` (índigo) | `#818cf8` | Acento único |
| `--income` | `#059669` | `#34d399` | Ingresos |
| `--expense` | `#dc2626` | `#f87171` | Gastos |

> Nota: el acento actual es emerald `#10b981` usado para todo (botón, highlights, iconos), lo que choca con el verde de "ingreso". El cambio a índigo separa claramente **acción/acento** de **semántica ingreso-gasto**. Si se prefiere seguir con verde, usar un verde más sobrio y contar con que compite con "ingreso".

### Reglas de superficie
- Radios: `rounded-2xl` (cards) / `rounded-3xl` (contenedores grandes). **Sin** `rounded-[2.5rem]`.
- Bordes: `1px solid var(--border)` en todas las cards. Sin `blur-3xl`, sin glows, sin `drop-shadow` decorativos.
- Sombras: `shadow-sm` o `shadow-card` **mínimamente** para elevar elementos clickables, nunca glows de color.
- Tipografía numérica: `font-black tracking-tight tabular-nums`.

## 4. Página Inicio rediseñada (estructura)

Jerarquía vertical clara:

1. **Header** — saludo + MonthSelector + botón "Agregar". (sin cambios de arquitectura)
2. **Hero de gasto** — número del mes en grande (flujo actual), sin glows. Comparativa "vs mes pasado" como chip plano.
3. **Fila de mini-métricas** — Balance / Ingresos / Movimientos (cards planas).
4. **Ritmo del mes (NUEVO)** — barra de progreso + proyección. *Ver §5.*
5. **Donut de categorías** — sustituir la lista de barras por un donut interactivo con lista al lado.
6. **Últimos movimientos** + **KPIs** en columna derecha.

## 5. Nueva vista prioritarias

### A. ⏳ Ritmo mensual vs presupuesto — *requiere backend (budgets)*
Una card con:
- **Presupuesto mensual** (valor del mes, editable inline).
- Barra de progreso: `gastado / presupuesto` con color (verde < 70%, ámbar 70–90%, rojo > 90%).
- **Proyección**: `gastado + (gasto_diario_promedio × días_restantes)` → "Al ritmo actual cerrarás el mes en $X (Y%)".
- Cálculo de progreso en cliente con datos existentes (`monthly`, `kpis`, días del mes). El valor del presupuesto se **lee/guarda en backend** (tabla `budgets`), así se sincroniza entre dispositivos.

**Backend necesario:**
- Tabla `budgets` (ver §5.1 Esquema).
- Endpoints: `budgetList` (por mes, con o sin categoría), `budgetUpsert`, opcional `budgetDelete`. Se registran en `src/index.ts` y siguen el patrón de los demás endpoints (auth Bearer/ApiKey, chanfana).

**Mockup (concepto):**
```
┌──────────────────────────────────────────────┐
│ Ritmo del mes                    Marzo 2026   │
│                                             │
│  Gastado  $812.000              de $1.200.000 │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░   68%         │
│                                             │
│  Al ritmo actual cerrarás en ~$1.310.000 (109%)│
│  Presupuesto diario: $40.000 · Te sobran $38.8k│
└──────────────────────────────────────────────┘
```

### B. 📈 Tendencia por categoría (12 meses) — *requiere endpoint nuevo*
Un gráfico que responde a "¿esta categoría está subiendo?":

- **Datos:** endpoint nuevo `GET /transactions/summary/category-trend?months=12`.
- **Respuesta propuesta:**
  ```json
  {
    "success": true,
    "months": ["2025-09", ...],
    "categories": [
      { "category_id": 1, "category": "Comida", "icon": "🍔",
        "values": [120, 90, 200, ...] }
    ]
  }
  ```
- **Visual:** stacked area/bar por categoría (meses en eje X) + tabla resumen con la categoría, total y delta 12m.
- Clic en una categoría → `/transactions?category_id=X`.

**Endpoint sugerido (SQL de referencia):** agrupar por `category_id` y por `strftime('%Y-%m', date)`, en los últimos N meses, sólo `type='expense'`.

## 5.1 Esquema de datos — presupuesto en backend

Nueva tabla en `schema.sql` (junto a `categories`, `accounts`, etc.):

```sql
CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    month TEXT NOT NULL,                              -- 'YYYY-MM'
    scope TEXT NOT NULL CHECK(scope IN ('general','category')),
    category_id INTEGER,                              -- NOT NULL cuando scope='category'
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
-- Un presupuesto 'general' por usuario+mes (category_id es NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_general
    ON budgets(user_id, month) WHERE scope = 'general';
-- Un presupuesto por categoría en cada mes
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_category
    ON budgets(user_id, month, category_id) WHERE scope = 'category';
```

> **Decisión cerrada:** ✅ se usa columna **`scope`** (`'general' | 'category'`). El presupuesto general del mes lleva `scope='general'`, `category_id=NULL`; los presupuestos por categoría llevan `scope='category'`, `category_id` obligatorio.
> **Nota de implementación (verificada en SQLite):** como en SQLite `NULL != NULL`, una `UNIQUE(..., category_id)` **no impide** duplicar el `general`. Se resuelve con **índices únicos parciales** (`idx_budgets_general` y `idx_budgets_category`) y el upsert usa `ON CONFLICT` con target acotado por `scope`. Verificado: 1 presupuesto general + 1 por categoría, sin duplicados.

> **Aplicación del esquema:** `schema.sql` es la fuente de verdad (no hay folder de migraciones en el repo). Al cambiar el esquema hay que **re-aplicarlo al D1** local y remoto (p.ej. `wrangler d1 execute expense_tracker --local --file=schema.sql` y lo equivalente en remoto). Registrar los nuevos endpoints en `src/index.ts` bajo la sección Budgets.

**Endpoints (patrón chanfana, auth Bearer/ApiKey):**
- `GET /budgets?month=YYYY-MM` → `{ budgets: [{ id, month, scope, category_id|null, category_name?, category_icon?, amount }] }`
- `PUT /budgets` (upsert) → body `{ month, scope, category_id|null, amount }`
- `DELETE /budgets?id=...` (opcional)

## 6. Análisis potenciado (fase futura)

- **Balance de flujo:** % del ingreso que se va en cada categoría (usa `monthly` + `category` existentes).
- Sustituir el donut de barras del dashboard (A.5) si se prefiere en Análisis.

## 7. Plan de implementación por fases

| Fase | Alcance | Depende de |
|---|---|---|
| **0 — Base visual** | Tokens en `globals.css` (light/dark), radios, sombras, tipografía numérica, limpiar glows/glass existentes | — |
| **1 — Dashboard limpio** | Reorganizar Inicio + donut de categorías | Fase 0 |
| **2 — Ritmo del mes** | Card presupuesto + proyección (vista A) + tabla `budgets` y endpoints (scheme+deps: `schema.sql`, `src/index.ts`) | Fase 0 + backend |
| **3 — Tendencia 12m** | Endpoint `category-trend` en backend + gráfico (vista B) | Fase 0, backend |
| **4 — QA** | Contraste dark/light, responsive, PWA | anteriores |

## 8. Decisiones cerradas
- ✅ **Acento índigo** (`#6366f1` light / `#818cf8` dark). Separado del verde semántico de "ingreso".
- ✅ **Presupuesto sincronizado en backend**: tabla `budgets` + endpoints CRUD (§5.1), así sincroniza entre dispositivos. Requiere aplicar `schema.sql` y registrar endpoints.
- 🔲 **Fuera de prioridad:** calendario de gastos (heatmap). Viable con datos actuales si se quiere incorporar después.
