import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import "../styles/auth.css";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient.js";

export default function Login() {
    const { login, loginWithGoogle } = useContext(AuthContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await login(email, password);
            navigate("/"); // redirect po loginu
        } catch (err) {
            if (err.response?.data?.provider === "google") {
                setError("Použijte přihlášení přes Google");
            } else {
                setError("Neplatný email nebo heslo");
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Přihlášení</h2>

                <form onSubmit={handleSubmit} className="auth-form">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Heslo"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && <p className="auth-error">{error}</p>}

                    <button type="submit" className="auth-button">
                        Přihlásit
                    </button>
                </form>

                <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                        try {
                            await loginWithGoogle(credentialResponse.credential);
                            navigate("/");
                        } catch (e) {
                            alert("Google login selhal");
                        }
                    }}
                    onError={() => {
                        alert("Přihlášení přes Google selhalo");
                    }}
                />

                <p className="auth-footer">
                    Nemáte účet? <a href="/register">Registrovat</a>
                </p>
            </div>
        </div>
    );

}
