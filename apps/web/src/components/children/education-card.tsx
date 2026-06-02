import {
  AlertTriangle,
  CalendarCheck,
  GraduationCap,
  School,
} from "lucide-react";
import { EmptyArea } from "@/components/status/empty-area";
import { resolveFieldStatus } from "@/lib/field-status";
import type { EducationInfo } from "@/lib/types";
import { AreaCardShell } from "./area-card-shell";
import { AreaField, AreaFields } from "./area-field";
import { AreaMeter } from "./area-meter";

const FREQUENCIA_MINIMA = 75;

export function EducationCard({ data }: { data: EducationInfo | null }) {
  if (!data) return <EmptyArea area="educacao" />;

  const matricula = resolveFieldStatus(
    data.alertas,
    [{ code: "matricula_pendente", label: "Matrícula pendente" }],
    { tone: "neutral", label: "" },
  );

  const frequenciaBaixa =
    data.frequencia_percent !== null &&
    data.frequencia_percent < FREQUENCIA_MINIMA;

  return (
    <AreaCardShell
      title="Educação"
      icon={GraduationCap}
      state={data.alertas.length > 0 || frequenciaBaixa ? "alert" : "ok"}
    >
      <AreaFields>
        <AreaField label="Escola" icon={School}>
          <span className="inline-flex flex-col items-start">
            <span>
              {data.escola ?? (
                <span className="italic text-muted-foreground">
                  Não informada
                </span>
              )}
            </span>
            {matricula.tone === "bad" && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-normal text-destructive">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                {matricula.label}
              </span>
            )}
          </span>
        </AreaField>
        {data.frequencia_percent === null ? (
          <AreaField label="Frequência" icon={CalendarCheck}>
            <span className="italic text-muted-foreground">—</span>
          </AreaField>
        ) : (
          <AreaMeter
            label="Frequência"
            value={data.frequencia_percent}
            min={FREQUENCIA_MINIMA}
            icon={CalendarCheck}
          />
        )}
      </AreaFields>
    </AreaCardShell>
  );
}
