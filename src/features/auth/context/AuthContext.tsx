import {
    createContext,
    useContext,
    useState,
    type ReactNode
} from "react";

import { login as loginRequest } from "../services/authService";

interface AuthContextType {
    accessToken: string | null;
    isAuthenticated: boolean;
    login: (
        username: string,
        password: string
    ) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

interface Props {
    children: ReactNode;
}

export function AuthProvider({ children }: Props) {

    const [accessToken, setAccessToken] = useState<string | null>(
        sessionStorage.getItem("accessToken")
    );

    const login = async (
        username: string,
        password: string
    ) => {

        const response = await loginRequest({
            username,
            password
        });

        sessionStorage.setItem(
            "accessToken",
            response.accessToken
        );

        setAccessToken(response.accessToken);
    };

    const logout = () => {

        sessionStorage.removeItem("accessToken");

        setAccessToken(null);
    };

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                isAuthenticated: !!accessToken,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {

    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth debe utilizarse dentro de AuthProvider"
        );
    }

    return context;
}