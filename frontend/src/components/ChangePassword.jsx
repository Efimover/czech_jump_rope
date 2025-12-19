import React, { useState } from "react";
import api from "../api/apiClient";
import { isValidPassword } from "../utils/validationPassword";
import "../styles/changePassword.css";
import {useNavigate} from "react-router-dom";

export default function ChangePassword() {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    function passwordStrength(pw) {
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;

        if (score <= 1) return "slabé";
        if (score === 2) return "střední";
        return "silné";
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!current || !next || !confirm) {
            setError("Vyplňte všechna pole.");
            return;
        }

        if (next !== confirm) {
            setError("Nová hesla se neshodují.");
            return;
        }

        if (!isValidPassword(next)) {
            setError(
                "Heslo musí mít alespoň 8 znaků, jedno velké písmeno a jeden speciální znak."
            );
            return;
        }

        try {
            setLoading(true);

            await api.put("/users/me/password", {
                currentPassword: current,
                newPassword: next
            });

            setSuccess("Heslo bylo úspěšně změněno.");
            setCurrent("");
            setNext("");
            setConfirm("");

            // 🔐 automatický logout po změně hesla
            setTimeout(() => {
                localStorage.removeItem("token");
                navigate("/login");
            }, 1500);

        } catch (err) {
            setError(
                err.response?.data?.error ||
                "Změna hesla se nezdařila."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="password-card">
            <h2>Změna hesla</h2>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <form onSubmit={handleSubmit}>
                <label>
                    Aktuální heslo
                    <input
                        type="password"
                        value={current}
                        onChange={e => setCurrent(e.target.value)}
                    />
                </label>

                <label>
                    Nové heslo
                    <input
                        type="password"
                        value={next}
                        onChange={e => setNext(e.target.value)}
                    />
                    {next && (
                        <small>
                            Síla hesla: <strong>{passwordStrength(next)}</strong>
                        </small>
                    )}
                </label>

                <label>
                    Potvrzení nového hesla
                    <input
                        type="password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                    />
                </label>

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                >
                    {loading ? "Ukládám…" : "Změnit heslo"}
                </button>
                {success && <div className="success">Heslo změněno, budete odhlášeni…</div>}
            </form>
        </div>
    );
}
