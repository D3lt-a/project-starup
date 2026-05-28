import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        useremail: "",
        userpassword: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            if (form.userpassword.length < 6) {
                throw new Error(
                    "Password must be at least 6 characters."
                );
            }

            await register(
                form.username,
                form.useremail,
                form.userpassword
            );

            navigate("/login");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="center">
            <div>
                <div className="auth-header">
                    <h1>Create account</h1>
                    <p>Get started for free</p>
                </div>

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="auth-form"
                >
                    <div className="field">
                        <label>Username</label>

                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="field">
                        <label>Email</label>

                        <input
                            type="email"
                            name="useremail"
                            value={form.useremail}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="field">
                        <label>Password</label>

                        <input
                            type="password"
                            name="userpassword"
                            value={form.userpassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating..."
                            : "Create account"}
                    </button>
                </form>

                <p>
                    Already have an account?{" "}
                    <Link to="/login">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;