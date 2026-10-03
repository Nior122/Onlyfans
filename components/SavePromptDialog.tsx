"use client";

import { useState } from "react";
import { SelectField, TextField } from "@/components/FormField";
import { useLibrary } from "@/components/LibraryProvider";
import { Modal } from "@/components/ui/Modal";
import { OUTPUT_TYPES, type NewPromptValues, type OutputType } from "@/lib/types";
import { FIELD_LIMITS } from "@/lib/validation";
import { cn } from "@/lib/utils";

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
    else if (title.trim().length > TITLE_LIMIT) nextErrors.title = `Keep it under ${TITLE_LIMIT} characters.`;

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
          ? "Saved in this browser only. Export any time from the Library view."
          : undefined
      }
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="save-prompt-form" className="btn-primary">
            {mode === "create" ? "Save prompt" : "Save changes"}
          </button>
        </>
      }
    >
      <form id="save-prompt-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField
          id="title"
          label="Title"
          required
          maxLength={TITLE_LIMIT}
          showCounter
          value={title}
          onChange={setTitle}
          error={errors.title}
          hint="Suggested from your goal — edit it if you like."
        />

        <div>
          <SelectField
            id="category"
            label="Category"
            required
            options={[
              ...categories,
              { value: NEW_CATEGORY, label: "＋ New category…" },
            ]}
            placeholder="Choose a category…"
            value={creatingCategory ? NEW_CATEGORY : category}
            onChange={(value) => {
              setCategory(value);
              setErrors((previous) => ({ ...previous, category: "" }));
            }}
            error={errors.category}
          />
          {creatingCategory ? (
            <div className="mt-2">
              <label
                htmlFor="new-category"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                New category name
              </label>
              <input
                id="new-category"
                type="text"
                maxLength={CATEGORY_LIMIT}
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="e.g. Client work"
                className={cn("input", errors.category && "border-danger")}
              />
            </div>
          ) : null}
        </div>

        {mode === "edit" ? (
          <>
            <TextField
              id="promptText"
              label="Prompt text"
              required
              multiline
              rows={10}
              value={promptText}
              onChange={setPromptText}
              error={errors.promptText}
              controlClassName="font-mono text-xs leading-relaxed"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="edit-role"
                label="Role"
                maxLength={FIELD_LIMITS.role}
                value={role}
                onChange={setRole}
              />
              <SelectField
                id="edit-outputType"
                label="Output type"
                options={OUTPUT_TYPES}
                placeholder="Choose an output type…"
                value={outputType}
                onChange={(value) => setOutputType(value as OutputType)}
              />
            </div>
          </>
        ) : (
          <dl className="rounded-xl border border-line bg-subtle/60 p-3 text-sm">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted">Role:</dt>
              <dd>{initial.role || "—"}</dd>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-2">
              <dt className="text-muted">Output type:</dt>
              <dd>{initial.outputType}</dd>
            </div>
          </dl>
        )}
      </form>
    </Modal>
  );
}
