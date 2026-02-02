import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        const role = mode === "register-teacher" ? "teacher" : "student";
        await register({ email, password, fullName, role });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Besu Training System</h1>
        <h2 style={styles.subtitle}>
          {mode === "login"
            ? "Login"
            : mode === "register-teacher"
            ? "Register as Teacher"
            : "Register as Student"}
        </h2>

        <div style={styles.modeRow}>
          <button
            type="button"
            onClick={() => setMode("login")}
            style={{
              ...styles.modeButton,
              ...(mode === "login" ? styles.modeButtonActive : {}),
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register-teacher")}
            style={{
              ...styles.modeButton,
              ...(mode === "register-teacher" ? styles.modeButtonActive : {}),
            }}
          >
            Register Teacher
          </button>
          <button
            type="button"
            onClick={() => setMode("register-student")}
            style={{
              ...styles.modeButton,
              ...(mode === "register-student" ? styles.modeButtonActive : {}),
            }}
          >
            Register Student
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode !== "login" && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={styles.input}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>
        {mode === "register-student" && (
          <div style={styles.hint}>
            After registration, request approval from your teacher using the
            class ID.
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  card: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    textAlign: "center",
    marginBottom: "0.5rem",
    color: "#333",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: "1.5rem",
    color: "#666",
    fontSize: "1.2rem",
  },
  modeRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  modeButton: {
    padding: "0.5rem",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  modeButtonActive: {
    backgroundColor: "#007bff",
    color: "white",
    borderColor: "#007bff",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  button: {
    padding: "0.75rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginBottom: "1rem",
    padding: "0.5rem",
    backgroundColor: "#ffe6e6",
    borderRadius: "4px",
  },
  hint: {
    marginTop: "1rem",
    fontSize: "0.9rem",
    color: "#666",
    textAlign: "center",
  },
};

export default Login;
