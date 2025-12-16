import React, { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";

export default function RegistrationCreate() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const competition_id = params.get("competition");

    useEffect(() => {
        const run = async () => {
            if (!user) {
                navigate("/login");
                return;
            }

            if (!competition_id) {
                alert("Chybí ID soutěže.");
                navigate("/");
                return;
            }

            try {
                // 1️⃣ Zkontrolovat, zda už existuje přihláška
                const check = await api.get(`/registrations/check`, {
                    params: { competition_id }
                });

                if (check.data.exists) {
                    // 2️⃣ Přihláška existuje → přesměrovat
                    navigate(`/registrations/${check.data.registration_id}`);
                    return;
                }

                // 3️⃣ Přihláška NEexistuje → vytvořit novou
                const res = await api.post("/registrations", {
                    competition_id,
                    contact_name: `${user.first_name} ${user.last_name}`,
                    contact_email: user.email
                });

                const newId = res.data.registration.registration_id;
                navigate(`/registrations/${newId}`);

            } catch (err) {
                console.error("Registration error:", err);

                const msg =
                    err?.response?.data?.error ||
                    "Nepodařilo se vytvořit přihlášku.";

                alert(msg);
                navigate(`/competitions/${competition_id}`);
            }
        };

        run();
    }, []);

    return <p style={{ textAlign: "center" }}>Vytvářím přihlášku...</p>;
}
