import React, { useState, useContext } from "react";
import "../styles/auth.css";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {GoogleLogin} from "@react-oauth/google";

export default function Register() {
    const { register, loginWithGoogle } = useContext(AuthContext);
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
            const data = err?.response?.data;

            if (data?.provider === "google") {
                setError(
                    "Tento e-mail je již registrován přes Google. Použijte přihlášení přes Google."
                );
            } else {
                setError(
                    data?.message ||
                    data?.error ||
                    "Registrace se nezdařila"
                );
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Registrace</h2>

                <form onSubmit={handleSubmit} className="auth-form">
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

                    {error && <p className="auth-error">{error}</p>}

                    <button type="submit" className="auth-button">Registrovat</button>
                </form>

                <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                        try {
                            await loginWithGoogle(credentialResponse.credential);
                            navigate("/");
                        } catch (e) {
                            alert("Google registrace selhal");
                        }
                    }}
                    onError={() => {
                        alert("Registrace přes Google selhalo");
                    }}
                />

                <p className="auth-footer">
                    Máte účet? <a href="/login">Přihlásit</a>
                </p>
            </div>
        </div>
    );



}
