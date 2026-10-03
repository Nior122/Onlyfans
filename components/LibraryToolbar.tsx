"use client";

import { Download, FolderCog, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
  shownCount: number;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
] as const;

/**
 * Search on the left, filters on the right. Search and both selects use the
 * shared controls with hidden labels, so this row is styled by the same rules
 * as the form.
 */
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
  const { prompts, categories } = useLibrary();
  const hasFilters = query.trim() !== "" || category !== "all";

  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...categories.map((name) => ({ value: name, label: name })),
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:max-w-xs sm:flex-1">
          <Input
            id="library-search"
            label="Search saved prompts"
            type="search"
            icon={<Search />}
            labelHidden
            placeholder="Search prompts…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Select
            id="library-category"
            label="Filter by category"
            labelHidden
            width="auto"
            options={categoryOptions}
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
          />

          <Select
            id="library-sort"
            label="Sort prompts"
            labelHidden
            width="auto"
            options={SORT_OPTIONS}
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortOrder)}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={onManageCategories}
            aria-label="Manage categories"
            title="Manage categories"
          >
            <FolderCog aria-hidden="true" />
          </Button>
        </div>
      </div>

      {prompts.length > 0 ? (
        <p className="mt-3 text-label text-fg-muted" role="status">
          {shownCount} of {prompts.length} prompt{prompts.length === 1 ? "" : "s"}
          {hasFilters ? " match" : ""}
        </p>
      ) : null}
    </div>
  );
}

/** Header-row actions: Export and Import as secondary buttons. */
export function LibraryActions({ onImport, importing }: { onImport: () => void; importing: boolean }) {
  const { prompts, exportLibrary } = useLibrary();

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={exportLibrary} disabled={prompts.length === 0}>
        <Download aria-hidden="true" />
        Export
      </Button>
      <Button variant="secondary" onClick={onImport} disabled={importing}>
        <Upload aria-hidden="true" />
        {importing ? "Importing…" : "Import"}
      </Button>
    </div>
  );
}
