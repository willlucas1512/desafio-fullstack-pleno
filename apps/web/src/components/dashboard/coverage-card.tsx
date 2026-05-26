import { GraduationCap, HandHeart, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Coverage } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  coverage: Coverage;
  total: number;
}

export function CoverageCard({ coverage, total }: Props) {
  const rows = [
    { label: 'Saúde', value: coverage.com_saude, icon: Heart, tone: 'text-rose-500' },
    { label: 'Educação', value: coverage.com_educacao, icon: GraduationCap, tone: 'text-blue-500' },
    {
      label: 'Assistência social',
      value: coverage.com_assistencia_social,
      icon: HandHeart,
      tone: 'text-emerald-500',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Cobertura por área</CardTitle>
        <CardDescription>
          Quantas crianças têm registro em cada sistema. Lacunas indicam falhas de
          cadastro — não significam &ldquo;tudo certo&rdquo;.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(({ label, value, icon: Icon, tone }) => {
          const pct = total > 0 ? value / total : 0;
          return (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', tone)} aria-hidden="true" />
                  {label}
                </span>
                <span className="font-medium">
                  {value} / {total}
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label={`${label}: ${value} de ${total}`}
              >
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
            </div>
          );
        })}
        {coverage.sem_nenhuma_area > 0 && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            {coverage.sem_nenhuma_area}{' '}
            {coverage.sem_nenhuma_area === 1
              ? 'criança sem registro em nenhuma área.'
              : 'crianças sem registro em nenhuma área.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
