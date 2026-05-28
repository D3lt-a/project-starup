import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ useremail: "", userpassword: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(form.useremail, form.userpassword);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="center">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Welcome back</h1>
                    <p>Sign in to your account</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="field">
                        <label>Email</label>
                        <input
                            type="email"
                            name="useremail"
                            placeholder="you@example.com"
                            value={form.useremail}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="field">
                        <label>Password</label>
                        <input
                            type="password"
                            name="userpassword"
                            placeholder="••••••••"
                            value={form.userpassword}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="auth-footer">
                    No account?{" "}
                    <Link to="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
