import React from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to Your Dietly Dashboard 🍽️</h1>
      <p style={styles.subtitle}>Choose what you’d like to do:</p>

      <div style={styles.buttonsContainer}>
        <button style={styles.button} onClick={() => navigate("/ai-quiz")}>
          🧠 AI Diet Selector Quiz
        </button>
        <button style={styles.button} onClick={() => navigate("/subscribe")}>
          💳 Subscribe to Meal Plan
        </button>
        <button style={styles.button} onClick={() => navigate("/daily-meal")}>
          🍱 View Daily Meal Plan
        </button>
        <button style={styles.button} onClick={() => navigate("/analytics")}>
          📊 View Analytics
        </button>
      </div>

      <button
        style={styles.backButton}
        onClick={() => { localStorage.clear(); navigate("/"); }}
      >
        🔙 Logout
      </button>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to right, #a8edea, #fed6e3)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "10px",
    color: "#333",
  },
  subtitle: {
    fontSize: "1.2rem",
    marginBottom: "30px",
    color: "#444",
  },
  buttonsContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    maxWidth: "500px",
  },
  button: {
    padding: "15px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "0.3s",
  },
  backButton: {
    marginTop: "40px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default Dashboard;
