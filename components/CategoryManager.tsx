"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLibrary } from "@/components/LibraryProvider";
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
      description="Organise your library. Removing a category moves its prompts to “Other”."
    >
      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="new-category-name" className="mb-1.5 block text-sm font-medium">
            New category
          </label>
          <input
            id="new-category-name"
            type="text"
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Client work"
            className="input"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={!name.trim()}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </form>

      <ul className="mt-5 divide-y divide-line rounded-xl border border-line">
        {categories.map((category) => {
          const isDefault = (DEFAULT_CATEGORIES as readonly string[]).includes(category);
          const isProtected = category === PROTECTED;
          const count = countInCategory(prompts, category);

          return (
            <li key={category} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{category}</p>
                <p className="text-xs text-muted">
                  {count} prompt{count === 1 ? "" : "s"}
                  {isDefault ? " · default" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteCategory(category)}
                disabled={isProtected}
                className="btn-ghost !px-2 !py-1.5 text-xs hover:text-danger"
                aria-label={`Delete category ${category}`}
                title={isProtected ? "“Other” is the fallback category and cannot be removed." : undefined}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
