import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Signup({ setUserId }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/signup", { full_name: fullName, email, password });
      if (res.data.user_id) {
        setUserId(res.data.user_id);
        navigate("/dashboard");
      } else {
        alert("Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error signing up");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dietly 🍏</h1>
      <h2 style={styles.subtitle}>Sign Up</h2>
      <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} style={styles.input} />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} />
      <button onClick={handleSignup} style={styles.button}>Sign Up</button>
      <p style={styles.linkText}>
        Already have an account? <span style={styles.link} onClick={() => navigate("/")}>Login</span>
      </p>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", padding: "80px 20px", background: "#e6f2ff", minHeight: "100vh" },
  title: { fontSize: "3rem", color: "#4CAF50", marginBottom: "20px" },
  subtitle: { color: "#ff6347", marginBottom: "30px" },
  input: { display: "block", margin: "15px auto", padding: "12px", width: "300px", borderRadius: "10px", border: "1px solid #ccc" },
  button: { padding: "12px 30px", backgroundColor: "#ff6347", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" },
  linkText: { marginTop: "15px" },
  link: { color: "#4CAF50", cursor: "pointer", textDecoration: "underline" },
};

export default Signup;
