import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login({ setUserId }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/login", { email, password });
      if (res.data.user_id) {
        setUserId(res.data.user_id);
        navigate("/dashboard");
      } else {
        alert("Invalid login credentials");
      }
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dietly 🍏</h1>
      <h2 style={styles.subtitle}>Login</h2>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} />
      <button onClick={handleLogin} style={styles.button}>Login</button>
      <p style={styles.linkText}>
        Don't have an account? <span style={styles.link} onClick={() => navigate("/signup")}>Sign up</span>
      </p>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", padding: "80px 20px", background: "#f0f8ff", minHeight: "100vh" },
  title: { fontSize: "3rem", color: "#ff6347", marginBottom: "20px" },
  subtitle: { color: "#4CAF50", marginBottom: "30px" },
  input: { display: "block", margin: "15px auto", padding: "12px", width: "300px", borderRadius: "10px", border: "1px solid #ccc" },
  button: { padding: "12px 30px", backgroundColor: "#4CAF50", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" },
  linkText: { marginTop: "15px" },
  link: { color: "#ff6347", cursor: "pointer", textDecoration: "underline" },
};

export default Login;
