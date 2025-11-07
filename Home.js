import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🍎 Welcome to Dietly</h1>
      <p style={styles.subtitle}>Your smart diet planning assistant</p>
      <button style={styles.button} onClick={() => navigate("/login")}>
        Start
      </button>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to bottom right, #d4fc79, #96e6a1)",
  },
  title: { fontSize: "3rem", marginBottom: "10px", color: "#333" },
  subtitle: { fontSize: "1.3rem", marginBottom: "30px", color: "#444" },
  button: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "12px 24px",
    fontSize: "1.2rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.3s",
  },
};

export default Home;
