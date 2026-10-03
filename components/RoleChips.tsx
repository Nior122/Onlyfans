"use client";

import { ROLE_SUGGESTIONS } from "@/lib/types";
import { cn } from "@/lib/utils";

type RoleChipsProps = {
  value: string;
  onChange: (role: string) => void;
};

/** Quick-pick role chips. The Role field remains free text. */
export function RoleChips({ value, onChange }: RoleChipsProps) {
  const current = value.trim().toLowerCase();

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested roles">
      {ROLE_SUGGESTIONS.map((role) => {
        const active = current === role.toLowerCase();
        return (
          <button
            key={role}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(role)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-brand bg-brand-soft text-brand"
                : "border-line bg-surface text-muted hover:border-brand/50 hover:text-fg",
            )}
          >
            {role}
          </button>
        );
      })}
    </div>
  );
}
