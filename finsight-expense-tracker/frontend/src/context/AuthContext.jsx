import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser && storedUser !== 'undefined') {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse stored user:", error);
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        if (!data.requires2FA) {
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
        }
        return data;
    };

    const verify2FA = async (userId, token) => {
        const { data } = await api.post('/auth/verify-2fa', { userId, token });
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const register = async (name, email, password, organizationName) => {
        const { data } = await api.post('/auth/register', { name, email, password, organizationName });
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateProfile = async (userData) => {
        const { data } = await api.put('/auth/profile', userData);
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
    };

    const updateProfileImage = async (formData) => {
        const { data } = await api.post('/auth/profile-picture', formData);
        const updatedUser = { ...user, profilePicture: data.profilePicture };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return data;
    };


    return (
        <AuthContext.Provider value={{ user, login, register, verify2FA, logout, updateProfile, updateProfileImage, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );

};

export default AuthContext;
