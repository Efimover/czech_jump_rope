import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import "../styles/editUserModal.css";

const ALL_ROLES = ["user", "organizator", "admin"];

export default function EditUserModal({ user, onClose, onSaved }) {
    const [roles, setRoles] = useState(user.roles);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const isAdminRole = user.roles.includes("admin");

    const toggleRole = (role) => {
        if (roles.includes(role)) {
            if (roles.length === 1) {
                setError("Uživatel musí mít alespoň jednu roli.");
                return;
            }
            setRoles(roles.filter(r => r !== role));
        } else {
            setRoles([...roles, role]);
        }
        setError("");
    };

    const saveRoles = async () => {
        setSaving(true);
        try {
            // přidej nové role
            for (const r of roles) {
                if (!user.roles.includes(r)) {
                    await api.post(`/users/${user.user_id}/roles`, { role: r });
                }
            }

            // odeber role
            for (const r of user.roles) {
                if (!roles.includes(r)) {
                    await api.delete(`/users/${user.user_id}/roles/${r}`);
                }
            }

            onSaved();
            onClose();
        } catch (err) {
            setError("Nepodařilo se uložit změny");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <h2>Upravit uživatele</h2>

                <div className="modal-section">
                    <strong>Email:</strong> {user.email}
                </div>

                <div className="modal-section">
                    <strong>Auth provider:</strong> {user.auth_provider}
                </div>

                <div className="modal-section">
                    <strong>Role uživatele</strong>

                    {ALL_ROLES.map(r => (
                        <label key={r} className="role-checkbox">
                            <input
                                type="checkbox"
                                checked={roles.includes(r)}
                                disabled={isAdminRole}
                                onChange={() => toggleRole(r)}
                            />
                            {r}
                        </label>
                    ))}
                </div>

                <p className="hint">
                    Aktivní roli si uživatel přepíná sám po přihlášení.
                </p>

                {error && <p className="error">{error}</p>}

                <div className="modal-actions">
                    <button
                        className="btn-primary"
                        disabled={saving}
                        onClick={saveRoles}
                    >
                        💾 Uložit
                    </button>
                    <button className="btn-outline" onClick={onClose}>
                        Zrušit
                    </button>
                </div>
            </div>
        </div>
    );
}
