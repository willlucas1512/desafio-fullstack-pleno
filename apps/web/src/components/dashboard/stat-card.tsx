import type { LucideIcon } from 'lucide-react';
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

export function StatCard({
  label,
  value,
  total,
  icon: Icon,
  tone = 'default',
  href,
  description,
}: StatCardProps) {
  const body = (
    <Card
      className={cn(
        'transition-shadow',
        href && 'cursor-pointer hover:shadow-md focus-within:ring-2 focus-within:ring-ring',
      )}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
            TONE_STYLES[tone],
          )}
          aria-hidden="true"
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold leading-tight">
            {value}
            {typeof total === 'number' && (
              <span className="ml-1 text-base font-normal text-muted-foreground">/ {total}</span>
            )}
          </p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
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
