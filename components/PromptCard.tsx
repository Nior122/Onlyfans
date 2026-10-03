"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { Badge, categoryHue } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SavedPrompt } from "@/lib/types";
import { formatDate, stripMarkdown, truncate } from "@/lib/utils";

type PromptCardProps = {
  prompt: SavedPrompt;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** One saved prompt: title, category, preview, date and icon actions. */
export function PromptCard({ prompt, onView, onEdit, onDelete }: PromptCardProps) {
  const preview = truncate(stripMarkdown(prompt.promptText), 220);

  return (
    <Card interactive padding="md" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-body font-semibold">
          {/* The title opens the full view, which is the primary action. */}
          <button
            type="button"
            onClick={onView}
            className="block w-full truncate text-left transition-colors duration-150 hover:text-accent-text focus-visible:text-accent-text"
          >
            {prompt.title}
          </button>
        </h3>
        <Badge dot={categoryHue(prompt.category)} className="max-w-[9rem]">
          <span className="truncate">{prompt.category}</span>
        </Badge>
      </div>

      <p className="mt-2 truncate text-label text-fg-muted">
        {prompt.outputType}
        {prompt.role ? (
          <>
            <span aria-hidden="true"> · </span>
            {prompt.role}
          </>
        ) : null}
      </p>

      <p className="mt-3 line-clamp-3 flex-1 text-body text-fg-secondary">{preview}</p>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <time dateTime={prompt.createdAt} className="text-label text-fg-muted">
          {formatDate(prompt.createdAt)}
        </time>

        <div className="flex items-center gap-1">
          <CopyButton text={prompt.promptText} label={`Copy ${prompt.title}`} variant="ghost" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onView}
            aria-label={`View ${prompt.title}`}
            title="View"
          >
            <Eye aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label={`Edit ${prompt.title}`}
            title="Edit"
          >
            <Pencil aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={`Delete ${prompt.title}`}
            title="Delete"
            className="hover:text-error"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
