"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, parseISO, subMonths, addMonths, isValid } from "date-fns";
import { es } from "date-fns/locale";

type MonthSelectorProps = {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  className?: string;
  alignDropdown?: "left" | "right";
};

export function MonthSelector({
  value,
  onChange,
  className = "",
  alignDropdown = "right",
}: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    const currentDate = value ? parseISO(`${value}-01`) : new Date();
    if (!isValid(currentDate)) return;
    const prevDate = subMonths(currentDate, 1);
    onChange(format(prevDate, "yyyy-MM"));
  };

  const handleNextMonth = () => {
    const currentDate = value ? parseISO(`${value}-01`) : new Date();
    if (!isValid(currentDate)) return;
    const nextDate = addMonths(currentDate, 1);
    onChange(format(nextDate, "yyyy-MM"));
  };

  // Generate last 12 months for quick selection
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return format(d, "yyyy-MM");
  });

  const displayValue = value
    ? format(parseISO(`${value}-01`), "MMM yyyy", { locale: es })
    : "Todos";

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center rounded-2xl p-1 h-10 sm:h-[42px] transition-all max-w-full bg-inset backdrop-blur-xl border border-border shadow-sm">
        <button
          onClick={handlePrevMonth}
          className="flex items-center justify-center h-full w-8 sm:w-9 rounded-xl hover:bg-card-hover transition-colors text-muted hover:text-secondary"
          title="Mes anterior"
        >
          <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-1 items-center justify-center gap-1.5 px-2.5 sm:px-3 h-full text-xs sm:text-sm font-semibold hover:bg-card-hover rounded-xl transition-colors min-w-[88px] sm:min-w-[110px] text-primary"
        >
          <Calendar
            size={14}
            className="text-emerald-500 dark:text-emerald-400 sm:w-[15px] sm:h-[15px]"
          />
          <span className="whitespace-nowrap capitalize tracking-wide">
            {displayValue}
          </span>
        </button>

        <button
          onClick={handleNextMonth}
          className="flex items-center justify-center h-full w-8 sm:w-9 rounded-xl hover:bg-card-hover transition-colors text-muted hover:text-secondary"
          title="Mes siguiente"
        >
          <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-56 rounded-3xl z-50 overflow-hidden p-2 bg-card/95 backdrop-blur-2xl border border-border shadow-elevated ${
            alignDropdown === "left" ? "left-0" : "right-0"
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 mb-1 text-muted">
            Selección rápida
          </div>
          <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
            <button
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={`text-left px-3 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
                !value
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "text-secondary hover:bg-inset hover:text-primary"
              }`}
            >
              Todos los meses
            </button>
            {last12Months.map((monthStr) => (
              <button
                key={monthStr}
                onClick={() => {
                  onChange(monthStr);
                  setIsOpen(false);
                }}
                className={`text-left px-3 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
                  value === monthStr
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "text-secondary hover:bg-inset hover:text-primary"
                }`}
              >
                {format(parseISO(`${monthStr}-01`), "MMMM yyyy", {
                  locale: es,
                })}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
