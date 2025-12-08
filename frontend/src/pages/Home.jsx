import React from "react";
import { Link } from "react-router-dom";

export default function Homepage() {
    return (
        <div className="homepage">

            <h1>Czech Jump Rope</h1>

            <Link to="/competitions" className="btn-big">
                zobrazit soutěži
            </Link>

            <div className="auth-buttons">
                <Link className="btn" to="/register">Registrovat se</Link>
                <Link className="btn" to="/login">Přihlásit se</Link>
            </div>
        </div>
    );
}
