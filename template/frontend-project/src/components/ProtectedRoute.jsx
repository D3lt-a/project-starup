import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * Wraps any routes that require authentication.
 * If the session check is still loading → show nothing (or a spinner).
 * If unauthenticated → redirect to /login.
 * If authenticated → render the child routes via <Outlet />.
 */
const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <p style={{ color: "#888", fontFamily: "monospace" }}>Checking session...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
