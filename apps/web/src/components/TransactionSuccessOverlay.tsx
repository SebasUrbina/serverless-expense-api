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
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-card border-t sm:border border-border rounded-t-4xl sm:rounded-3xl w-full max-w-lg shadow-2xl flex flex-col items-center justify-center py-20 sm:py-24 gap-0">
        {/* Animated ring + checkmark */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Glow rings */}
          <div
            className="absolute rounded-full animate-tx-glow-1"
            style={{ width: 140, height: 140, background: `radial-gradient(circle, ${ringColor}22 0%, transparent 70%)` }}
          />
          <div
            className="absolute rounded-full animate-tx-glow-2"
            style={{ width: 140, height: 140, background: `radial-gradient(circle, ${ringColor}33 0%, transparent 70%)` }}
          />
          {/* SVG circle + check */}
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="animate-tx-success">
            <circle
              cx="60" cy="60" r="54"
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
        <p className="text-base font-semibold text-secondary mt-2 animate-tx-label">
          {isExpense ? 'Gasto guardado' : 'Ingreso guardado'}
        </p>
      </div>
    </div>
  );
}
