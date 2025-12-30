import React, { useState } from "react";
import api from "../api/apiClient";
import "../styles/editUserModal.css";

const ALL_ROLES = ["user", "organizator", "admin"];

export default function EditUserModal({ user, mode, onClose, onSaved }) {
    const [roles, setRoles] = useState(user.roles);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [confirmText, setConfirmText] = useState("");

    const isAdminUser = user.roles.includes("admin");

    // ---------------- TOGGLE ROLE ----------------
    const toggleRole = (role) => {
        // zákaz odebrání admin role adminovi
        if (role === "admin" && isAdminUser) {
            setError("Administrátorovi nelze odebrat roli admin.");
            return;
        }

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

    // ---------------- SAVE ROLES ----------------
    const saveRoles = async () => {
        setSaving(true);
        setError("");

        try {
            // přidání nových rolí
            for (const r of roles) {
                if (!user.roles.includes(r)) {
                    await api.post(`/users/${user.user_id}/roles`, { role: r });
                }
            }

            // odebrání rolí
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

    // ---------------- DELETE USER ----------------
    const deleteUser = async () => {
        setSaving(true);
        setError("");

        try {
            await api.delete(`/users/admin/users/${user.user_id}`);
            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || "Mazání selhalo");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <h2>
                    {mode === "edit" ? "Upravit uživatele" : "Smazat uživatele"}
                </h2>

                <div className="modal-section">
                    <strong>Email:</strong> {user.email}
                </div>

                <div className="modal-section">
                    <strong>Auth provider:</strong> {user.auth_provider}
                </div>

                {/* ================= EDIT MODE ================= */}
                {mode === "edit" && (
                    <>
                        <div className="modal-section">
                            <strong>Role uživatele</strong>

                            {ALL_ROLES.map(r => (
                                <label key={r} className="role-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={roles.includes(r)}
                                        disabled={r === "admin" && isAdminUser}
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

                            <button
                                className="btn-outline"
                                onClick={onClose}
                            >
                                Zrušit
                            </button>
                        </div>
                    </>
                )}

                {/* ================= DELETE MODE ================= */}
                {mode === "delete" && (
                    <div className="danger-zone">
                        <h3>⚠️ Trvalé smazání uživatele</h3>

                        <p>
                            Tato akce je <strong>nevratná</strong>.
                            Budou odstraněna všechna data uživatele.
                        </p>

                        <p>
                            Pro potvrzení napište <strong>SMAZAT</strong>
                        </p>

                        <input
                            value={confirmText}
                            onChange={e => setConfirmText(e.target.value)}
                            placeholder="SMAZAT"
                        />

                        {error && <p className="error">{error}</p>}

                        <div className="modal-actions">
                            <button
                                className="btn-danger"
                                disabled={confirmText !== "SMAZAT" || saving}
                                onClick={deleteUser}
                            >
                                🗑 Trvale smazat
                            </button>

                            <button
                                className="btn-outline"
                                onClick={onClose}
                            >
                                Zrušit
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
