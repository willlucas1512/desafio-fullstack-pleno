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
  saude: '#e11d48', // rose-600 — bate com Heart icon
  educacao: '#2563eb', // blue-600 — bate com GraduationCap
  assistencia_social: '#059669', // emerald-600 — bate com HandHeart
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
        <BarChart data={series} margin={{ top: 24, right: 10, bottom: 0, left: -16 }}>
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
