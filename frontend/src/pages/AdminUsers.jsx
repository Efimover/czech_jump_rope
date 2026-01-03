import React, { useEffect, useState } from "react";
import api from "../api/apiClient.js";
import EditUserModal from "../components/EditUserModal.jsx";
import "../styles/adminUsers.css";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [mode, setMode] = useState(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");


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

    const filteredUsers = users.filter(u => {
        const text = search.toLowerCase();

        const matchesText =
            u.email.toLowerCase().includes(text) ||
            u.first_name?.toLowerCase().includes(text) ||
            u.last_name?.toLowerCase().includes(text);

        const matchesRole =
            roleFilter === "all" || u.roles.includes(roleFilter);

        return matchesText && matchesRole;
    });


    return (
        <div className="admin-users-wrapper">
            <h1>Uživatelé systému</h1>
            <div className="admin-users-filters">
                <input
                    type="text"
                    placeholder="🔍 Hledat podle emailu nebo jména"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                >
                    <option value="all">Všechny role</option>
                    <option value="user">user</option>
                    <option value="organizator">organizator</option>
                    <option value="admin">admin</option>
                </select>
            </div>

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
                {filteredUsers.length === 0 && (
                    <tr>
                        <td colSpan="5" className="no-results">
                            Žádní uživatelé neodpovídají filtru
                        </td>
                    </tr>
                )}
                {filteredUsers.map(u => (
                    <tr key={u.user_id}>
                        <td>{u.email}</td>
                        <td>{u.roles.join(", ")}</td>
                        <td>{u.auth_provider}</td>
                        <td>
                            <button
                                className="btn-outline"
                                onClick={() => {
                                    setSelectedUser(u);
                                    setMode("edit");
                                }}
                            >
                                ⚙️ Upravit
                            </button>
                        </td>
                        <td>
                            <button
                                className="btn-danger"
                                onClick={() => {
                                    setSelectedUser(u);
                                    setMode("delete");
                                }}
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
                    mode={mode}
                    onClose={() => {
                        setSelectedUser(null);
                        setMode(null);
                    }}
                    onSaved={loadUsers}
                />
            )}
        </div>
    );
}
