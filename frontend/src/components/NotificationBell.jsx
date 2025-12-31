import { useEffect, useState } from "react";
import api from "../api/apiClient";
import "../styles/notifications.css";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        api.get("/notifications/me").then(res => {
            setNotifications(res.data);
        });
    }, []);

    const unread = notifications.filter(n => !n.is_read).length;

    return (
        <div className="notification-bell">
            🔔 {unread > 0 && <span className="badge">{unread}</span>}
        </div>
    );
}
