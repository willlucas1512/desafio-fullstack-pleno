'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AREA_LABEL } from '@/lib/format';
import type { AlertsByArea } from '@/lib/types';

export function AlertsByAreaChart({ data }: { data: AlertsByArea }) {
  const series = [
    { area: AREA_LABEL.saude, value: data.saude },
    { area: AREA_LABEL.educacao, value: data.educacao },
    { area: AREA_LABEL.assistencia_social, value: data.assistencia_social },
  ];

  return (
    <div className="h-64 w-full" role="img" aria-label="Quantidade de crianças com alerta por área">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 10, right: 10, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="area" tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              color: 'hsl(var(--popover-foreground))',
            }}
          />
          <Bar dataKey="value" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} name="Com alertas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
