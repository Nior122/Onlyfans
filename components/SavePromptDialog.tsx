"use client";

import { useState } from "react";
import { useLibrary } from "@/components/LibraryProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { OUTPUT_TYPES, type NewPromptValues, type OutputType } from "@/lib/types";
import { FIELD_LIMITS } from "@/lib/validation";

const NEW_CATEGORY = "__new__";
const TITLE_LIMIT = 120;
const CATEGORY_LIMIT = 40;

type SavePromptDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initial: NewPromptValues;
  onClose: () => void;
  onSubmit: (values: NewPromptValues) => void;
};

/** One dialog for both "save to library" and "edit a saved prompt". */
export function SavePromptDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: SavePromptDialogProps) {
  const { categories } = useLibrary();
  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category);
  const [newCategory, setNewCategory] = useState("");
  const [promptText, setPromptText] = useState(initial.promptText);
  const [role, setRole] = useState(initial.role);
  const [outputType, setOutputType] = useState<OutputType>(initial.outputType);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const creatingCategory = category === NEW_CATEGORY;
  const effectiveCategory = creatingCategory ? newCategory.trim() : category;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = "Give this prompt a title.";
    else if (title.trim().length > TITLE_LIMIT)
      nextErrors.title = `Keep it under ${TITLE_LIMIT} characters.`;

    if (!effectiveCategory) nextErrors.category = "Choose or name a category.";
    else if (effectiveCategory.length > CATEGORY_LIMIT) {
      nextErrors.category = `Keep it under ${CATEGORY_LIMIT} characters.`;
    }

    if (mode === "edit" && !promptText.trim()) nextErrors.promptText = "The prompt cannot be empty.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      document.getElementById(Object.keys(nextErrors)[0] ?? "")?.focus();
      return;
    }

    setErrors({});
    onSubmit({
      title: title.trim(),
      category: effectiveCategory,
      role: role.trim(),
      outputType,
      goal: initial.goal,
      promptText: mode === "edit" ? promptText : initial.promptText,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={mode === "create" ? "Save to library" : "Edit prompt"}
      description={
        mode === "create"
          ? "Saved in this browser only. Export any time from the Library."
          : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="save-prompt-form">
            {mode === "create" ? "Save prompt" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="save-prompt-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="title"
          label="Title"
          required
          maxLength={TITLE_LIMIT}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
          hint="Suggested from your goal — edit it if you like."
        />

        <div className="space-y-4">
          <Select
            id="category"
            label="Category"
            required
            options={[
              ...categories,
              { value: NEW_CATEGORY, label: "＋ New category…" },
            ]}
            placeholder="Choose a category…"
            value={creatingCategory ? NEW_CATEGORY : category}
            onChange={(event) => {
              setCategory(event.target.value);
              setErrors((previous) => ({ ...previous, category: "" }));
            }}
            error={errors.category}
          />

          {creatingCategory ? (
            <Input
              id="new-category"
              label="New category name"
              maxLength={CATEGORY_LIMIT}
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="e.g. Client work"
              error={errors.category}
            />
          ) : null}
        </div>

        {mode === "edit" ? (
          <>
            <Textarea
              id="promptText"
              label="Prompt text"
              required
              rows={10}
              value={promptText}
              onChange={(event) => setPromptText(event.target.value)}
              error={errors.promptText}
              className="font-mono text-label"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="edit-role"
                label="Role"
                maxLength={FIELD_LIMITS.role}
                value={role}
                onChange={(event) => setRole(event.target.value)}
              />
              <Select
                id="edit-outputType"
                label="Output type"
                options={OUTPUT_TYPES}
                placeholder="Choose an output type…"
                value={outputType}
                onChange={(event) => setOutputType(event.target.value as OutputType)}
              />
            </div>
          </>
        ) : (
          <dl className="rounded-card border border-border p-4 text-body">
            <div className="flex gap-2">
              <dt className="text-fg-muted">Role:</dt>
              <dd className="text-fg-secondary">{initial.role || "—"}</dd>
            </div>
            <div className="mt-1 flex gap-2">
              <dt className="text-fg-muted">Output type:</dt>
              <dd className="text-fg-secondary">{initial.outputType}</dd>
            </div>
          </dl>
        )}
      </form>
    </Modal>
  );
}
