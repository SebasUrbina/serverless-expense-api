import { Plus } from 'lucide-react';

type Props = {
  text: string;
  onClick: () => void;
};

function AnimatedButton({ text, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="group recurring-fade-up flex items-center gap-2.5 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 active:scale-[0.97]"
      style={{ animationDelay: '300ms' }}
    >
      <Plus
        size={18}
        className="transition-transform duration-300 group-hover:rotate-90"
      />
      {text}
    </button>
  );
}

export default AnimatedButton;
