"use client";

import { useRef, useState } from "react";
import { Download, FolderCog, Search, SlidersHorizontal, Upload } from "lucide-react";
import { useLibrary } from "@/components/LibraryProvider";

export type SortOrder = "newest" | "oldest";

type LibraryToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  sort: SortOrder;
  onSortChange: (value: SortOrder) => void;
  onManageCategories: () => void;
  /** Counts for the results line, computed by the view from the filtered list. */
  shownCount: number;
};

export function LibraryToolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  onManageCategories,
  shownCount,
}: LibraryToolbarProps) {
  const { prompts, categories, ready, exportLibrary, importLibrary } = useLibrary();
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setImporting(true);
    await importLibrary(file);
    setImporting(false);
    // Allow re-importing the same filename.
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const hasFilters = query.trim() !== "" || category !== "all";

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="library-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search titles, goals and prompt text…"
            aria-label="Search saved prompts"
            className="input !pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="library-category" className="sr-only">
            Filter by category
          </label>
          <select
            id="library-category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="input !w-auto"
          >
            <option value="all">All categories</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <SlidersHorizontal className="h-4 w-4 text-muted" aria-hidden="true" />
          <label htmlFor="library-sort" className="sr-only">
            Sort prompts
          </label>
          <select
            id="library-sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortOrder)}
            className="input !w-auto"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          <button type="button" onClick={onManageCategories} className="btn-secondary">
            <FolderCog className="h-4 w-4" aria-hidden="true" />
            Categories
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            disabled={importing}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {importing ? "Importing…" : "Import"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Import a prompt library JSON file"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />

          <button
            type="button"
            onClick={exportLibrary}
            className="btn-secondary"
            disabled={prompts.length === 0}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      {ready && prompts.length > 0 ? (
        <p className="mt-3 text-xs text-muted" role="status">
          Showing {shownCount} of {prompts.length} prompt{prompts.length === 1 ? "" : "s"}
          {hasFilters ? " (filtered)" : ""}.
        </p>
      ) : null}
    </div>
  );
}
