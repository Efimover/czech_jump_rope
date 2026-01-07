import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateCompetition from "../../src/pages/CreateCompetition.jsx";

test("cannot submit empty competition form", async () => {
    render(
        <MemoryRouter>
            <CreateCompetition />
        </MemoryRouter>
    );

    await userEvent.click(
        screen.getByText(/Vytvořit soutěž/i)
    );

    expect(
        screen.getByText(/Zadejte název/i)
    ).toBeInTheDocument();
});
