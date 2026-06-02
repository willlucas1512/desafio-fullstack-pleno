import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleSummary } from "@/test/fixtures";
import { CoverageCard } from "./coverage-card";

describe("CoverageCard", () => {
  it("mostra a cobertura por area e um alerta quando ha pelo menos uma crianca totalmente sem cobertura", () => {
    render(
      <CoverageCard
        coverage={sampleSummary.cobertura}
        total={sampleSummary.total_criancas}
      />,
    );
    expect(screen.getByText(/Saúde/i)).toBeInTheDocument();
    expect(screen.getByText(/Educação/i)).toBeInTheDocument();
    expect(screen.getByText(/Assistência social/i)).toBeInTheDocument();
    expect(
      screen.getByText(/sem registro em nenhuma área/i),
    ).toBeInTheDocument();
  });

  it("omite o callout quando nenhuma crianca está totalmente sem cobertura", () => {
    render(
      <CoverageCard
        coverage={{ ...sampleSummary.cobertura, sem_nenhuma_area: 0 }}
        total={sampleSummary.total_criancas}
      />,
    );
    expect(
      screen.queryByText(/sem registro em nenhuma área/i),
    ).not.toBeInTheDocument();
  });
});
