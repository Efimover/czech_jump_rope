import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Homepage from "./pages/Home.jsx";


import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import CompetitionDetail from "./pages/CompetitionDetail.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* detail soutěže */}
                <Route path="/competitions/:id" element={<CompetitionDetail />} />

            </Routes>
        </BrowserRouter>
    );
}
