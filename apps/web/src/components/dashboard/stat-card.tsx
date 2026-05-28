import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: number;
  total?: number;
  icon: LucideIcon;
  tone?: 'default' | 'warning' | 'destructive' | 'success' | 'muted';
  href?: string;
  description?: string;
}

const TONE_STYLES = {
  default: 'text-primary bg-primary/10',
  warning: 'text-warning bg-warning/10',
  destructive: 'text-destructive bg-destructive/10',
  success: 'text-success bg-success/10',
  muted: 'text-muted-foreground bg-muted',
} as const;

const ACCENT_RING = {
  default: 'group-hover:border-primary/40',
  warning: 'group-hover:border-warning/40',
  destructive: 'group-hover:border-destructive/40',
  success: 'group-hover:border-success/40',
  muted: 'group-hover:border-muted-foreground/30',
} as const;

export function StatCard({
  label,
  value,
  total,
  icon: Icon,
  tone = 'default',
  href,
  description,
}: StatCardProps) {
  const ratio = typeof total === 'number' && total > 0 ? Math.round((value / total) * 100) : null;

  const body = (
    <Card
      className={cn(
        'group relative h-full overflow-hidden transition-all',
        href && [
          'cursor-pointer',
          'hover:-translate-y-0.5 hover:shadow-md',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          ACCENT_RING[tone],
        ],
      )}
    >
      <CardContent className="flex items-start gap-4 p-5">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            TONE_STYLES[tone],
          )}
          aria-hidden="true"
        >
          <Icon className="h-6 w-6" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 flex items-baseline gap-1.5 leading-none">
            <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
            {typeof total === 'number' && (
              <span className="text-sm font-normal text-muted-foreground">/ {total}</span>
            )}
            {ratio !== null && (
              <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {ratio}%
              </span>
            )}
          </p>
          {description && (
            <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {href && (
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
