export type TransactionType = 'expense' | 'income';

export function TransactionTypeToggle({
  value,
  onChange,
}: {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
}) {
  return (
    <div
      className="bg-inset mb-6 flex rounded-xl p-1"
      role="group"
      aria-label="Tipo de movimiento"
    >
      {(['expense', 'income'] as const).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          aria-pressed={value === type}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            value === type
              ? 'bg-card-hover text-primary shadow-sm'
              : 'text-secondary hover:text-primary'
          }`}
        >
          {type === 'expense' ? 'Gasto' : 'Ingreso'}
        </button>
      ))}
    </div>
  );
}
