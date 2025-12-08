import React from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

import { useContext } from "react";

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav className="nav">
            <Link to="/" className="nav-logo">Czech Jump Rope</Link>

            <div className="nav-links">
                <Link to="/competitions">Soutěže</Link>

                {!user && (
                    <>
                        <Link to="/login">Přihlásit se</Link>
                        <Link to="/register">Registrovat</Link>
                    </>
                )}

                {user && (
                    <button onClick={logout}>Odhlásit se</button>
                )}
            </div>
        </nav>
    );
}
