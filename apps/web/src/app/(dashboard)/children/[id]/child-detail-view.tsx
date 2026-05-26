'use client';

import axios from 'axios';
import { ArrowLeft, Cake, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import { EducationCard } from '@/components/children/education-card';
import { HealthCard } from '@/components/children/health-card';
import { ReviewAction } from '@/components/children/review-action';
import { SocialCard } from '@/components/children/social-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useChild } from '@/hooks/use-children';
import { ageInYears, formatDateBR } from '@/lib/format';

export function ChildDetailView({ id }: { id: string }) {
  const { data: child, isLoading, isError, error, refetch } = useChild(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (isError) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p className="text-sm text-destructive">
            {status === 404
              ? 'Criança não encontrada.'
              : 'Não foi possível carregar os dados desta criança.'}
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/children">Voltar à lista</Link>
            </Button>
            {status !== 404 && (
              <Button onClick={() => refetch()}>Tentar novamente</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!child) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/children" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <header className="rounded-lg border bg-card p-4">
        <h1 className="text-2xl font-bold tracking-tight">{child.nome}</h1>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Cake className="h-4 w-4" aria-hidden="true" />
            <dt className="sr-only">Idade e nascimento</dt>
            <dd>
              {ageInYears(child.data_nascimento)} anos · nasc. {formatDateBR(child.data_nascimento)}
            </dd>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <dt className="sr-only">Bairro</dt>
            <dd>{child.bairro}</dd>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" aria-hidden="true" />
            <dt className="sr-only">Responsável</dt>
            <dd>{child.responsavel}</dd>
          </div>
        </dl>
      </header>

      <ReviewAction child={child} />

      <section
        aria-label="Situação por área"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <HealthCard data={child.saude} />
        <EducationCard data={child.educacao} />
        <SocialCard data={child.assistencia_social} />
      </section>
    </div>
  );
}
