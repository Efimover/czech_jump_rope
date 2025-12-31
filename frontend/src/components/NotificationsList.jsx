import { useEffect, useState } from "react";
import api from "../api/apiClient";
import "../styles/notifications.css";

export default function NotificationsList() {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        const res = await api.get("/notifications/me");
        setNotifications(res.data);
    }

    async function openNotification(n) {
        if (!n.is_read) {
            await api.post(`/notifications/${n.notification_id}/read`);
        }

        if (n.link) {
            window.location.href = n.link;
        }

        load(); // refresh stavu (zmizí „unread“)
    }

    return (
        <div className="notifications-list">
            {notifications.length === 0 && (
                <p className="placeholder">Žádné notifikace</p>
            )}

            {notifications.map(n => (
                <div
                    key={n.notification_id}
                    className={`notification ${n.is_read ? "" : "unread"}`}
                    onClick={() => openNotification(n)}
                >
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <span className="date">
                        {new Date(n.created_at).toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
}
