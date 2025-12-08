import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/auth.css";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const { login } = useContext(AuthContext);
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
            setError("Invalid email or password");
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

                <p className="auth-footer">
                    Nemáte účet? <a href="/register">Registrovat</a>
                </p>
            </div>
        </div>
    );

}
