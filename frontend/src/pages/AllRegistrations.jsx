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

    if (loading) return <p>Načítám…</p>;

    return (
        <div className="page-wrapper">
            <h1>Všechny přihlášky</h1>

            {registrations.map(r => (
                <div key={r.registration_id} className="reg-card">
                    <h3>{r.competition_name}</h3>
                    <p>Uživatel: {r.user_email}</p>
                    <p>Status: {r.status}</p>

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
