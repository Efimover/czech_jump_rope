import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Homepage from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import CompetitionDetail from "./pages/CompetitionDetail.jsx";

import RegistrationStart from "./pages/RegistrationStart.jsx";
import RegistrationDetail from "./pages/RegistrationDetail.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Homepage />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Soutěže */}
                <Route path="/competitions/:id" element={<CompetitionDetail />} />

                {/* Nové vytváření přihlášky  */}
                <Route path="/registrations/start" element={<RegistrationStart />} />

                {/* Detail přihlášky */}
                <Route path="/registrations/:id" element={<RegistrationDetail />} />
            </Routes>
        </BrowserRouter>
    );
}
