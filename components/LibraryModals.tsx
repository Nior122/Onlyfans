"use client";

import { CopyButton } from "@/components/CopyButton";
import { Modal } from "@/components/ui/Modal";
import type { SavedPrompt } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type PromptViewDialogProps = {
  prompt: SavedPrompt | null;
  onClose: () => void;
  onEdit: (prompt: SavedPrompt) => void;
};

/** Read-only full view of one saved prompt. */
export function PromptViewDialog({ prompt, onClose, onEdit }: PromptViewDialogProps) {
  return (
    <Modal
      open={prompt !== null}
      onClose={onClose}
      size="lg"
      title={prompt?.title ?? ""}
      description={
        prompt
          ? `${prompt.category} · ${prompt.outputType} · saved ${formatDate(prompt.createdAt)}`
          : undefined
      }
      footer={
        prompt ? (
          <>
            <CopyButton text={prompt.promptText} label="Copy prompt" />
            <button type="button" className="btn-primary" onClick={() => onEdit(prompt)}>
              Edit
            </button>
          </>
        ) : null
      }
    >
      {prompt?.goal ? (
        <p className="mb-3 rounded-lg border border-line bg-subtle/60 p-3 text-sm text-muted">
          <span className="font-medium text-fg">Goal: </span>
          {prompt.goal}
        </p>
      ) : null}
      <pre className="whitespace-pre-wrap break-words rounded-xl border border-line bg-subtle/40 p-4 font-sans text-sm leading-relaxed">
        {prompt?.promptText}
      </pre>
    </Modal>
  );
}

type DeletePromptDialogProps = {
  prompt: SavedPrompt | null;
  onClose: () => void;
  onConfirm: (prompt: SavedPrompt) => void;
};

/** Destructive action, so it always asks first. */
export function DeletePromptDialog({ prompt, onClose, onConfirm }: DeletePromptDialogProps) {
  return (
    <Modal
      open={prompt !== null}
      onClose={onClose}
      size="sm"
      title="Delete this prompt?"
      description="This cannot be undone. Export your library first if you want a backup."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary !bg-danger hover:!bg-danger/90"
            onClick={() => prompt && onConfirm(prompt)}
          >
            Delete prompt
          </button>
        </>
      }
    >
      <p className="text-sm font-medium">{prompt?.title}</p>
    </Modal>
  );
}
