import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function RequireRole({ roles, children }) {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!roles.includes(user.active_role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
