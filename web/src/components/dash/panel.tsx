import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The one container every screen uses: hairline border, soft top-light, consistent header. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  padded = true,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-card shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]",
        className,
      )}
    >
      {title || action ? (
        <header className="flex items-start justify-between gap-4 px-5 pt-4">
          <div className="min-w-0">
            {title ? <h2 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn(padded && "px-5 pb-5", title || action ? "pt-4" : "pt-5", bodyClassName)}>{children}</div>
    </section>
  );
}
