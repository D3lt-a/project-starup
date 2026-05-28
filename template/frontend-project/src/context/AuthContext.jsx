import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import api from "../api/authAPI";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const res = await api.get("/me");
            setUser(res.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const register = async (
        username,
        useremail,
        userpassword
    ) => {
        try {
            const res = await api.post("/register", {
                username,
                useremail,
                userpassword,
            });

            return res.data;
        } catch (error) {
            throw error;
        }
    };

    const login = async (
        useremail,
        userpassword
    ) => {
        try {
            const res = await api.post("/login", {
                useremail,
                userpassword,
            });

            setUser(res.data.user);

            return res.data;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post("/logout");
            setUser(null);
        } catch (error) {
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                register,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};