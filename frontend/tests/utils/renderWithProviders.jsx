import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../src/context/AuthContext";

export function renderWithProviders(
    ui,
    {
        route = "/competitions/1",
        user = null
    } = {}
) {
    return render(
        <AuthContext.Provider value={{ user }}>
            <MemoryRouter initialEntries={[route]}>
                {ui}
            </MemoryRouter>
        </AuthContext.Provider>
    );
}
