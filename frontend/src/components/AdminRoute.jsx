import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
    const { user, loading } = useContext(AuthContext);

    if (loading) return null;

    if (!user || !user.roles?.includes("admin")) {
        return <Navigate to="/" replace />;
    }

    return children;
}