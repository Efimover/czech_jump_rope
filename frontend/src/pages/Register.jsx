
import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        date_birth: ""
    });

    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await register(form);
            navigate("/login");
        } catch (err) {
            // pokud server vrátil message, zobraz ho
            const msg = err?.response?.data?.message || err?.response?.data?.error || "Registration failed";
            setError(msg);
        }
    };

    return (
        <div className="container">
            <h2>Registrace</h2>

            <form onSubmit={handleSubmit}>
                <input
                    placeholder="Jméno"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />

                <input
                    placeholder="Příjmení"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                />

                <input
                    type="password"
                    placeholder="Heslo"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                />

                <input
                    type="date"
                    value={form.date_birth}
                    onChange={(e) => setForm({ ...form, date_birth: e.target.value })}
                />

                {error && <p style={{ color: "red" }}>{error}</p>}

                <button type="submit">Registrovat</button>
            </form>
        </div>
    );
}
