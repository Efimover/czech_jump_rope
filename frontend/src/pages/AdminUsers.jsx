import React, { useEffect, useState } from "react";
import api from "../api/apiClient.js";
import EditUserModal from "../components/EditUserModal.jsx";
import "../styles/adminUsers.css";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    const loadUsers = async () => {
        try {
            const res = await api.get("/users/admin");
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to load users", err);
            alert("Nepodařilo se načíst uživatele");
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <div className="admin-users-wrapper">
            <h1>Uživatelé systému</h1>

            <table className="admin-users-table">
                <thead>
                <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Auth</th>
                    <th>Akce</th>
                </tr>
                </thead>
                <tbody>
                {users.map(u => (
                    <tr key={u.user_id}>
                        <td>{u.email}</td>
                        <td>{u.roles.join(", ")}</td>
                        <td>{u.auth_provider}</td>
                        <td>
                            <button
                                className="btn-outline"
                                onClick={() => setSelectedUser(u)}
                            >
                                ⚙️ Upravit
                            </button>
                        </td>
                        <td>
                            <button
                                className="btn-danger"
                                onClick={() => setSelectedUser(u)}
                            >
                                🗑 Smazat
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {selectedUser && (
                <EditUserModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onSaved={loadUsers}
                />
            )}
        </div>
    );
}
