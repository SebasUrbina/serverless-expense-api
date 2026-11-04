'use client';

import { Suspense, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, Plus } from 'lucide-react';
import { useGroups } from '@/hooks/usePreferences';
import { useGroupBalances } from '@/hooks/useGroupBalances';
import { useAuth } from '@/lib/AuthProvider';
import { formatCurrency } from '@/lib/utils';
import { useTransactionModal } from '@/store/useTransactionModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { Card, CardHeader } from '@/components/ui/Card';
import { MonthSelector } from '@/components/MonthSelector';
import { GroupAddForm } from '@/components/GroupManager';
import { MemberStack } from '@/components/MemberAvatar';
import { SegmentedControl } from '@/components/settings/ui';
import { SettlementModal } from '@/components/SettlementModal';
import {
  GroupBalancesPanel,
  GroupLedger,
  GroupMembersPanel,
} from '@/components/GroupPanels';
import type { GroupBalance, SettlementPair, SharedGroup } from '@/types/api';

const money = (n: number) => `$${formatCurrency(Math.round(Math.abs(n)))}`;

const desktopQuery = '(min-width: 1024px)';

/** Matches Tailwind's `lg`, where the list and the detail are shown side by side. */
function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(desktopQuery);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(desktopQuery).matches,
    () => false,
  );
}

export default function GroupsPage() {
  return (
    <Suspense fallback={<LoadingState minHeight="h-dvh" />}>
      <GroupsContent />
    </Suspense>
  );
}

function GroupsContent() {
  const params = useSearchParams();
  const idParam = params.get('id') ? Number(params.get('id')) : null;
  const joinCode = params.get('join') ?? '';
  const [month, setMonth] = useState(
    params.get('month') || format(new Date(), 'yyyy-MM'),
  );
  const [adding, setAdding] = useState(!!joinCode);
  const isDesktop = useIsDesktop();

  const { session } = useAuth();
  const userId = session?.user?.id;
  const { openForGroup } = useTransactionModal();
  const { data: groupsData, isLoading } = useGroups();
  const { data: balancesData } = useGroupBalances(month);

  const groups = groupsData?.groups ?? [];
  const balances = new Map(
    (balancesData?.balances ?? []).map((b) => [b.group_id, b]),
  );
  const myNet = (groupId: number) =>
    balances.get(groupId)?.members.find((m) => m.user_id === userId)?.net ?? 0;
  const selected = groups.find((g) => g.id === idParam) ?? groups[0];

  const total = Math.round(groups.reduce((sum, g) => sum + myNet(g.id), 0));
  const subtitle =
    !balancesData || groups.length === 0
      ? 'Lo que compartes y lo que falta saldar.'
      : total > 0
        ? `En total te deben ${money(total)}.`
        : total < 0
          ? `En total debes ${money(total)}.`
          : 'Estás al día en todos tus grupos.';

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Grupos"
        subtitle={subtitle}
        monthSelector={
          <MonthSelector
            value={month}
            onChange={setMonth}
            allowAll={false}
            className="min-w-0"
          />
        }
        primaryAction={
          selected
            ? {
                label: 'Gasto compartido',
                icon: <Plus size={16} />,
                onClick: () => openForGroup(selected.id),
              }
            : undefined
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            <LoadingState minHeight="h-64" />
          ) : groups.length === 0 ? (
            <Card label="Crear o unirme a un grupo" className="max-w-2xl">
              <CardHeader
                title="Divide gastos con otras personas"
                description="Crea un grupo para tu pareja, tu depto o un viaje, o únete con el código que te compartieron."
              />
              <div className="mt-5">
                <GroupAddForm initialJoinCode={joinCode} />
              </div>
            </Card>
          ) : (
            <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-6">
              <aside
                aria-label="Tus grupos"
                className={`space-y-3 ${idParam ? 'hidden lg:block' : ''}`}
              >
                <ul className="bg-card border-border rounded-3xl border p-2 shadow-sm">
                  {groups.map((group) => (
                    <li key={group.id}>
                      <GroupListRow
                        group={group}
                        month={month}
                        net={myNet(group.id)}
                        count={balances.get(group.id)?.transaction_count}
                        active={group.id === selected?.id}
                      />
                    </li>
                  ))}
                </ul>
                {adding ? (
                  <Card label="Agregar grupo">
                    <GroupAddForm
                      initialJoinCode={joinCode}
                      onAdded={() => setAdding(false)}
                    />
                  </Card>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="border-border text-secondary hover:text-primary hover:bg-card focus-ring min-h-11 w-full rounded-2xl border border-dashed text-sm font-semibold transition-colors"
                  >
                    Crear o unirme a un grupo
                  </button>
                )}
              </aside>

              <div className={idParam ? '' : 'hidden lg:block'}>
                {selected && (idParam || isDesktop) && (
                  <GroupDetail
                    key={selected.id}
                    group={selected}
                    balance={balances.get(selected.id)}
                    month={month}
                    userId={userId}
                    onAddExpense={() => openForGroup(selected.id)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupListRow({
  group,
  month,
  net,
  count,
  active,
}: {
  group: SharedGroup;
  month: string;
  net: number;
  count?: number;
  active: boolean;
}) {
  const rounded = Math.round(net);
  return (
    <Link
      href={`/groups?id=${group.id}&month=${month}`}
      aria-current={active ? 'true' : undefined}
      className={`hover:bg-inset focus-ring grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${active ? 'lg:bg-inset' : ''}`}
    >
      <MemberStack members={group.members} />
      <span className="min-w-0">
        <span className="text-primary block truncate text-sm font-semibold">
          {group.name}
        </span>
        <span className="text-muted mt-0.5 block truncate text-xs">
          {group.members.length}{' '}
          {group.members.length === 1 ? 'miembro' : 'miembros'}
          {count !== undefined &&
            ` · ${count} ${count === 1 ? 'movimiento' : 'movimientos'}`}
        </span>
      </span>
      <span className="text-right tabular-nums">
        <span
          className={`block text-sm font-bold ${
            rounded > 0
              ? 'text-income'
              : rounded < 0
                ? 'text-expense'
                : 'text-muted'
          }`}
        >
          {rounded === 0 ? '—' : money(rounded)}
        </span>
        <span className="text-muted block text-[11px]">
          {rounded > 0 ? 'te deben' : rounded < 0 ? 'debes' : 'al día'}
        </span>
      </span>
    </Link>
  );
}

type Tab = 'ledger' | 'balances' | 'members';

function GroupDetail({
  group,
  balance,
  month,
  userId,
  onAddExpense,
}: {
  group: SharedGroup;
  balance?: GroupBalance;
  month: string;
  userId?: string;
  onAddExpense: () => void;
}) {
  const [tab, setTab] = useState<Tab>('ledger');
  const [settling, setSettling] = useState(false);

  const monthName = format(parseISO(`${month}-01`), 'MMMM', { locale: es });
  const myPairs = (balance?.pairs ?? []).filter(
    (p) => p.from_user_id === userId || p.to_user_id === userId,
  );

  return (
    <div>
      <Link
        href={`/groups?month=${month}`}
        className="text-secondary hover:text-primary focus-ring mb-3 -ml-1 inline-flex min-h-10 items-center gap-1 rounded-lg pr-2 text-sm font-medium transition-colors lg:hidden"
      >
        <ChevronLeft size={18} aria-hidden="true" />
        Grupos
      </Link>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-primary min-w-0 flex-1 truncate text-lg font-bold tracking-tight sm:text-xl">
          {group.name}
        </h2>
        <MemberStack members={group.members} max={4} size="md" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_auto_1fr] lg:items-start lg:gap-6">
        <div className="space-y-3 lg:col-start-2 lg:row-start-1">
          <BalanceHero
            balance={balance}
            myPairs={myPairs}
            userId={userId}
            onSettle={() => setSettling(true)}
          />
          <button
            type="button"
            onClick={onAddExpense}
            className="bg-primary text-card focus-ring flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-90 lg:hidden"
          >
            <Plus size={16} aria-hidden="true" />
            Agregar gasto a {group.name}
          </button>
        </div>

        <SegmentedControl
          label="Secciones del grupo"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'ledger', label: 'Movimientos' },
            { value: 'balances', label: 'Saldos' },
            { value: 'members', label: 'Miembros' },
          ]}
          className="lg:hidden"
        />

        <Card
          label="Movimientos del grupo"
          className={`${tab === 'ledger' ? '' : 'hidden'} lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:block`}
        >
          <div className="mb-3 hidden lg:block">
            <CardHeader
              title={`Movimientos de ${monthName}`}
              description="Lo que pagó cada uno, los pagos entre ustedes y lo que significa para ti."
            />
          </div>
          <GroupLedger group={group} month={month} userId={userId} />
        </Card>

        <Card
          label="Saldos"
          className={`${tab === 'balances' ? '' : 'hidden'} lg:col-start-2 lg:block`}
        >
          <div className="mb-4">
            <CardHeader
              title="Saldos"
              description="Acumulado de todos los meses"
            />
          </div>
          <GroupBalancesPanel
            balance={balance}
            userId={userId}
            monthName={monthName}
          />
        </Card>

        <Card
          label="Miembros"
          className={`${tab === 'members' ? '' : 'hidden'} lg:col-start-2 lg:block`}
        >
          <div className="mb-3">
            <CardHeader title="Miembros" />
          </div>
          <GroupMembersPanel group={group} userId={userId} />
        </Card>
      </div>

      {settling && myPairs.length > 0 && (
        <SettlementModal
          isOpen={settling}
          onClose={() => setSettling(false)}
          groupId={group.id}
          groupName={group.name}
          pairs={myPairs}
          userId={userId}
        />
      )}
    </div>
  );
}

function BalanceHero({
  balance,
  myPairs,
  userId,
  onSettle,
}: {
  balance?: GroupBalance;
  myPairs: SettlementPair[];
  userId?: string;
  onSettle: () => void;
}) {
  const net = Math.round(
    balance?.members.find((m) => m.user_id === userId)?.net ?? 0,
  );
  const othersOwe = (balance?.pairs.length ?? 0) > 0;

  const detail =
    myPairs.length > 0
      ? myPairs
          .map((p) =>
            p.to_user_id === userId
              ? `${p.from_nickname} te debe ${money(p.amount)}`
              : `Le debes ${money(p.amount)} a ${p.to_nickname}`,
          )
          .join(' · ')
      : othersOwe
        ? 'Tú no tienes deudas en este grupo.'
        : 'Nadie le debe a nadie.';

  return (
    <Card label="Tu saldo en el grupo" tone="hero">
      <p className="text-secondary text-[13px]">
        {net > 0 ? 'Te deben' : net < 0 ? 'Debes' : 'Estás al día'}
      </p>
      {net !== 0 && (
        <p className="text-primary mt-1 text-4xl leading-none font-extrabold tracking-[-0.035em] tabular-nums">
          {money(net)}
        </p>
      )}
      <p className="text-secondary mt-2 text-[13px]">{detail}</p>
      {myPairs.length > 0 && (
        <button
          type="button"
          onClick={onSettle}
          className="bg-primary/15 hover:bg-primary/20 text-primary focus-ring mt-4 min-h-11 w-full rounded-xl px-4 text-sm font-semibold transition-colors"
        >
          Registrar pago
        </button>
      )}
    </Card>
  );
}
