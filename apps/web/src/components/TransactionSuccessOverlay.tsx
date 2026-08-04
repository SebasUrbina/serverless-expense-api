'use client';

type Props = {
  amount: string;
  type: 'expense' | 'income';
};

export function TransactionSuccessOverlay({ amount, type }: Props) {
  const isExpense = type === 'expense';
  const ringColor = isExpense ? '#ef4444' : '#10b981';
  const textColor = isExpense ? 'text-red-500' : 'text-emerald-500';

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/60 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div className="bg-card border-border flex w-full max-w-lg flex-col items-center justify-center gap-0 rounded-t-4xl border-t py-20 shadow-2xl sm:rounded-3xl sm:border sm:py-24">
        {/* Animated ring + checkmark */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Glow rings */}
          <div
            className="animate-tx-glow-1 absolute rounded-full"
            style={{
              width: 140,
              height: 140,
              background: `radial-gradient(circle, ${ringColor}22 0%, transparent 70%)`,
            }}
          />
          <div
            className="animate-tx-glow-2 absolute rounded-full"
            style={{
              width: 140,
              height: 140,
              background: `radial-gradient(circle, ${ringColor}33 0%, transparent 70%)`,
            }}
          />
          {/* SVG circle + check */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            className="animate-tx-success"
          >
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke={ringColor}
              strokeWidth="3"
              strokeDasharray="340"
              strokeDashoffset="340"
              strokeLinecap="round"
              className="animate-tx-circle"
              style={{ filter: `drop-shadow(0 0 10px ${ringColor}99)` }}
            />
            <path
              d="M 37 61 L 52 76 L 83 44"
              stroke={ringColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="80"
              strokeDashoffset="80"
              className="animate-tx-check"
              style={{ filter: `drop-shadow(0 0 6px ${ringColor}cc)` }}
            />
          </svg>
        </div>
        {/* Amount */}
        <p className={`text-4xl font-extrabold ${textColor} animate-tx-amount`}>
          ${amount}
        </p>
        {/* Label */}
        <p className="text-secondary animate-tx-label mt-2 text-base font-semibold">
          {isExpense ? 'Gasto guardado' : 'Ingreso guardado'}
        </p>
      </div>
    </div>
  );
}
