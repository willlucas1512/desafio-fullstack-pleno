"use client";

import Link from "next/link";
import { httpStatus } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChildDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

export function ChildDetailError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const notFound = httpStatus(error) === 404;
  return (
    <Card>
      <CardContent className="space-y-3 p-6 text-center">
        <p className="text-sm text-destructive">
          {notFound
            ? "Criança não encontrada."
            : "Não foi possível carregar os dados desta criança."}
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/children">Voltar à lista</Link>
          </Button>
          {!notFound && <Button onClick={onRetry}>Tentar novamente</Button>}
        </div>
      </CardContent>
    </Card>
  );
}
