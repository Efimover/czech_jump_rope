import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Homepage from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import CompetitionDetail from "./pages/CompetitionDetail.jsx";

import RegistrationStart from "./pages/RegistrationStart.jsx";
import RegistrationDetail from "./pages/RegistrationDetail.jsx";
import AthleteAdd from "./pages/AthleteAdd.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Home */}
                <Route path="/" element={<Homepage />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Soutěže */}
                <Route path="/competitions/:id" element={<CompetitionDetail />} />

                {/* Spuštění registrace */}
                <Route path="/registrations/start" element={<RegistrationStart />} />

                {/* Detail přihlášky */}
                <Route path="/registrations/:id" element={<RegistrationDetail />} />

                {/* Přidání závodníka do přihlášky */}
                <Route
                    path="/registrations/:registrationId/athletes/new"
                    element={<AthleteAdd />}
                />
            </Routes>
        </BrowserRouter>
    );
}
