import React, { createContext, useState, useEffect } from "react";
import api from "../api/apiClient";

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    // klasický login
    const login = async (email, password) => {
        const res = await api.post("/users/login", { email, password });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);

        return res.data.user;
    };

    // Google login
    const loginWithGoogle = async (idToken) => {
        const res = await api.post("/users/auth/google", { idToken });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);

        return res.data.user;
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, login, loginWithGoogle, logout, loading }}
        >
            {children}
        </AuthContext.Provider>
    );
};

