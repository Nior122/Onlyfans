"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, FileText, X } from "lucide-react";
import { CategoryManager } from "@/components/CategoryManager";
import { useLibrary } from "@/components/LibraryProvider";
import { DeletePromptDialog, PromptViewDialog } from "@/components/LibraryModals";
import { LibraryActions, LibraryToolbar, type SortOrder } from "@/components/LibraryToolbar";
import { PromptCard } from "@/components/PromptCard";
import { SavePromptDialog } from "@/components/SavePromptDialog";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Card";
import type { SavedPrompt } from "@/lib/types";

type LibraryViewProps = {
  /** Lets the empty state send the visitor to the builder. */
  onNavigateToBuilder: () => void;
};

export function LibraryView({ onNavigateToBuilder }: LibraryViewProps) {
  const { prompts, ready, storageAvailable, updatePrompt, deletePrompt, importLibrary } =
    useLibrary();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [viewing, setViewing] = useState<SavedPrompt | null>(null);
  const [editing, setEditing] = useState<SavedPrompt | null>(null);
  const [deleting, setDeleting] = useState<SavedPrompt | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    setImporting(true);
    await importLibrary(file);
    setImporting(false);
    // Allow re-importing the same filename.
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* The count lives in the toolbar's status line, beside the filters it
            describes, so it is not repeated here. */}
        <h2 className="text-section font-semibold">Library</h2>

        <LibraryActions
          importing={importing}
          onImport={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Import a prompt library JSON file"
          tabIndex={-1}
          onChange={(event) => void handleImportFile(event.target.files?.[0])}
        />
      </div>

      {/* localStorage can be blocked by private mode or site settings; say so
          rather than letting saves fail silently. */}
      {ready && !storageAvailable ? (
        <p className="flex items-start gap-2 rounded-card border border-border bg-surface p-4 text-body text-fg-secondary">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" aria-hidden="true" />
          This browser is blocking local storage, so prompts cannot be saved, imported or exported
          here. Try a normal (non-private) window.
        </p>
      ) : null}

      {/* The toolbar belongs to the grid it filters: 16px to the grid, and 24px
          up to the header row from the panel's own rhythm. */}
      <div className="space-y-4">
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
              <Skeleton key={index} className="h-44 rounded-card" />
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <EmptyState
            title="No saved prompts yet"
            body="Generate a master prompt in the builder, then choose Save to library to keep it here."
          >
            <Button onClick={onNavigateToBuilder}>Go to the builder</Button>
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No prompts match your filters"
            body="Try a different search term or category."
          >
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              <X aria-hidden="true" />
              Clear filters
            </Button>
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
      </div>

      <PromptViewDialog prompt={viewing} onClose={() => setViewing(null)} />

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
    <div className="rounded-card border border-border bg-surface px-6 py-16">
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
        <FileText className="size-5 text-fg-muted" aria-hidden="true" />
        <h3 className="text-body font-semibold">{title}</h3>
        <p className="text-body text-fg-secondary">{body}</p>
        {children}
      </div>
    </div>
  );
}
