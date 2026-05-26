'use client';

import { AlertTriangle, CheckCircle2, Users, UserX } from 'lucide-react';
import { AlertsByAreaChart } from '@/components/dashboard/alerts-by-area-chart';
import { CoverageCard } from '@/components/dashboard/coverage-card';
import { NeighborhoodHeatmap } from '@/components/dashboard/neighborhood-heatmap';
import { ReviewStatusChart } from '@/components/dashboard/review-status-chart';
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

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useSummary();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral do acompanhamento de crianças em situação de vulnerabilidade.
        </p>
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

      <section aria-label="Indicadores principais">
        {isLoading || !data ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total de crianças"
              value={data.total_criancas}
              icon={Users}
              href="/children"
            />
            <StatCard
              label="Com alertas ativos"
              value={data.com_alertas}
              total={data.total_criancas}
              icon={AlertTriangle}
              tone="warning"
              href="/children?alertas=com"
            />
            <StatCard
              label="Sem dados em nenhuma área"
              value={data.sem_dados}
              total={data.total_criancas}
              icon={UserX}
              tone="destructive"
              description="Lacunas de cobertura"
            />
            <StatCard
              label="Casos já revisados"
              value={data.revisadas}
              total={data.total_criancas}
              icon={CheckCircle2}
              tone="success"
              href="/children?revisado=true"
            />
          </div>
        )}
      </section>

      <section
        aria-label="Distribuição de alertas e revisões"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status de revisão</CardTitle>
            <CardDescription>
              Quanto do acompanhamento já foi marcado como revisado pelo técnico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ReviewStatusChart
                revisadas={data.revisadas}
                pendentes={data.pendentes_revisao}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-label="Cobertura e bairros" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {isLoading || !data ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <CoverageCard coverage={data.cobertura} total={data.total_criancas} />
          )}
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribuição por bairro</CardTitle>
              <CardDescription>
                Intensidade representa a proporção de crianças com alertas. Listras
                indicam bairros com lacunas de cobertura. Clique para filtrar a lista.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !data ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <NeighborhoodHeatmap data={data.por_bairro} />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
