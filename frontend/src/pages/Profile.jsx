import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import ChangePassword from "../components/ChangePassword";


export default function Profile() {
    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        api.get("/users/me").then(res => setUser(res.data));
    }, []);

    if (!user) {
        return (
            <p>
                Pro zobrazení profilu se musíte přihlásit.
            </p>
        );
    }

    return (
        <div className="page-wrapper">
            <h1>Můj profil</h1>

            <div className="profile-card">
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

                {editing && (
                    <>
                        <hr style={{ margin: "24px 0" }} />
                        <ChangePassword />
                    </>
                )}

                {editing ? (
                    <button
                        className="btn-primary"
                        onClick={async () => {
                            await api.put("/users/me", {
                                first_name: user.first_name,
                                last_name: user.last_name
                            });
                            setEditing(false);
                        }}
                    >
                        💾 Uložit
                    </button>
                ) : (
                    <button
                        className="btn-outline"
                        onClick={() => setEditing(true)}
                    >
                        ✏️ Upravit
                    </button>
                )}
            </div>
        </div>
    );
}
