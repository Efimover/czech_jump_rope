import { screen } from "@testing-library/react";
import CompetitionDetail from "../../src/pages/CompetitionDetail";
import { renderWithProviders } from "../utils/renderWithProviders";

test("renders loading state", () => {
    renderWithProviders(<CompetitionDetail />);

    expect(
        screen.getByText(/Načítám soutěž/i)
    ).toBeInTheDocument();
});

test("renders competition name from API", async () => {
    renderWithProviders(<CompetitionDetail />);

    expect(
        await screen.findByText("Test Cup")
    ).toBeInTheDocument();
});

test("organizator sees competition management button", async () => {
    renderWithProviders(<CompetitionDetail />, {
        user: {
            user_id: 1,
            active_role: "organizator",
            roles: ["organizator"]
        }
    });

    expect(
        await screen.findByText(/Správa soutěže/i)
    ).toBeInTheDocument();
});