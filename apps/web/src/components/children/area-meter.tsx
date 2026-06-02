import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Medidor de progresso (ex.: frequência vs. mínimo).
export function AreaMeter({
  label,
  value,
  min,
  icon: Icon,
}: {
  label: string;
  value: number;
  min: number;
  icon: LucideIcon;
}) {
  const below = value < min;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-inset ring-border">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div>
          <span className="block text-xs text-muted-foreground">{label}</span>
          <span className="mt-0.5 block font-semibold">
            <span className={below ? "text-destructive" : "text-success"}>
              {value}%
            </span>
            <span className="ml-1 font-normal text-muted-foreground">
              / {min}% mínimo
            </span>
          </span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${value}% (mínimo ${min}%)`}
        >
          <div
            className={cn(
              "h-full rounded-full",
              below ? "bg-destructive" : "bg-success",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
