import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    apiKey: string | null;
    setApiKey: (key: string | null) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [apiKey, setApiKeyState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedKey = localStorage.getItem('shadowloop_api_key');
        if (storedKey) {
            setApiKeyState(storedKey);
        }
        setIsLoading(false);
    }, []);

    const setApiKey = (key: string | null) => {
        if (key) {
            localStorage.setItem('shadowloop_api_key', key);
        } else {
            localStorage.removeItem('shadowloop_api_key');
        }
        setApiKeyState(key);
    };

    return (
        <AuthContext.Provider value={{ apiKey, setApiKey, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
