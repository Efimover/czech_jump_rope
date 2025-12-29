import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import ChangePassword from "../components/ChangePassword";
import "../styles/profile.css";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        api.get("/users/me").then(res => setUser(res.data));
    }, []);

    if (!user) {
        return (
            <div className="profile-wrapper">
                <p className="profile-login-hint">
                    Pro zobrazení profilu se musíte přihlásit.
                </p>
            </div>
        );
    }

    async function saveProfile() {
        await api.put("/users/me", {
            first_name: user.first_name,
            last_name: user.last_name
        });
        setEditing(false);
    }

    const isLocalAccount = user.auth_provider === "local";

    return (
        <div className="profile-wrapper">
            <h1>Můj profil</h1>

            <div className="profile-card">
                {/* ZÁKLADNÍ ÚDAJE */}
                <div className="profile-section">
                    <label>Jméno</label>
                    <input
                        value={user.first_name}
                        disabled={!editing}
                        onChange={e =>
                            setUser({ ...user, first_name: e.target.value })
                        }
                    />

                    <label>Příjmení</label>
                    <input
                        value={user.last_name}
                        disabled={!editing}
                        onChange={e =>
                            setUser({ ...user, last_name: e.target.value })
                        }
                    />

                    <label>Email</label>
                    <input value={user.email} disabled />
                </div>

                {/* ROLE */}
                <div className="profile-section">
                    <label>Role</label>
                    <div className="role-list">
                        {user.roles?.map(role => (
                            <span key={role} className="role-chip">
                                {role}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ZMĚNA HESLA */}
                {editing && isLocalAccount && (
                    <div className="profile-section">
                        <h3>Změna hesla</h3>
                        <ChangePassword />
                    </div>
                )}

                {/* INFO PRO GOOGLE ÚČTY */}
                {editing && !isLocalAccount && (
                    <div className="profile-section">
                        <p className="profile-hint">
                            Tento účet je přihlášen přes Google – heslo nelze změnit.
                        </p>
                    </div>
                )}

                {/* AKCE */}
                <div className="profile-actions">
                    {editing ? (
                        <>
                            <button className="btn-primary" onClick={saveProfile}>
                                💾 Uložit změny
                            </button>
                            <button
                                className="btn-outline"
                                onClick={() => setEditing(false)}
                            >
                                Zrušit
                            </button>
                        </>
                    ) : (
                        <button
                            className="btn-outline"
                            onClick={() => setEditing(true)}
                        >
                            ✏️ Upravit profil
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
