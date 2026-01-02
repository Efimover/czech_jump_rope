import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Homepage from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import CompetitionDetail from "./pages/CompetitionDetail.jsx";

import RegistrationStart from "./pages/RegistrationStart.jsx";
import RegistrationDetail from "./pages/RegistrationDetail.jsx";
import AthleteAdd from "./pages/AthleteAdd.jsx";
import AthleteEdit from "./pages/AthleteEdit.jsx";
import MyRegistrations from "./pages/MyRegistrations.jsx";

import Profile from "./pages/Profile.jsx";
import CreateCompetition from "./pages/CreateCompetition.jsx";
import CompetitionEdit from "./pages/CompetitionEdit.jsx";
import AllRegistrations from "./pages/AllRegistrations.jsx";
import RequireRole from "./components/RequireRole.jsx";

import AdminUsers from "./pages/AdminUsers";
import AdminRoute from "./components/AdminRoute.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import AdminAuditLog from "./pages/AdminAuditLog.jsx";



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

                <Route
                    path="/teams/:teamId/athletes/new"
                    element={<AthleteAdd />}
                />


                <Route
                    path="/athletes/:athleteId/edit"
                    element={<AthleteEdit />}
                />
                <Route
                    path="/my-registrations"
                    element={<MyRegistrations />}
                />

                <Route
                    path="/profile"
                    element={<Profile />}
                />
                <Route path="/competitions/new" element={<CreateCompetition />} />

                <Route
                    path="/competitions/:competitionId/edit"
                    element={<CompetitionEdit />}
                />

                <Route
                    path="/registrations"
                    element={
                        <RequireRole roles={["admin", "organizator"]}>
                            <AllRegistrations />
                        </RequireRole>
                    }
                />

                {/* ADMIN */}
                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminUsers />
                        </AdminRoute>
                    }
                />

                <Route path="/notifications" element={<NotificationsPage />} />

                <Route path="/admin/audit" element={<AdminAuditLog />} />

            </Routes>
        </BrowserRouter>
    );
}
