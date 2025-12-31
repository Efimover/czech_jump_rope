import React, { createContext, useState, useEffect } from "react";
import api from "../api/apiClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔹 při startu aplikace zjisti, kdo je přihlášený
    useEffect(() => {
        const loadMe = async () => {
            try {
                const res = await api.get("/users/me");
                setUser(res.data);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        loadMe();
    }, []);

    // registrace (beze změny)
    const register = async (form) => {
        return api.post("/users/register", form);
    };

    // 🔹 login – backend nastaví cookie
    const login = async (email, password) => {
        await api.post("/users/login", { email, password });
        const me = await api.get("/users/me");
        setUser(me.data);
        return me.data;
    };

    // 🔹 Google login – STEJNÝ MODEL
    const loginWithGoogle = async (idToken) => {
        await api.post("/users/auth/google", { idToken });
        const me = await api.get("/users/me");
        setUser(me.data);
        return me.data;
    };

    const logout = async () => {
        try {
            await api.post("/users/logout");
        } catch (e) {
            // i kdyby backend spadl, frontend se odhlásí
            console.warn("Logout backend failed");
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{ user, login, register, loginWithGoogle, logout, loading }}
        >
            {children}
        </AuthContext.Provider>
    );
};
