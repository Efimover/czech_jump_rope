import React, { createContext, useState, useEffect } from "react";
import api from "../api/apiClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // načti uživatele při obnově stránky
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    // const login = async (email, password) => {
    //     const res = await api.post("/users/login", { email, password });
    //     const { token, user } = res.data;
    //
    //     localStorage.setItem("token", token);
    //     localStorage.setItem("user", JSON.stringify(user));
    //
    //     setUser(user);
    //     return user;
    // };

    const login = async (email, password) => {
        const res = await api.post("/users/login", { email, password });
        localStorage.setItem("token", res.data.token);

        const me = await api.get("/users/me");

        localStorage.setItem("user", JSON.stringify(me.data));
        setUser(me.data);

        return me.data;
    };

    const register = async (form) => {
        return api.post("/users/register", form);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
