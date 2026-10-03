"use client";

import { Chip } from "@/components/ui/Chip";
import { ROLE_SUGGESTIONS } from "@/lib/types";

type RoleChipsProps = {
  value: string;
  onChange: (role: string) => void;
};

/** Quick-pick role chips. The Role field remains free text. */
export function RoleChips({ value, onChange }: RoleChipsProps) {
  const current = value.trim().toLowerCase();

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested roles">
      {ROLE_SUGGESTIONS.map((role) => (
        <Chip
          key={role}
          selected={current === role.toLowerCase()}
          onClick={() => onChange(role)}
        >
          {role}
        </Chip>
      ))}
    </div>
  );
}
