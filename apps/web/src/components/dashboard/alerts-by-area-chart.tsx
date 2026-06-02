'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AREA_LABEL } from '@/lib/format';
import type { AlertsByArea } from '@/lib/types';

const AREA_COLORS = {
  saude: 'hsl(var(--chart-1))', // navy escuro
  educacao: 'hsl(var(--chart-2))', // azul médio
  assistencia_social: 'hsl(var(--chart-3))', // ciano/teal
} as const;

export function AlertsByAreaChart({ data }: { data: AlertsByArea }) {
  const series = [
    { key: 'saude', area: AREA_LABEL.saude, value: data.saude, color: AREA_COLORS.saude },
    { key: 'educacao', area: AREA_LABEL.educacao, value: data.educacao, color: AREA_COLORS.educacao },
    {
      key: 'assistencia_social',
      area: AREA_LABEL.assistencia_social,
      value: data.assistencia_social,
      color: AREA_COLORS.assistencia_social,
    },
  ];

  return (
    <div className="h-64 w-full" role="img" aria-label="Quantidade de crianças com alerta por área">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 24, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="area"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            width={26}
            allowDecimals={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              color: 'hsl(var(--popover-foreground))',
            }}
            labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Com alertas">
            {series.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              className="fill-foreground"
              style={{ fontSize: 13, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
