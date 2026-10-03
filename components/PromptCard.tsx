"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import type { SavedPrompt } from "@/lib/types";
import { formatDate, stripMarkdown, truncate } from "@/lib/utils";

type PromptCardProps = {
  prompt: SavedPrompt;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function PromptCard({ prompt, onView, onEdit, onDelete }: PromptCardProps) {
  const preview = truncate(stripMarkdown(prompt.promptText), 220);

  return (
    <article className="card flex flex-col p-4 transition-colors hover:border-brand/40">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-snug">
          {/* The whole title opens the full view, which is the primary action. */}
          <button
            type="button"
            onClick={onView}
            className="text-left hover:text-brand focus-visible:text-brand"
          >
            {prompt.title}
          </button>
        </h3>
        <span className="badge shrink-0">{prompt.category}</span>
      </div>

      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span>{prompt.outputType}</span>
        {prompt.role ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="truncate">{prompt.role}</span>
          </>
        ) : null}
      </p>

      <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted">{preview}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <time dateTime={prompt.createdAt} className="text-xs text-muted">
          {formatDate(prompt.createdAt)}
        </time>

        <div className="flex flex-wrap items-center gap-1.5">
          <CopyButton text={prompt.promptText} label="Copy" className="!px-2.5 !py-1.5 text-xs" />
          <button
            type="button"
            onClick={onView}
            className="btn-secondary !px-2.5 !py-1.5 text-xs"
            aria-label={`View ${prompt.title} in full`}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            View
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="btn-secondary !px-2.5 !py-1.5 text-xs"
            aria-label={`Edit ${prompt.title}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="btn-ghost !px-2.5 !py-1.5 text-xs hover:text-danger"
            aria-label={`Delete ${prompt.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
