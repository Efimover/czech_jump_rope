import { useEffect, useState } from "react";
import api from "../api/apiClient";
import "../styles/adminAuditLog.css";


export default function AdminAuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/admin/audit-log")
            .then(res => setLogs(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Načítám audit log…</p>;

    return (
        <div className="admin-page">
            <h1>Admin – Přehled změn</h1>

            <table className="audit-table">
                <thead>
                <tr>
                    <th>Čas</th>
                    <th>Typ</th>
                    <th>Akce</th>
                    <th>Entita</th>
                    <th>Uživatel</th>
                    <th>Role</th>
                    <th>Zpráva</th>
                </tr>
                </thead>
                <tbody>
                {logs.map((l, i) => (
                    <tr key={i}>
                        <td>{new Date(l.created_at).toLocaleString()}</td>
                        <td>{l.entity_type}</td>
                        <td>
                            <strong className={`action action-${l.action.toLowerCase()}`}>
                                {l.action}
                            </strong>
                        </td>

                        <td>
                            <span className="entity-name">
                                {l.entity_name}
                            </span>
                        </td>

                        <td>{l.actor_email}</td>
                        <td className={`role role-${l.actor_role}`}>
                            {l.actor_role}
                        </td>
                        <td>{l.message}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
