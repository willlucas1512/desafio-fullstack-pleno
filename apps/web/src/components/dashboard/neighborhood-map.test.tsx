import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleSummary } from "@/test/fixtures";
import { NeighborhoodMap } from "./neighborhood-map";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("NeighborhoodMap", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("places a marker per known neighborhood with an accessible label", () => {
    render(<NeighborhoodMap data={sampleSummary.por_bairro} />);
    expect(
      screen.getByRole("link", { name: /Complexo do Alemão:/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Mangueira:.*sem dados/i }),
    ).toBeInTheDocument();
  });

  it("lists each placed neighborhood in the legend", () => {
    render(<NeighborhoodMap data={sampleSummary.por_bairro} />);
    const legend = screen.getByRole("list");
    expect(within(legend).getByText("Rocinha")).toBeInTheDocument();
    expect(within(legend).getByText("Complexo do Alemão")).toBeInTheDocument();
  });

  it("navigates to a pre-filtered children list when a marker is clicked", () => {
    render(<NeighborhoodMap data={sampleSummary.por_bairro} />);
    fireEvent.click(screen.getByRole("link", { name: /Rocinha:/i }));
    expect(push).toHaveBeenCalledWith("/children?bairro=Rocinha");
  });

  it("ignores neighborhoods without a known map position", () => {
    render(
      <NeighborhoodMap
        data={[
          { bairro: "Bairro Fantasma", total: 3, com_alertas: 1, sem_dados: 0 },
        ]}
      />,
    );
    expect(
      screen.queryByRole("link", { name: /Bairro Fantasma/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("list").children).toHaveLength(0);
  });
});
