export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}

export interface AuthContextType {
    accessToken: string | null;
    isAuthenticated: boolean;
    login: (
        username: string,
        password: string
    ) => Promise<void>;
    logout: () => void;
}