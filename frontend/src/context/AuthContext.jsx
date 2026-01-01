import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../api/apiClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // ===============================
    // 🔹 NAČTENÍ AKTUÁLNÍHO UŽIVATELE
    // ===============================
    const refreshUser = useCallback(async () => {
        try {
            const res = await api.get("/users/me");
            setUser(res.data);
            return res.data;
        } catch {
            setUser(null);
            return null;
        }
    }, []);

    // ===============================
    // 🔹 INIT APP
    // ===============================
    useEffect(() => {
        refreshUser().finally(() => setAuthLoading(false));
    }, [refreshUser]);

    // ===============================
    // 🔹 AUTH AKCE
    // ===============================
    const register = async (form) => {
        return api.post("/users/register", form);
    };

    const login = async (email, password) => {
        await api.post("/users/login", { email, password });
        return refreshUser();
    };

    const loginWithGoogle = async (idToken) => {
        await api.post("/users/auth/google", { idToken });
        return refreshUser();
    };

    const logout = async () => {
        try {
            await api.post("/users/logout");
        } catch {
            // backend logout endpoint klidně nemusí existovat
        } finally {
            setUser(null);
        }
    };

    // ===============================
    //  PŘEPÍNÁNÍ ROLE (KLÍČOVÉ)
    // ===============================
    const switchRole = async (role) => {
        await api.put("/users/me/active-role", { role });
        return refreshUser();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                authLoading,
                login,
                register,
                loginWithGoogle,
                logout,
                switchRole,
                refreshUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
