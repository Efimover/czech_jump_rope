import { useEffect, useState } from "react";
import api from "../api/apiClient";
import "../styles/notifications.css";

export default function NotificationBell() {
    const [unread, setUnread] = useState(0);

    async function loadUnread() {
        const res = await api.get("/notifications/me");
        setUnread(res.data.filter(n => !n.is_read).length);
    }

    useEffect(() => {
        loadUnread();

        const es = new EventSource(
            `${import.meta.env.VITE_API_URL}/notifications/stream`,
            { withCredentials: true }
        );

        es.addEventListener("notification", () => {
            loadUnread();
        });

        es.onerror = () => {
            es.close();
        };

        return () => es.close();
    }, []);

    return (
        <div className="notification-bell">
            🔔 {unread > 0 && <span className="badge">{unread}</span>}
        </div>
    );
}
