import { memberColorSlot } from '@/lib/groupLedger';

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export function MemberAvatar({
  userId,
  nickname,
  size = 'md',
  className = '',
}: {
  userId: string;
  nickname: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const color = `var(--cat-${memberColorSlot(userId)})`;
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold uppercase ${SIZES[size]} ${className}`}
      style={{
        background: `color-mix(in srgb, ${color} 20%, var(--bg-card))`,
        color,
      }}
    >
      {nickname.trim()[0] ?? '?'}
    </span>
  );
}

export function MemberStack({
  members,
  max = 3,
  size = 'sm',
}: {
  members: { user_id: string; nickname: string }[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <span className="flex shrink-0 items-center">
      {shown.map((m, i) => (
        <MemberAvatar
          key={m.user_id}
          userId={m.user_id}
          nickname={m.nickname}
          size={size}
          className={`ring-card ring-2 ${i > 0 ? '-ml-1.5' : ''}`}
        />
      ))}
      {extra > 0 && (
        <span
          className={`bg-inset text-secondary ring-card -ml-1.5 flex items-center justify-center rounded-full font-semibold ring-2 ${SIZES[size]}`}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
