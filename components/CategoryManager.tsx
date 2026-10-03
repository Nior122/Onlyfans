"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLibrary } from "@/components/LibraryProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { countInCategory } from "@/lib/library";
import { DEFAULT_CATEGORIES } from "@/lib/types";

/** Categories that must stay available: prompts fall back to "Other". */
const PROTECTED = "Other";

type CategoryManagerProps = {
  open: boolean;
  onClose: () => void;
};

export function CategoryManager({ open, onClose }: CategoryManagerProps) {
  const { categories, prompts, addCategory, deleteCategory } = useLibrary();
  const [name, setName] = useState("");

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (addCategory(name)) setName("");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Categories"
      description="Removing a category moves its prompts to “Other”."
    >
      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <Input
          id="new-category-name"
          label="New category"
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Client work"
        />
        <Button type="submit" disabled={!name.trim()} className="mb-0">
          <Plus aria-hidden="true" />
          Add
        </Button>
      </form>

      <ul className="mt-6 divide-y divide-border rounded-card border border-border">
        {categories.map((category) => {
          const isDefault = (DEFAULT_CATEGORIES as readonly string[]).includes(category);
          const isProtected = category === PROTECTED;
          const count = countInCategory(prompts, category);

          return (
            <li key={category} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-body">{category}</p>
                <p className="text-label text-fg-muted">
                  {count} prompt{count === 1 ? "" : "s"}
                  {isDefault ? " · default" : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteCategory(category)}
                disabled={isProtected}
                aria-label={`Remove category ${category}`}
                title={
                  isProtected
                    ? "“Other” is the fallback category and cannot be removed."
                    : `Remove ${category}`
                }
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
