'use client';

import { AlertTriangle, CheckCircle2, Clock, List, Map, Users } from 'lucide-react';
import { useState } from 'react';
import { AlertsByAreaChart } from '@/components/dashboard/alerts-by-area-chart';
import { CoverageCard } from '@/components/dashboard/coverage-card';
import { NeighborhoodHeatmap } from '@/components/dashboard/neighborhood-heatmap';
import { NeighborhoodMap } from '@/components/dashboard/neighborhood-map';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSummary } from '@/hooks/use-summary';
import { cn } from '@/lib/utils';

type BairroView = 'mapa' | 'lista';

export function DashboardView() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useSummary();
  const [bairroView, setBairroView] = useState<BairroView>('mapa');

  const updatedAtLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Dashboard</h1>
          {updatedAtLabel && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Atualizado às {updatedAtLabel}
            </p>
          )}
        </div>
      </header>

      {isError && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm text-destructive">
              Não foi possível carregar o resumo. Tente novamente.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm font-medium text-primary hover:underline focus-ring rounded"
            >
              Recarregar
            </button>
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="sec-indicadores">
        <h2 id="sec-indicadores" className="sr-only">
          Indicadores principais
        </h2>
        {isLoading || !data ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              emphasis
              icon={AlertTriangle}
              tone="warning"
              value={data.com_alertas}
              label={
                data.com_alertas === 1
                  ? 'Criança precisa de acompanhamento'
                  : 'Crianças precisam de acompanhamento'
              }
              cta="Ver casos"
              href="/children?alertas=com"
            />
            <StatCard
              icon={Users}
              value={data.total_criancas}
              label="Crianças cadastradas"
              href="/children"
            />
            <StatCard
              icon={CheckCircle2}
              tone="success"
              value={data.revisadas}
              label="Casos revisados"
              meta={
                data.total_criancas > 0
                  ? `${Math.round((data.revisadas / data.total_criancas) * 100)}% concluído`
                  : undefined
              }
              href="/children?revisado=true"
            />
          </div>
        )}
      </section>

      <section aria-labelledby="sec-analises" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <h2 id="sec-analises" className="sr-only">
          Análises
        </h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alertas por área</CardTitle>
            <CardDescription>
              Crianças com pelo menos um alerta ativo em cada sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <AlertsByAreaChart data={data.alertas_por_area} />
            )}
          </CardContent>
        </Card>

        {isLoading || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <CoverageCard coverage={data.cobertura} total={data.total_criancas} />
        )}
      </section>

      <section aria-labelledby="sec-bairros">
        <h2 id="sec-bairros" className="sr-only">
          Distribuição por bairro
        </h2>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="text-base">Distribuição por bairro</CardTitle>
                <CardDescription>
                  Intensidade representa a proporção de crianças com alertas. Listras
                  indicam bairros com lacunas de cobertura. Clique para filtrar a lista.
                </CardDescription>
              </div>
              <div className="inline-flex shrink-0 rounded-md border p-0.5" role="group" aria-label="Visualização">
                {(
                  [
                    { id: 'mapa', label: 'Mapa', icon: Map },
                    { id: 'lista', label: 'Lista', icon: List },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setBairroView(id)}
                    aria-pressed={bairroView === id}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors focus-ring',
                      bairroView === id
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : bairroView === 'mapa' ? (
              <NeighborhoodMap data={data.por_bairro} />
            ) : (
              <NeighborhoodHeatmap data={data.por_bairro} />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
