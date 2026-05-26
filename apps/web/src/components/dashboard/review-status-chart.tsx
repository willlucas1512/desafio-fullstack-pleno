'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  revisadas: number;
  pendentes: number;
}

export function ReviewStatusChart({ revisadas, pendentes }: Props) {
  const total = revisadas + pendentes;
  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Nenhuma criança cadastrada.
      </div>
    );
  }

  const data = [
    { name: 'Revisadas', value: revisadas, color: 'hsl(var(--success))' },
    { name: 'Pendentes', value: pendentes, color: 'hsl(var(--muted-foreground))' },
  ];

  return (
    <div
      className="relative h-64 w-full"
      role="img"
      aria-label={`${revisadas} de ${total} crianças revisadas`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="hsl(var(--background))" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              color: 'hsl(var(--popover-foreground))',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold leading-none">
          {Math.round((revisadas / total) * 100)}%
        </span>
        <span className="text-xs text-muted-foreground">revisadas</span>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-success" aria-hidden="true" />
          Revisadas ({revisadas})
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full bg-muted-foreground"
            aria-hidden="true"
          />
          Pendentes ({pendentes})
        </span>
      </div>
    </div>
  );
}
