import { ChevronLeft, ChevronRight, FileX2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { SkeletonTableRows } from "../feedback/Skeleton";

// ── Pagination ────────────────────────────────────────────────────────────────

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function TablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: TablePaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <span>
        {total === 0 ? "Sin resultados" : `${from}–${to} de ${total}`}
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded p-1 hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded p-1 hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Primitives ────────────────────────────────────────────────────────────────

export function Tr({
  className,
  hover = false,
  ref,
  ...props
}: ComponentProps<"tr"> & { hover?: boolean }) {
  return (
    <tr
      ref={ref}
      className={cn(
        hover && "cursor-default transition-colors hover:bg-accent/60",
        className,
      )}
      {...props}
    />
  );
}

export type TdVariant = "default" | "primary" | "muted" | "mono";

export function Td({
  className,
  variant = "default",
  align = "left",
  ref,
  ...props
}: ComponentProps<"td"> & {
  variant?: TdVariant;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      ref={ref}
      className={cn(
        "px-4 py-3",
        variant === "primary" && "font-medium text-foreground",
        variant === "muted" && "text-muted-foreground",
        variant === "mono" && "font-mono text-xs text-muted-foreground",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...props}
    />
  );
}

export function Th({
  className,
  align = "left",
  ref,
  ...props
}: ComponentProps<"th"> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      ref={ref}
      className={cn(
        "px-4 py-3 font-semibold",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ref,
  ...props
}: ComponentProps<"thead">) {
  return (
    <thead
      ref={ref}
      className={cn(
        "bg-muted text-xs uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ref,
  ...props
}: ComponentProps<"tbody">) {
  return (
    <tbody
      ref={ref}
      className={cn("divide-y divide-border", className)}
      {...props}
    />
  );
}

// ── ColDef — string (backward compat) or rich object ─────────────────────────

export type ColDef =
  | string
  | { label: string; align?: "left" | "right" | "center"; width?: string };

// ── DataTable compound ────────────────────────────────────────────────────────

export function DataTable({
  headers,
  children,
  className,
  pagination,
  fillHeight = false,
  isLoading = false,
  loadingLabel = "Cargando datos…",
}: {
  headers: ColDef[];
  children: ReactNode;
  className?: string;
  pagination?: TablePaginationProps;
  isLoading?: boolean;
  loadingLabel?: string;
  /**
   * When true, the table fills its parent's bounded height (parent must supply
   * flex-1 min-h-0 or equivalent). The body scrolls internally; pagination stays
   * fixed at the bottom. Use on full-height list pages.
   *
   * When false (default), the table grows to its natural content height and the
   * page scrolls.
   */
  fillHeight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      {isLoading && <span role="status" className="sr-only">{loadingLabel}</span>}
      <div className={fillHeight ? "flex-1 min-h-0 overflow-auto" : "overflow-x-auto"}>
        <table aria-busy={isLoading || undefined} className="w-full min-w-190 border-collapse text-left text-sm">
          <TableHead className="sticky top-0 z-10">
            <tr>
              {headers.map((header) => {
                const label =
                  typeof header === "string" ? header : header.label;
                const align =
                  typeof header === "string"
                    ? "left"
                    : (header.align ?? "left");
                const width =
                  typeof header === "string" ? undefined : header.width;
                return (
                  <Th
                    key={label}
                    align={align}
                    style={width ? { width } : undefined}
                  >
                    {label}
                  </Th>
                );
              })}
            </tr>
          </TableHead>
          <TableBody>{isLoading ? <SkeletonTableRows rows={6} cols={headers.length} /> : children}</TableBody>
        </table>
      </div>
      {pagination && !isLoading && (
        <div className="shrink-0">
          <TablePagination {...pagination} />
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <div className="max-w-sm">
        <div className="mb-3 flex justify-center text-muted-foreground/50 [&_svg]:size-10">
          {icon ?? <FileX2 />}
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}

/**
 * Muestra una ruta truncando el prefijo (directorio) y dejando visible el sufijo (nombre de archivo).
 * Útil para rutas largas en tablas donde lo importante está al final.
 *
 * @example <TruncatePath path="org/customer/docs/factura-2024.pdf" />
 * → org/customer/docs/  [truncado]  factura-2024.pdf
 */
export function TruncatePath({
  path,
  separator = "/",
  className,
}: {
  path: string;
  separator?: string;
  className?: string;
}) {
  const lastIndex = path.lastIndexOf(separator);

  if (lastIndex === -1) {
    return (
      <span className={cn("truncate font-mono text-xs", className)}>
        {path}
      </span>
    );
  }

  const prefix = path.slice(0, lastIndex + 1);
  const suffix = path.slice(lastIndex + 1);

  return (
    <span className={cn("flex min-w-0 font-mono text-xs", className)}>
      <span className="min-w-0 truncate opacity-50">{prefix}</span>
      <span className="shrink-0">{suffix}</span>
    </span>
  );
}
