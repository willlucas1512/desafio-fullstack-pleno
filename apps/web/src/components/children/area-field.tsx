import type { LucideIcon } from "lucide-react";

export function AreaFields({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
      {children}
    </dl>
  );
}

export function AreaField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-inset ring-border">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-semibold text-foreground">{children}</dd>
      </div>
    </div>
  );
}
