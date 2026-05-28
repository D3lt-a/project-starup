import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div>
            <section >
                <nav >
                    <h3>Dashboard</h3>
                    <Link>Your</Link>
                    <Link>NavLinks</Link>
                    <Link>Goes</Link>
                    <Link>Here</Link>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout, {user?.username}
                    </button>
                </nav>
            </section>
            <main className="p-4">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
