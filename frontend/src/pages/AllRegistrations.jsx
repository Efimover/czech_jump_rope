import React, {useContext, useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import { formatDate } from "../utils/date";
import "../styles/myRegistrations.css";
import { AuthContext } from "../context/AuthContext";


export default function AllRegistrations() {
    const { user } = useContext(AuthContext);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const canDelete =
        user.active_role === "admin" ||
        user.active_role === "organizator";


    useEffect(() => {
        if (
            user?.active_role === "admin" ||
            user?.active_role === "organizator"
        ) {
            load();
        }
    }, [user]);

    async function load() {
        try {
            const res = await api.get("/registrations");
            setRegistrations(res.data);
        } catch (err) {
            alert("Nepodařilo se načíst přihlášky");
        } finally {
            setLoading(false);
        }
    }

    async function deleteRegistration(id) {
        const ok = confirm(
            "⚠️ POZOR – NEVRATNÁ AKCE ⚠️\n\n" +
            "Opravdu chcete smazat tuto přihlášku?\n" +
            "Všechna data budou trvale odstraněna."
        );
        if (!ok) return;

        try {
            await api.delete(`/registrations/${id}`);
            setRegistrations(prev =>
                prev.filter(r => r.registration_id !== id)
            );
        } catch (err) {
            alert(
                err.response?.data?.error ||
                "Přihlášku se nepodařilo smazat"
            );
        }
    }

    if (loading) return <p>Načítám…</p>;

    return (
        <div className="page-wrapper">
            <h1>Všechny přihlášky</h1>

            {registrations.map(r => (
                <div key={r.registration_id} className="reg-card">
                    <h3>{r.competition_name}</h3>
                    <p>Uživatel: {r.user_email}</p>
                    <p>Status: {r.status}</p>
                    {canDelete && (
                        <div className="danger-zone">
                            <button
                                className="btn-danger"
                                onClick={() => deleteRegistration(r.registration_id)}
                            >
                                🗑 Smazat přihlášku
                            </button>
                        </div>
                    )}


                    <button
                        className="btn-outline"
                        onClick={() =>
                            navigate(`/registrations/${r.registration_id}`)
                        }
                    >
                        👁 Detail
                    </button>
                </div>
            ))}
        </div>
    );
}
