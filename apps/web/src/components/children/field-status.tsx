import { Check, X } from "lucide-react";
import type { FieldTone } from "@/lib/field-status";
import { cn } from "@/lib/utils";

export function FieldStatus({
  tone,
  children,
}: {
  tone: FieldTone;
  children: React.ReactNode;
}) {
  if (tone === "neutral") return <>{children}</>;
  const good = tone === "good";
  const Icon = good ? Check : X;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        good
          ? "text-muted-foreground dark:text-foreground/80"
          : "text-destructive",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}
