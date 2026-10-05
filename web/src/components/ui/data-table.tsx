"use client";

import * as React from "react";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconSearch,
  IconSelector,
  IconX,
} from "@tabler/icons-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const tableSurfaceClass = cn(
  "border border-[var(--border)] bg-[color:var(--primitive-surface-elevated,var(--card))]",
  "[box-shadow:var(--primitive-shadow-raised,0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.12))] rounded-[var(--primitive-radius-surface,1rem)]",
);

export type TableDensity = "compact" | "comfortable" | "spacious";
export type SortDirection = "asc" | "desc" | null;

export interface TableProps extends React.HTMLAttributes< HTMLDivElement> {
  stickyHeader?: boolean;
  density?: TableDensity;
}

export interface TableBodyProps extends React.HTMLAttributes< HTMLTableSectionElement> {
  /** Animate row reordering when sort order changes. */
  animatedSort?: boolean;
}

export interface TableRowProps extends React.HTMLAttributes< HTMLTableRowElement> {
  selected?: boolean;
  expanded?: boolean;
  /** Click anywhere on the row to toggle selection. */
  selectable?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Click anywhere on the row to toggle expansion. */
  expandable?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export interface TableHeadProps extends React.ThHTMLAttributes< HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
}

export type TableCellProps = React.TdHTMLAttributes< HTMLTableCellElement>;

export interface TableExpandableContentProps
  extends React.HTMLAttributes< HTMLTableRowElement> {
  open?: boolean;
  colSpan: number;
}

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_MORPH = [0.32, 0.72, 0, 1] as const;
const SORT_LAYOUT_MS = 0.36;

// E-10 density scale: compact 11px/xs, comfortable xs/sm, spacious sm/sm.
const densityClasses: Record< TableDensity, { head: string; cell: string }> = {
  compact: { head: "h-9 px-3 text-[11px]", cell: "h-10 px-3 text-xs" },
  comfortable: { head: "h-11 px-4 text-xs", cell: "h-12 px-4 text-sm" },
  spacious: { head: "h-12 px-5 text-sm", cell: "h-14 px-5 text-sm" },
};

type TableContextValue = {
  density: TableDensity;
  stickyHeader: boolean;
  animatedSort: boolean;
  layoutGroupId: string;
};

const TableContext = React.createContext< TableContextValue>({
  density: "comfortable",
  stickyHeader: false,
  animatedSort: false,
  layoutGroupId: "wensity-table",
});

function useTableContext() {
  return React.useContext(TableContext);
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'button, a, input, label, textarea, select, [role="checkbox"], [data-slot="table-select-cell"], [data-prevent-row-action="true"]',
    ),
  );
}

function SortIndicator({ direction }: { direction: SortDirection }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <span className="relative inline-flex size-3.5 shrink-0 items-center justify-center overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        {direction === "asc" ? (
          <motion.span
            key="asc"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92, y: 3 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.92, y: -3 }}
            transition={{ duration: SORT_LAYOUT_MS, ease: EASE_MORPH }}
            className="absolute inset-0 inline-flex items-center justify-center text-[var(--foreground)]"
          >
            <IconChevronUp size={14} stroke={2} />
          </motion.span>
        ) : direction === "desc" ? (
          <motion.span
            key="desc"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92, y: -3 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.92, y: 3 }}
            transition={{ duration: SORT_LAYOUT_MS, ease: EASE_MORPH }}
            className="absolute inset-0 inline-flex items-center justify-center text-[var(--foreground)]"
          >
            <IconChevronDown size={14} stroke={2} />
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 0.55, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.94 }}
            transition={{ duration: SORT_LAYOUT_MS * 0.85, ease: EASE_MORPH }}
            className="absolute inset-0 inline-flex items-center justify-center text-[var(--muted-foreground)]"
          >
            <IconSelector size={14} stroke={1.75} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export const Table = React.forwardRef< HTMLDivElement, TableProps>(
  ({ className, stickyHeader = false, density = "comfortable", children, ...props }, ref) => {
    const layoutGroupId = React.useId();

    return (
      <TableContext.Provider
        value={{
          density,
          stickyHeader,
          animatedSort: false,
          layoutGroupId,
        }}
      >
        <div data-wensity-primitive=""
          ref={ref}
          data-slot="table"
          data-sticky-header={stickyHeader ? "true" : undefined}
          className={cn(
            "relative w-full overflow-auto",
            tableSurfaceClass,
            className,
          )}
          {...props}
        >
          <table className="w-full caption-bottom border-collapse text-left">{children}</table>
        </div>
      </TableContext.Provider>
    );
  },
);
Table.displayName = "Table";

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes< HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-3 px-4 text-xs text-[var(--muted-foreground)]", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export const TableHeader = React.forwardRef< HTMLTableSectionElement, React.HTMLAttributes< HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    const { stickyHeader } = useTableContext();
    return (
      <thead
        ref={ref}
        className={cn(
          "border-b border-[var(--border)] text-[color:var(--primitive-text-secondary,var(--muted-foreground))]",
          stickyHeader &&
            "sticky top-0 z-10 bg-[var(--muted)]/95 backdrop-blur-sm",
          className,
        )}
        {...props}
      />
    );
  },
);
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef< HTMLTableSectionElement, TableBodyProps>(
  ({ className, animatedSort = false, children, ...props }, ref) => {
    const parentContext = useTableContext();
    const sortEnabled = animatedSort || parentContext.animatedSort;

    return (
      <TableContext.Provider
        value={{
          ...parentContext,
          animatedSort: sortEnabled,
        }}
      >
        <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props}>
          {sortEnabled ? (
            <LayoutGroup id={parentContext.layoutGroupId}>{children}</LayoutGroup>
          ) : (
            children
          )}
        </tbody>
      </TableContext.Provider>
    );
  },
);
TableBody.displayName = "TableBody";

export const TableFooter = React.forwardRef< HTMLTableSectionElement, React.HTMLAttributes< HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        "border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_4%,var(--background))] font-medium",
        className,
      )}
      {...props}
    />
  ),
);
TableFooter.displayName = "TableFooter";

export const TableRow = React.forwardRef< HTMLTableRowElement, TableRowProps>(
  (
    {
      className,
      selected = false,
      expanded = false,
      selectable = false,
      onSelectedChange,
      expandable = false,
      onExpandedChange,
      onClick,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const { animatedSort } = useTableContext();
    const shouldReduceMotion = useReducedMotion();
    const isInteractive = selectable || expandable;

    const handleClick = (event: React.MouseEvent< HTMLTableRowElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || isInteractiveTarget(event.target)) return;

      if (selectable) {
        onSelectedChange?.(!selected);
      } else if (expandable) {
        onExpandedChange?.(!expanded);
      }
    };

    const sharedClass = cn(
      "border-b border-[var(--border)]",
      "transition-[background-color,box-shadow] duration-200 ease-[var(--table-ease-out)] motion-reduce:transition-none",
      "hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))]",
      isInteractive && "cursor-pointer",
      selected &&
        "bg-[color:var(--primitive-surface-selected,color-mix(in_srgb,var(--foreground)_6%,transparent))] hover:bg-[color:var(--primitive-surface-selected,color-mix(in_srgb,var(--foreground)_6%,transparent))]",
      expanded &&
        !selected &&
        "bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))] hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))]",
      className,
    );

    const sharedProps = {
      "data-slot": "table-row",
      "data-selected": selected ? "true" : undefined,
      "data-expanded": expanded ? "true" : undefined,
      "data-selectable": selectable ? "true" : undefined,
      "data-expandable": expandable ? "true" : undefined,
      onClick: isInteractive ? handleClick : onClick,
      className: sharedClass,
      style: { ["--table-ease-out" as string]: EASE_OUT, ...style },
      ...props,
    };

    if (animatedSort && !shouldReduceMotion) {
      const motionRowProps = sharedProps as React.ComponentPropsWithoutRef< typeof motion.tr>;

      return (
        <motion.tr
          ref={ref}
          {...motionRowProps}
          layout="position"
          transition={{
            layout: { duration: SORT_LAYOUT_MS, ease: EASE_MORPH },
          }}
        >
          {children}
        </motion.tr>
      );
    }

    return (
      <tr ref={ref} {...sharedProps}>
        {children}
      </tr>
    );
  },
);
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef< HTMLTableCellElement, TableHeadProps>(
  (
    {
      className,
      sortable = false,
      sortDirection = null,
      onSort,
      children,
      "aria-sort": ariaSort,
      ...props
    },
    ref,
  ) => {
    const { density } = useTableContext();
    const isActive = Boolean(sortDirection);
    const resolvedAriaSort =
      sortDirection === "asc"
        ? "ascending"
        : sortDirection === "desc"
          ? "descending"
          : ariaSort;

    const content = (
      <>
        <span className="truncate">{children}</span>
        {sortable ? <SortIndicator direction={sortDirection} /> : null}
      </>
    );

    const sharedClass = cn(
      "relative whitespace-nowrap font-medium tracking-[-0.01em] text-[color:var(--primitive-text-secondary,var(--muted-foreground))]",
      densityClasses[density].head,
      sortable && "cursor-pointer select-none",
      sortable &&
        "transition-[color,background-color] duration-[360ms] ease-[var(--table-ease-out)] hover:text-[var(--foreground)] motion-reduce:transition-none",
      isActive &&
        "text-[var(--foreground)] after:absolute after:inset-x-3 after:bottom-0 after:h-px after:origin-left after:scale-x-100 after:bg-[color-mix(in_srgb,var(--foreground)_22%,transparent)] after:transition-transform after:duration-[360ms] after:ease-[var(--table-ease-out)]",
      className,
    );

    if (sortable) {
      return (
        <th
          ref={ref}
          scope="col"
          data-sort-active={isActive ? "true" : undefined}
          aria-sort={resolvedAriaSort}
          className={sharedClass}
          style={{ ["--table-ease-out" as string]: EASE_OUT }}
          {...props}
        >
          <button
            type="button"
            onClick={onSort}
            className="inline-flex w-full items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--foreground)_45%,transparent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            {content}
          </button>
        </th>
      );
    }

    return (
      <th
        ref={ref}
        scope="col"
        aria-sort={ariaSort}
        className={cn(sharedClass, "align-middle")}
        style={{ ["--table-ease-out" as string]: EASE_OUT }}
        {...props}
      >
        <span className="inline-flex items-center gap-1.5">{content}</span>
      </th>
    );
  },
);
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef< HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => {
    const { density, animatedSort } = useTableContext();
    const shouldReduceMotion = useReducedMotion();

    const cellClass = cn(
      "align-middle text-[var(--foreground)]",
      densityClasses[density].cell,
      animatedSort &&
        !shouldReduceMotion &&
        "transition-[opacity,transform,filter] duration-[360ms] ease-[var(--table-ease-out)] motion-reduce:transition-none",
      className,
    );

    return (
      <td
        ref={ref}
        className={cellClass}
        style={{ ["--table-ease-out" as string]: EASE_OUT }}
        {...props}
      />
    );
  },
);
TableCell.displayName = "TableCell";

export interface TableSelectCellProps extends Omit< TableCellProps, "children"> {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  ariaLabel?: string;
}

function TableCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange?: (checked: boolean) => void;
  ariaLabel: string;
}) {
  const inputRef = React.useRef< HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      data-slot="table-checkbox"
      className={cn(
        "relative inline-grid size-5 cursor-pointer place-items-center rounded-[var(--primitive-radius-control-sm,0.625rem)] border border-[var(--border)]",
        "bg-[var(--background)] text-[var(--background)]",
        "transition-[background-color,border-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--foreground)_45%,transparent))] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[var(--background)]",
        (checked || indeterminate) &&
          "border-[color:var(--primitive-control-solid,var(--primary))] bg-[color:var(--primitive-control-solid,var(--primary))] text-[color:var(--primitive-control-solid-foreground,var(--primary-foreground))]",
      )}
    >
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        aria-label={ariaLabel}
        onChange={(event) => onCheckedChange?.(event.currentTarget.checked)}
        className="sr-only"
      />
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5">
        {indeterminate ? (
          <path
            d="M4 8h8"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        ) : (
          <path
            d="m3.6 8.2 2.8 2.8 6-6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        )}
      </svg>
    </label>
  );
}

export const TableSelectCell = React.forwardRef< HTMLTableCellElement, TableSelectCellProps>(
  (
    {
      checked = false,
      indeterminate = false,
      onCheckedChange,
      ariaLabel = "Select row",
      className,
      onClick,
      ...props
    },
    ref,
  ) => {
    const { density } = useTableContext();

    return (
      <td
        ref={ref}
        data-slot="table-select-cell"
        className={cn(
          "w-10",
          densityClasses[density].cell,
          "px-3 text-center",
          className,
        )}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
        }}
        {...props}
      >
        <TableCheckbox
          checked={checked}
          indeterminate={indeterminate}
          onCheckedChange={(value) => onCheckedChange?.(value === true)}
          ariaLabel={ariaLabel}
        />
      </td>
    );
  },
);
TableSelectCell.displayName = "TableSelectCell";

export interface TableExpandTriggerCellProps extends TableCellProps {
  expanded?: boolean;
  onToggle?: () => void;
  label?: string;
}

export const TableExpandTriggerCell = React.forwardRef<
  HTMLTableCellElement,
  TableExpandTriggerCellProps
>(({ expanded = false, onToggle, label = "Toggle row details", className, children, onClick, ...props }, ref) => {
  const { density } = useTableContext();

  return (
    <td
      ref={ref}
      data-prevent-row-action="true"
      className={cn(
        "w-10",
        densityClasses[density].cell,
        "px-3 text-center",
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      {...props}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={label}
        data-prevent-row-action="true"
        onClick={(event) => {
          event.stopPropagation();
          onToggle?.();
        }}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-[var(--primitive-radius-control-sm,0.625rem)]",
          "text-[var(--muted-foreground)] transition-[color,transform] duration-[360ms] ease-[var(--table-ease-out)] motion-reduce:transition-none",
          "hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))] hover:text-[var(--foreground)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--foreground)_45%,transparent))]",
        )}
        style={{ ["--table-ease-out" as string]: EASE_OUT }}
      >
        <IconChevronDown
          size={16}
          stroke={2}
          className={cn(
            "transition-transform duration-[360ms] ease-[var(--table-ease-out)] motion-reduce:transition-none",
            expanded && "rotate-180",
          )}
        />
      </button>
      {children}
    </td>
  );
});
TableExpandTriggerCell.displayName = "TableExpandTriggerCell";

export const TableExpandableContent = React.forwardRef<
  HTMLTableRowElement,
  TableExpandableContentProps
>(({ className, open = false, colSpan, children, ...props }, ref) => {
  return (
    <tr
      ref={ref}
      data-slot="table-expandable-content"
      aria-hidden={!open}
      className={cn("border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]", className)}
      {...props}
    >
      <td colSpan={colSpan} className="p-0">
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-[360ms] ease-[var(--table-ease-out)] motion-reduce:transition-none",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
          style={{ ["--table-ease-out" as string]: EASE_OUT }}
          inert={open ? undefined : true}
        >
          <div className="overflow-hidden">
            <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{children}</div>
          </div>
        </div>
      </td>
    </tr>
  );
});
TableExpandableContent.displayName = "TableExpandableContent";


/* ─── Types ─────────────────────────────────────────────────── */

export interface DataTableColumn< TData> {
  /** Unique column identifier. */
  id: string;
  /** Header label displayed in the column head. */
  header: string;
  /** Key on the row data object used for default cell rendering and filtering. */
  accessorKey?: keyof TData;
  /** Custom cell renderer. Receives the full row. */
  cell?: (info: { row: TData }) => React.ReactNode;
  /** Whether this column can be sorted. */
  sortable?: boolean;
}

export interface DataTableFilterConfig {
  /** Placeholder text for the search input. */
  placeholder?: string;
  /** Keys on the row data to search against. Defaults to all accessorKey columns. */
  searchKeys?: string[];
  /** Debounce delay in ms. Default 240. */
  debounceMs?: number;
}

export interface DataTablePaginationConfig {
  /** Rows per page. Default 10. */
  pageSize?: number;
}

export interface DataTableExpandableConfig< TData> {
  /** Render function for expanded row content. */
  renderExpanded: (row: TData) => React.ReactNode;
}

export interface DataTableSelectableConfig< TData> {
  /** Controlled selected row IDs. */
  selectedIds?: string[];
  /** Called when selection changes. */
  onSelectionChange?: (ids: string[]) => void;
  /** Label for the select-all checkbox. */
  selectAllLabel?: string;
}

export interface DataTableProps< TData extends Record< string, unknown>> {
  /** Column definitions. */
  columns: DataTableColumn< TData>[];
  /** Row data. */
  data: TData[];
  /** Unique row identifier function. Defaults to \`row.id\` as string. */
  getRowId?: (row: TData) => string;

  /* ── Feature toggles ── */

  /** Enable column sorting. When true, any column with \`sortable: true\` becomes interactive. */
  sortable?: boolean;
  /** Enable search/filter. Pass a config object or \`true\` for defaults. */
  filterable?: boolean | DataTableFilterConfig;
  /** Enable row selection with checkboxes. Pass a config object for controlled mode or \`true\` for uncontrolled. */
  selectable?: boolean | DataTableSelectableConfig< TData>;
  /** Enable pagination. Pass a config object or \`true\` for defaults (10 rows/page). */
  paginated?: boolean | DataTablePaginationConfig;
  /** Enable expandable rows. Pass a config object with \`renderExpanded\`. */
  expandable?: boolean | DataTableExpandableConfig< TData>;

  /* ── Styling ── */

  /** Row density preset. */
  density?: TableDensity;
  /** Stick the header row on scroll. */
  stickyHeader?: boolean;
  /** Optional caption below the table. */
  caption?: string;
  /** Additional class name for the root wrapper. */
  className?: string;
  /** Empty state message when no data matches. */
  emptyState?: React.ReactNode;
}

/* ─── Constants ─────────────────────────────────────────────── */

const DEFAULT_PAGE_SIZE = 10;

const EASE_OUT_CURVE = [0.16, 1, 0.3, 1] as const;

/* ─── Helpers ───────────────────────────────────────────────── */

function defaultGetRowId< T extends Record< string, unknown>>(row: T): string {
  if ("id" in row && (typeof row.id === "string" || typeof row.id === "number")) {
    return String(row.id);
  }
  return "";
}

function getCellValue< T extends Record< string, unknown>>(
  row: T,
  column: DataTableColumn< T>,
): string {
  if (column.accessorKey) {
    const raw = row[column.accessorKey];
    if (raw == null) return "";
    return String(raw);
  }
  return "";
}

function getSearchValue< T extends Record< string, unknown>>(
  row: T,
  columns: DataTableColumn< T>[],
  key: string,
): string {
  const column = columns.find(
    (c) => c.id === key || (c.accessorKey !== undefined && String(c.accessorKey) === key),
  );

  if (column) {
    return getCellValue(row, column);
  }

  const raw = row[key as keyof T];
  if (raw == null) return "";
  return String(raw);
}

function matchesSearch< T extends Record< string, unknown>>(
  row: T,
  query: string,
  columns: DataTableColumn< T>[],
  searchKeys?: string[],
): boolean {
  if (!query.trim()) return true;
  const lowerQuery = query.toLowerCase();

  const keysToSearch =
    searchKeys?.length
      ? searchKeys
      : columns
        .filter((col) => col.accessorKey)
        .map((col) => String(col.accessorKey));

  return keysToSearch.some((key) => {
    const value = getSearchValue(row, columns, key);
    return value.toLowerCase().includes(lowerQuery);
  });
}

function getPageRange(page: number, totalPages: number, siblingCount = 1) {
  const totalSlots = siblingCount * 2 + 5;
  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(page - siblingCount, 1);
  const rightSiblingIndex = Math.min(page + siblingCount, totalPages);
  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  const items: (number | "ellipsis-start" | "ellipsis-end")[] = [1];

  if (showLeftEllipsis) {
    items.push("ellipsis-start");
  } else {
    for (let i = 2; i < leftSiblingIndex; i++) items.push(i);
  }

  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    if (i !== 1 && i !== totalPages) items.push(i);
  }

  if (showRightEllipsis) {
    items.push("ellipsis-end");
  } else {
    for (let i = rightSiblingIndex + 1; i < totalPages; i++) items.push(i);
  }

  if (totalPages > 1) items.push(totalPages);
  return items;
}

/* ─── Sub-components ────────────────────────────────────────── */

function SelectAllCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange?: (checked: boolean) => void;
  ariaLabel: string;
}) {
  const inputRef = React.useRef< HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      data-slot="table-checkbox"
      className={cn(
        "relative inline-grid size-5 cursor-pointer place-items-center rounded-[var(--primitive-radius-control-sm,0.625rem)] border border-[var(--border)]",
        "bg-[var(--background)] text-[var(--background)]",
        "transition-[background-color,border-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--foreground)_45%,transparent))] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[var(--background)]",
        (checked || indeterminate) &&
          "border-[color:var(--primitive-control-solid,var(--primary))] bg-[color:var(--primitive-control-solid,var(--primary))] text-[color:var(--primitive-control-solid-foreground,var(--primary-foreground))]",
      )}
    >
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        aria-label={ariaLabel}
        onChange={(event) => onCheckedChange?.(event.currentTarget.checked)}
        className="sr-only"
      />
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5">
        {indeterminate ? (
          <path d="M4 8h8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        ) : (
          <path d="m3.6 8.2 2.8 2.8 6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        )}
      </svg>
    </label>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div data-wensity-primitive=""
      className={cn(
        "relative flex h-[var(--primitive-control-height-md,2.25rem)] w-full max-w-xs items-center gap-2",
        "rounded-[var(--primitive-radius-control,0.875rem)] border border-[var(--border)] bg-[var(--background)]",
        "px-3 text-sm transition-[border-color,box-shadow] duration-150",
        "focus-within:border-[color-mix(in_srgb,var(--foreground)_24%,transparent)]",
        "focus-within:ring-2 focus-within:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--foreground)_45%,transparent))] focus-within:ring-offset-2 focus-within:ring-offset-[var(--background)]",
      )}
    >
      <IconSearch size={15} stroke={1.75} className="shrink-0 text-[var(--muted-foreground)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent text-[var(--foreground)]",
          "placeholder:text-[color:var(--primitive-text-placeholder,var(--muted-foreground))]",
          "outline-none",
        )}
      />
      <AnimatePresence>
        {value ? (
          <motion.button
            type="button"
            onClick={() => onChange("")}
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: EASE_OUT_CURVE }}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-[var(--primitive-radius-control-sm,0.625rem)]",
              "text-[var(--muted-foreground)] hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))] hover:text-[var(--foreground)]",
              "transition-colors duration-150",
            )}
          >
            <IconX size={12} stroke={2} />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const items = getPageRange(page, totalPages);

  const navButtonClass = cn(
    "relative isolate inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--primitive-radius-control-sm,0.625rem)]",
    "text-xs font-medium leading-none select-none touch-manipulation outline-none",
    "transition-[color,background-color] duration-[150ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
    "text-[var(--muted-foreground)]",
    "hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))] hover:text-[var(--foreground)]",
    "focus-visible:ring-2 focus-visible:ring-[color:var(--primitive-ring,color-mix(in_srgb,var(--foreground)_45%,transparent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
    "disabled:pointer-events-none disabled:opacity-35",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  );

  return (
    <nav
      data-wensity-primitive=""
      aria-label="Pagination"
      className="flex items-center gap-0.5"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={navButtonClass}
        aria-label="Previous page"
      >
        <IconChevronLeft size={14} stroke={2} />
      </button>

      {items.map((item) => {
        if (item === "ellipsis-start" || item === "ellipsis-end") {
          return (
            <span
              key={item}
              className="inline-flex size-7 items-center justify-center text-[length:var(--primitive-text-hint,0.6875rem)] text-[var(--muted-foreground)]"
              aria-hidden
            >
              …
            </span>
          );
        }

        const isActive = item === page;
        return (
          <button
            key={item}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={cn(
              navButtonClass,
              "rounded-[var(--primitive-radius-control-sm,0.625rem)] tabular-nums",
              isActive &&
                "bg-[color:var(--primitive-surface-selected,color-mix(in_srgb,var(--foreground)_6%,transparent))] text-[var(--foreground)]",
            )}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={navButtonClass}
        aria-label="Next page"
      >
        <IconChevronRight size={14} stroke={2} />
      </button>
    </nav>
  );
}

/* ─── DataTable ─────────────────────────────────────────────── */

function DataTableInner< TData extends Record< string, unknown>>({
  columns,
  data,
  getRowId = defaultGetRowId,
  sortable = false,
  filterable = false,
  selectable = false,
  paginated = false,
  expandable = false,
  density = "comfortable",
  stickyHeader = false,
  caption,
  className,
  emptyState,
}: DataTableProps< TData>) {
  /* ── Resolve configs ── */

  const filterConfig: DataTableFilterConfig =
    typeof filterable === "object" ? filterable : {};
  const paginationConfig: DataTablePaginationConfig =
    typeof paginated === "object" ? paginated : {};
  const selectableConfig: DataTableSelectableConfig< TData> | null =
    typeof selectable === "object" ? selectable : null;
  const expandableConfig: DataTableExpandableConfig< TData> | null =
    typeof expandable === "object" ? expandable : null;

  const isFilterable = filterable !== false;
  const isPaginated = paginated !== false;
  const isSelectable = selectable !== false;
  const isExpandable = expandable !== false;
  const isSortable = sortable !== false;

  const pageSize = paginationConfig.pageSize ?? DEFAULT_PAGE_SIZE;

  /* ── State ── */

  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState< string | null>(null);
  const [sortDirection, setSortDirection] = React.useState< SortDirection>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState< Set< string>>(new Set());
  const [expandedId, setExpandedId] = React.useState< string | null>(null);

  /* ── Debounce search ── */

  React.useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedQuery(searchQuery),
      filterConfig.debounceMs ?? 240,
    );
    return () => clearTimeout(timer);
  }, [searchQuery, filterConfig.debounceMs]);

  /* ── Controlled selection ── */

  const effectiveSelectedIds = selectableConfig?.selectedIds
    ? new Set(selectableConfig.selectedIds)
    : selectedIds;

  const handleSelectionChange = React.useCallback(
    (ids: Set< string>) => {
      if (selectableConfig?.onSelectionChange) {
        selectableConfig.onSelectionChange([...ids]);
      } else {
        setSelectedIds(ids);
      }
    },
    [selectableConfig],
  );

  /* ── Sorting ── */

  const toggleSort = React.useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDirection((prev) =>
          prev === "asc" ? "desc" : prev === "desc" ? null : "asc",
        );
      } else {
        setSortKey(key);
        setSortDirection("asc");
      }
      setCurrentPage(1);
    },
    [sortKey],
  );

  /* ── Process: filter → sort → paginate ── */

  const filtered = React.useMemo(() => {
    if (!debouncedQuery.trim()) return data;
    return data.filter((row) =>
      matchesSearch(row, debouncedQuery, columns, filterConfig.searchKeys),
    );
  }, [data, debouncedQuery, columns, filterConfig.searchKeys]);

  const sorted = React.useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;
    const col = columns.find((c) => c.id === sortKey);
    if (!col) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = getCellValue(a, col);
      const bVal = getCellValue(b, col);
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortDirection === "desc" ? -cmp : cmp;
    });
  }, [filtered, sortKey, sortDirection, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = React.useMemo(() => {
    if (!isPaginated) return sorted;
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, isPaginated, safePage, pageSize]);

  /* ── Reset page on filter change ── */

  // A new query means a different result set, so page 2 of the old results is
  // meaningless. Reset during render rather than from an effect, which showed
  // one frame of the wrong page.
  const [lastQuery, setLastQuery] = React.useState(debouncedQuery);
  if (debouncedQuery !== lastQuery) {
    setLastQuery(debouncedQuery);
    setCurrentPage(1);
  }

  /* ── Selection helpers ── */

  const allRowIds = React.useMemo(
    () => paginatedData.map((row) => getRowId(row)).filter(Boolean),
    [paginatedData, getRowId],
  );

  const allSelected =
    allRowIds.length > 0 && allRowIds.every((id) => effectiveSelectedIds.has(id));
  const isIndeterminate =
    allRowIds.some((id) => effectiveSelectedIds.has(id)) && !allSelected;

  /* ── Total colSpan for empty/expansion cells ── */

  const totalColSpan =
    columns.length +
    (isSelectable ? 1 : 0) +
    (isExpandable && expandableConfig ? 1 : 0);

  const resolveSortDir = (colId: string): SortDirection =>
    sortKey === colId ? sortDirection : null;

  return (
    <div data-wensity-primitive="" className={cn("w-full space-y-3", className)}>
      {isFilterable ? (
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={filterConfig.placeholder}
        />
      ) : null}

      <Table density={density} stickyHeader={stickyHeader}>
        {caption ? <TableCaption>{caption}</TableCaption> : null}

        <TableHeader>
          <TableRow>
            {isSelectable ? (
              <TableHead className="w-10 px-3 text-center">
                <SelectAllCheckbox
                  checked={allSelected}
                  indeterminate={isIndeterminate}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleSelectionChange(new Set(allRowIds));
                    } else {
                      handleSelectionChange(new Set());
                    }
                  }}
                  ariaLabel={selectableConfig?.selectAllLabel ?? "Select all rows"}
                />
              </TableHead>
            ) : null}

            {isExpandable && expandableConfig ? (
              <TableHead className="w-10 px-3 text-center" />
            ) : null}

            {columns.map((col) => {
              const canSort = isSortable && col.sortable;
              return (
                <TableHead
                  key={col.id}
                  sortable={canSort}
                  sortDirection={canSort ? resolveSortDir(col.id) : null}
                  onSort={canSort ? () => toggleSort(col.id) : undefined}
                >
                  {col.header}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody animatedSort={isSortable}>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={totalColSpan}
                className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]"
              >
                <span className="text-[length:var(--primitive-text-hint,0.6875rem)] text-[var(--muted-foreground)] sm:text-sm">
                  {emptyState ?? "No results found."}
                </span>
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row) => {
              const rowId = getRowId(row);
              const isSelected = effectiveSelectedIds.has(rowId);
              const isExpanded = expandedId === rowId;

              const handleSelectRow = (next: boolean) => {
                const nextSet = new Set(effectiveSelectedIds);
                if (next) {
                  nextSet.add(rowId);
                } else {
                  nextSet.delete(rowId);
                }
                handleSelectionChange(nextSet);
              };

              const handleExpandRow = (next: boolean) => {
                setExpandedId(next ? rowId : null);
              };

              return (
                <React.Fragment key={rowId || JSON.stringify(row)}>
                  <TableRow
                    selected={isSelectable && isSelected}
                    expanded={isExpandable && isExpanded}
                    selectable={isSelectable}
                    onSelectedChange={isSelectable ? handleSelectRow : undefined}
                    expandable={isExpandable && !!expandableConfig && !isSelectable}
                    onExpandedChange={
                      isExpandable && expandableConfig && !isSelectable
                        ? handleExpandRow
                        : undefined
                    }
                  >
                    {isSelectable ? (
                      <TableSelectCell
                        checked={isSelected}
                        onCheckedChange={(v) => handleSelectRow(v === true)}
                        ariaLabel={`Select ${getCellValue(row, columns[0])}`}
                      />
                    ) : null}

                    {isExpandable && expandableConfig ? (
                      <TableExpandTriggerCell
                        expanded={isExpanded}
                        onToggle={() => handleExpandRow(!isExpanded)}
                      />
                    ) : null}

                    {columns.map((col) => (
                      <TableCell key={col.id}>
                        {col.cell ? col.cell({ row }) : getCellValue(row, col)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {isExpandable && expandableConfig ? (
                    <TableExpandableContent open={isExpanded} colSpan={totalColSpan}>
                      {expandableConfig.renderExpanded(row)}
                    </TableExpandableContent>
                  ) : null}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>

      {isPaginated && totalPages > 1 ? (
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>
            Showing {(safePage - 1) * pageSize + 1} to{" "}
            {Math.min(safePage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <PaginationBar
            page={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : null}
    </div>
  );
}

/* ─── Export ────────────────────────────────────────────────── */

export const DataTable = DataTableInner as < TData extends Record< string, unknown>>(
  props: DataTableProps< TData>,
) => React.ReactElement;
