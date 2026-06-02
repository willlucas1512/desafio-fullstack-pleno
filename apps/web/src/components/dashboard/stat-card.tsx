import { ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "destructive" | "success" | "muted";
  href?: string;
  meta?: string;
  cta?: string;
  emphasis?: boolean;
}

const ICON_STYLES = {
  default: "text-primary bg-primary/10",
  warning: "text-warning bg-warning/15",
  destructive: "text-destructive bg-destructive/10",
  success: "text-success bg-success/10",
  muted: "text-muted-foreground bg-muted",
} as const;

const EMPHASIS_STYLES = {
  default: "border-primary/40 bg-primary/5",
  warning: "border-warning/50 bg-warning/[0.07]",
  destructive: "border-destructive/40 bg-destructive/5",
  success: "border-success/40 bg-success/5",
  muted: "border-muted-foreground/30 bg-muted/40",
} as const;

const HOVER_RING = {
  default: "group-hover:border-primary/40",
  warning: "group-hover:border-warning/50",
  destructive: "group-hover:border-destructive/40",
  success: "group-hover:border-success/40",
  muted: "group-hover:border-muted-foreground/30",
} as const;

const CTA_TONE = {
  default: "text-primary",
  warning: "text-warning",
  destructive: "text-destructive",
  success: "text-success",
  muted: "text-foreground",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  href,
  meta,
  cta,
  emphasis = false,
}: StatCardProps) {
  const body = (
    <Card
      className={cn(
        "group relative h-full overflow-hidden transition-all",
        emphasis && cn("shadow-sm", EMPHASIS_STYLES[tone]),
        href && [
          "cursor-pointer",
          "hover:-translate-y-0.5 hover:shadow-md",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          !emphasis && HOVER_RING[tone],
        ],
      )}
    >
      <CardContent className="flex h-full items-start gap-4 p-5">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl",
            emphasis ? "h-12 w-12" : "h-11 w-11",
            ICON_STYLES[tone],
          )}
          aria-hidden="true"
        >
          <Icon
            className={emphasis ? "h-6 w-6" : "h-5 w-5"}
            strokeWidth={2.25}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              "font-bold leading-none tracking-tight text-foreground",
              emphasis ? "text-4xl" : "text-3xl",
            )}
          >
            {value}
          </span>
          <p
            className={cn(
              "mt-2 text-sm leading-snug",
              emphasis
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {label}
          </p>
          {meta && <p className="mt-1 text-xs text-muted-foreground">{meta}</p>}
          {cta && href && (
            <span
              className={cn(
                "mt-3 inline-flex items-center gap-1 text-sm font-semibold",
                CTA_TONE[tone],
              )}
            >
              {cta}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          )}
        </div>
        {href && !cta && (
          <ArrowUpRight
            className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary"
            aria-hidden="true"
          />
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none">
        {body}
      </Link>
    );
  }
  return body;
}
