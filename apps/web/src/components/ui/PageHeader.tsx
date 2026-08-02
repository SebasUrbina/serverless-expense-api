"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { PageTitle, PageSubtitle } from "./Text";

type PrimaryAction = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "accent" | "emerald";
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Custom title element (e.g., personalized greeting with emoji) */
  customTitle?: ReactNode;
  /** Primary action button (e.g., "+ Agregar" or "Nueva regla") */
  primaryAction?: PrimaryAction;
  /** MonthSelector component slot */
  monthSelector?: ReactNode;
  /** Show mobile settings link button (default: true) */
  showMobileSettings?: boolean;
  /** Extra content rendered below title or alongside controls (e.g. summary pills) */
  children?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  customTitle,
  primaryAction,
  monthSelector,
  showMobileSettings = true,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`px-4 sm:px-6 pt-5 sm:pt-6 pb-4 ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 sm:items-start sm:gap-4">
          <div className="min-w-0 flex-1 pr-1">
            {customTitle ? (
              customTitle
            ) : (
              <div>
                <PageTitle>{title}</PageTitle>
                {subtitle && <PageSubtitle>{subtitle}</PageSubtitle>}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
            {monthSelector}

            {showMobileSettings && (
              <Link
                href="/settings"
                className="sm:hidden w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-card border border-border text-secondary hover:text-primary hover:bg-card-hover active:scale-95"
                aria-label="Ajustes"
              >
                <Settings size={18} className="text-accent" />
              </Link>
            )}

            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="hidden sm:flex bg-accent hover:bg-emerald-600 active:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all items-center gap-1.5 shadow-sm text-sm whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
              >
                {primaryAction.icon ? (
                  primaryAction.icon
                ) : (
                  <span className="text-base leading-none">+</span>
                )}
                <span>{primaryAction.label}</span>
              </button>
            )}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

export default PageHeader;
