"use client";

/**
 * Command, Base UI Autocomplete (inline) + Dialog foundation (Phase 5).
 *
 * The picker uses Base UI Autocomplete with `inline open mode="none"` so it
 * renders as a flat filterable list, filtering, keyboard nav, and highlight
 * come from Base UI while the Wensity nested-page stack lives outside as
 * plain React state. Backspace on an empty query and Escape both pop the
 * submenu stack before closing.
 *
 * D-17: CommandDialog onOpenChange → (open: boolean) => void. Dialog.Trigger
 * uses asChild → render + nativeButton host match, matching Dialog.tsx.
 */

import * as React from "react";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  IconArrowLeft,
  IconChevronRight,
  IconCornerDownLeft,
  IconSearch,
} from "@tabler/icons-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const commandDialogSurfaceClass = cn(
  "border border-[var(--border)] bg-[color:var(--primitive-surface-elevated,var(--card))] text-[var(--foreground)]",
  "[box-shadow:var(--primitive-shadow-modal,0_1px_2px_rgba(0,0,0,0.1),0_24px_64px_-28px_rgba(0,0,0,0.5))]",
  "isolate overflow-hidden rounded-[var(--primitive-radius-surface,1rem)]",
);

const backdropClass = cn(
  "fixed inset-0 z-[var(--primitive-z-overlay,100)] bg-[color:var(--primitive-backdrop,rgba(0,0,0,0.6))]",
  "transition-opacity duration-[120ms] ease-out",
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
  "motion-reduce:transition-none",
);

/**
 * Command palettes are opened hundreds of times a day, often via keyboard
 * shortcut, per Emil Kowalski's frequency rule, high-frequency/keyboard
 * actions get no meaningful animation. Opacity-only, ~80ms, nearly
 * imperceptible rather than a jarring cut.
 */
const popupMotionClass = cn(
  "transition-opacity duration-[80ms] ease-out",
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
  "motion-reduce:transition-none",
);

function adaptOpenChange(
  onOpenChange?: (open: boolean) => void,
): ((open: boolean, details: unknown) => void) | undefined {
  if (!onOpenChange) return undefined;
  return (open) => onOpenChange(open);
}

export type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  keywords?: string[];
  disabled?: boolean;
  onSelect?: () => void;
  /** Opens a submenu page instead of selecting when set. */
  items?: CommandGroup[];
  /** Heading shown at the top of the submenu page this item opens. */
  pageTitle?: string;
};

export type CommandGroup = {
  heading?: string;
  items: CommandItem[];
};

export interface CommandProps {
  groups: CommandGroup[];
  placeholder?: string;
  emptyMessage?: React.ReactNode;
  /** Client-side filter against label/description/keywords. */
  filter?: boolean;
  onSelect?: (item: CommandItem) => void;
  /** Reports live query/nesting state, used by `CommandDialog` to decide whether Escape should back out of a submenu instead of closing. */
  onNavigationStateChange?: (state: { hasQuery: boolean; isNested: boolean }) => void;
  autoFocus?: boolean;
  showHints?: boolean;
  className?: string;
  listClassName?: string;
  "aria-label"?: string;
}

type CommandPage = {
  title?: string;
  groups: CommandGroup[];
};

function matchesQuery(item: CommandItem, query: string) {
  if (!query) return true;
  const haystack = [item.label, item.description, item.id, ...(item.keywords ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function filterPageGroups(groups: CommandGroup[], query: string): CommandGroup[] {
  if (!query) return groups;
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => matchesQuery(item, query)),
    }))
    .filter((group) => group.items.length > 0);
}

function KeyCap({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-[var(--primitive-radius-control-sm,0.625rem)] border border-[var(--border)] px-1",
        "bg-[color-mix(in_srgb,var(--foreground)_4%,var(--background))] font-[family-name:var(--primitive-font-mono,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace)] text-[11px] font-medium leading-none text-[var(--muted-foreground)]",
      )}
    >
      {children}
    </kbd>
  );
}

export function Command({
  groups,
  placeholder = "Search...",
  emptyMessage = "No results found.",
  filter = true,
  onSelect,
  onNavigationStateChange,
  autoFocus = false,
  showHints = true,
  className,
  listClassName,
  "aria-label": ariaLabel = "Command menu",
}: CommandProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [pages, setPages] = React.useState<CommandPage[]>([{ groups }]);
  const [query, setQuery] = React.useState("");

  // New `groups` means a new command set, so any nested page the user drilled
  // into no longer exists. Reset during render (React's documented pattern for
  // deriving state from props) instead of in an effect, which rendered one
  // frame of the stale page first.
  const [lastGroups, setLastGroups] = React.useState(groups);
  if (groups !== lastGroups) {
    setLastGroups(groups);
    setPages([{ groups }]);
  }

  const currentPage = pages[pages.length - 1]!;
  const isNested = pages.length > 1;
  const filterQuery = filter ? query.trim().toLowerCase() : "";
  const filteredGroups = React.useMemo(
    () => filterPageGroups(currentPage.groups, filterQuery),
    [currentPage, filterQuery],
  );
  const hasResults = filteredGroups.some((group) => group.items.length > 0);

  React.useEffect(() => {
    onNavigationStateChange?.({ hasQuery: query.trim().length > 0, isNested });
  }, [isNested, onNavigationStateChange, query]);

  React.useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const goBack = React.useCallback(() => {
    if (pages.length <= 1) return;
    setPages((current) => current.slice(0, -1));
    setQuery("");
  }, [pages.length]);

  const selectItem = React.useCallback(
    (item: CommandItem) => {
      if (item.disabled) return;

      if (item.items && item.items.length > 0) {
        setPages((current) => [
          ...current,
          { title: item.pageTitle ?? item.label, groups: item.items! },
        ]);
        setQuery("");
        // Keep focus on the input so the user can keep typing into the new page.
        requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
        return;
      }

      item.onSelect?.();
      onSelect?.(item);
    },
    [onSelect],
  );

  const handleInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        if (query) {
          // Clear query first, do not let the surrounding Dialog close.
          event.preventDefault();
          event.stopPropagation();
          setQuery("");
          return;
        }
        if (isNested) {
          event.preventDefault();
          event.stopPropagation();
          goBack();
        }
        return;
      }

      if (event.key === "Backspace" && !query && isNested) {
        event.preventDefault();
        goBack();
      }
    },
    [goBack, isNested, query],
  );

  return (
    <Autocomplete.Root
      inline
      open
      mode="none"
      value={query}
      onValueChange={(next) => setQuery(next)}
      autoHighlight="always"
      keepHighlight
    >
      <div data-wensity-primitive="" data-wensity-command="" className={cn("flex flex-col", className)}>
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3.5">
          {isNested ? (
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className={cn(
                "-ml-1 inline-flex size-6 shrink-0 items-center justify-center rounded-[var(--primitive-radius-control-sm,0.625rem)] text-[var(--muted-foreground)]",
                "transition-colors duration-100 ease-out hover:bg-[color:var(--primitive-surface-hover,color-mix(in_srgb,var(--foreground)_4%,transparent))] hover:text-[var(--foreground)]",
              )}
            >
              <IconArrowLeft stroke={1.75} className="size-4" />
            </button>
          ) : (
            <IconSearch
              stroke={1.75}
              aria-hidden="true"
              className="size-4 shrink-0 text-[var(--muted-foreground)]"
            />
          )}

          <Autocomplete.Input
            ref={inputRef}
            aria-label={ariaLabel}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={
              currentPage.title ? `Search in ${currentPage.title}...` : placeholder
            }
            onKeyDown={handleInputKeyDown}
            className={cn(
              "h-12 w-full min-w-0 border-0 bg-transparent text-[14px] text-[var(--foreground)] outline-none",
              "placeholder:text-[color:var(--primitive-text-placeholder,var(--muted-foreground))]",
            )}
          />
        </div>

        <Autocomplete.List
          className={cn(
            "max-h-[22rem] overflow-y-auto overscroll-contain p-1.5 outline-none",
            listClassName,
          )}
        >
          {hasResults ? (
            filteredGroups.map((group, groupIndex) => (
              <Autocomplete.Group
                key={group.heading ?? groupIndex}
                className={groupIndex > 0 ? "mt-1" : undefined}
              >
                {group.heading ? (
                  <Autocomplete.GroupLabel className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--muted-foreground)]">
                    {group.heading}
                  </Autocomplete.GroupLabel>
                ) : null}
                {group.items.map((item) => (
                  <Autocomplete.Item
                    key={item.id}
                    value={item.id}
                    disabled={item.disabled}
                    onClick={() => selectItem(item)}
                    className={cn(
                      "flex w-full min-h-9 cursor-default select-none items-center gap-2.5 rounded-[var(--primitive-radius-item,0.625rem)] px-2.5 py-2 text-left outline-none",
                      "text-[13.5px] text-[var(--foreground)] transition-colors duration-100 ease-out",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                      "data-[highlighted]:bg-[color:var(--primitive-surface-selected,color-mix(in_srgb,var(--foreground)_6%,transparent))]",
                    )}
                  >
                    {item.icon ? (
                      <span className="inline-flex size-4 shrink-0 items-center justify-center text-[var(--muted-foreground)] [&_svg]:size-4">
                        {item.icon}
                      </span>
                    ) : null}
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span className="min-w-0 truncate font-medium tracking-[-0.005em]">
                        {item.label}
                      </span>
                      {item.description ? (
                        <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--muted-foreground)]">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                    {item.items && item.items.length > 0 ? (
                      <IconChevronRight
                        stroke={1.75}
                        className="size-3.5 shrink-0 text-[var(--muted-foreground)]"
                      />
                    ) : item.shortcut && item.shortcut.length > 0 ? (
                      <span className="flex shrink-0 items-center gap-1">
                        {item.shortcut.map((key, keyIndex) => (
                          <KeyCap key={keyIndex}>{key}</KeyCap>
                        ))}
                      </span>
                    ) : null}
                  </Autocomplete.Item>
                ))}
              </Autocomplete.Group>
            ))
          ) : (
            <div
              role="status"
              className="px-3 py-8 text-center text-[13px] text-[var(--muted-foreground)]"
            >
              {emptyMessage}
            </div>
          )}
        </Autocomplete.List>

        {showHints ? (
          <div className="flex items-center gap-3 border-t border-[var(--border)] px-3.5 py-2 text-[11px] text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <KeyCap>
                <IconCornerDownLeft stroke={2} className="size-2.5" />
              </KeyCap>
              Select
            </span>
            <span className="inline-flex items-center gap-1.5">
              <KeyCap>↑</KeyCap>
              <KeyCap>↓</KeyCap>
              Navigate
            </span>
            {isNested ? (
              <span className="inline-flex items-center gap-1.5">
                <KeyCap>esc</KeyCap>
                Back
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Autocomplete.Root>
  );
}

export interface CommandDialogProps extends CommandProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  /** Global shortcut that toggles the dialog, e.g. `{ key: "k", meta: true }`. */
  shortcut?: { key: string; meta?: boolean; ctrl?: boolean };
  /** Close the dialog after a leaf item is selected. */
  closeOnSelect?: boolean;
}

function useControllableOpen(
  controlled: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange?: (open: boolean) => void,
) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const open = controlled ?? uncontrolled;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (controlled === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );
  return [open, setOpen] as const;
}

export function CommandDialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  shortcut,
  closeOnSelect = true,
  onSelect,
  ...commandProps
}: CommandDialogProps) {
  const [open, setOpen] = useControllableOpen(openProp, defaultOpen, onOpenChange);

  React.useEffect(() => {
    if (!shortcut) return;

    function handleKeyDown(event: KeyboardEvent) {
      const key = shortcut!.key.toLowerCase();
      const metaOk = shortcut!.meta ? event.metaKey : true;
      const ctrlOk = shortcut!.ctrl ? event.ctrlKey : true;
      if (event.key.toLowerCase() === key && metaOk && ctrlOk) {
        event.preventDefault();
        setOpen(!open);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen, shortcut]);

  const renderTrigger = () => {
    if (!trigger) return null;
    if (React.isValidElement(trigger)) {
      const nativeButton =
        typeof trigger.type === "string" ? trigger.type === "button" : true;
      return (
        <BaseDialog.Trigger
          nativeButton={nativeButton}
          render={trigger as React.ReactElement}
        />
      );
    }
    return <BaseDialog.Trigger>{trigger}</BaseDialog.Trigger>;
  };

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={adaptOpenChange(setOpen)}
      modal
    >
      {renderTrigger()}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={backdropClass} />
        <BaseDialog.Viewport
          className={cn(
            "fixed inset-0 z-[var(--primitive-z-overlay,100)] flex items-start justify-center p-4 pt-[18vh] outline-none",
          )}
        >
          <BaseDialog.Popup data-wensity-primitive=""
            className={cn(
              "relative w-[calc(100vw-2rem)] max-w-[500px] outline-none",
              commandDialogSurfaceClass,
              popupMotionClass,
            )}
          >
            <BaseDialog.Title className="sr-only">Command menu</BaseDialog.Title>
            <Command
              {...commandProps}
              autoFocus
              onSelect={(item) => {
                onSelect?.(item);
                if (closeOnSelect) setOpen(false);
              }}
            />
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
