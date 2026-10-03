"use client";

import { useMemo, useState } from "react";
import { Library, X } from "lucide-react";
import { CategoryManager } from "@/components/CategoryManager";
import { useLibrary } from "@/components/LibraryProvider";
import { DeletePromptDialog, PromptViewDialog } from "@/components/LibraryModals";
import { LibraryToolbar, type SortOrder } from "@/components/LibraryToolbar";
import { PromptCard } from "@/components/PromptCard";
import { SavePromptDialog } from "@/components/SavePromptDialog";
import type { SavedPrompt } from "@/lib/types";

export function LibraryView() {
  const { prompts, ready, updatePrompt, deletePrompt } = useLibrary();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [viewing, setViewing] = useState<SavedPrompt | null>(null);
  const [editing, setEditing] = useState<SavedPrompt | null>(null);
  const [deleting, setDeleting] = useState<SavedPrompt | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = prompts.filter((prompt) => {
      if (category !== "all" && prompt.category !== category) return false;
      if (!needle) return true;
      return [
        prompt.title,
        prompt.goal,
        prompt.role,
        prompt.category,
        prompt.outputType,
        prompt.promptText,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    // ISO timestamps sort correctly as strings.
    return matches.sort((a, b) =>
      sort === "newest"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
  }, [prompts, query, category, sort]);

  return (
    <div className="space-y-5">
      <LibraryToolbar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
        onManageCategories={() => setManagingCategories(true)}
        shownCount={filtered.length}
      />

      {!ready ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="card h-48 animate-pulse bg-subtle/40 p-4" />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <EmptyState
          title="Your library is empty"
          body="Generate a master prompt in the Builder tab, then choose “Save to library” to keep it here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No prompts match your filters" body="Try a different search or category.">
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="btn-secondary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear filters
          </button>
        </EmptyState>
      ) : (
        <ul className="grid list-none gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((prompt) => (
            <li key={prompt.id}>
              <PromptCard
                prompt={prompt}
                onView={() => setViewing(prompt)}
                onEdit={() => setEditing(prompt)}
                onDelete={() => setDeleting(prompt)}
              />
            </li>
          ))}
        </ul>
      )}

      <PromptViewDialog
        prompt={viewing}
        onClose={() => setViewing(null)}
        onEdit={(prompt) => {
          setEditing(prompt);
          setViewing(null);
        }}
      />

      <DeletePromptDialog
        prompt={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(prompt) => {
          deletePrompt(prompt.id);
          setDeleting(null);
        }}
      />

      {editing ? (
        <SavePromptDialog
          key={editing.id}
          open
          mode="edit"
          initial={{
            title: editing.title,
            category: editing.category,
            role: editing.role,
            outputType: editing.outputType,
            goal: editing.goal,
            promptText: editing.promptText,
          }}
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            updatePrompt(editing.id, values);
            setEditing(null);
          }}
        />
      ) : null}

      <CategoryManager open={managingCategories} onClose={() => setManagingCategories(false)} />
    </div>
  );
}

function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card grid place-items-center gap-3 px-6 py-16 text-center">
      <Library className="h-6 w-6 text-brand" aria-hidden="true" />
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted">{body}</p>
      {children}
    </div>
  );
}
