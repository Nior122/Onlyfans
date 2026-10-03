"use client";

import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { SavedPrompt } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type PromptViewDialogProps = {
  prompt: SavedPrompt | null;
  onClose: () => void;
};

/** Full prompt, read-only: title, meta, goal, body, Copy. */
export function PromptViewDialog({ prompt, onClose }: PromptViewDialogProps) {
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
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <CopyButton
              text={prompt.promptText}
              label="Copy prompt"
              variant="secondary"
              size="md"
              notify
              className="[&_svg]:size-4"
            />
          </>
        ) : null
      }
    >
      {prompt?.goal ? (
        <p className="mb-4 border-l-2 border-border pl-4 text-body text-fg-secondary">
          <span className="text-fg-muted">Goal: </span>
          {prompt.goal}
        </p>
      ) : null}
      <pre className="max-w-prose whitespace-pre-wrap break-words text-body leading-prompt">
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
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-error-solid text-error-solid-fg hover:bg-error-solid/90"
            onClick={() => prompt && onConfirm(prompt)}
          >
            Delete prompt
          </Button>
        </>
      }
    >
      <p className="text-body font-semibold">{prompt?.title}</p>
    </Modal>
  );
}
