import { Plus } from "lucide-react"

type Props = {
    text: string
    onClick: () => void
}

function AnimatedButton({text, onClick}: Props) {
  return (
    <button 
        onClick={onClick}
        className="group bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97] text-white px-6 py-3 rounded-2xl font-semibold text-sm transition-all flex items-center gap-2.5 shadow-lg shadow-emerald-500/25 recurring-fade-up"
        style={{animationDelay: '300ms'}}
    >
        <Plus size={18} className="transition-transform group-hover:rotate-90 duration-300"/>
        {text}
    </button>
  )
}

export default AnimatedButton