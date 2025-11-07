import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AIDietQuiz({ userId }) {
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    activity_level: "",
    goal: "",
    preferred_cuisine: "any",
    dietary_restrictions: "none",
    meals_per_day: "3",
    budget_level: "medium",
  });

  const [currentDiet, setCurrentDiet] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🧠 Fetch current diet on mount
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/current-diet/${userId}`)
      .then((res) => {
        if (res.data.success && res.data.currentDiet) {
          setCurrentDiet(res.data.currentDiet);
          setShowQuiz(false);
        } else {
          setShowQuiz(true);
        }
      })
      .catch((err) => {
        console.error("Error fetching current diet:", err);
        setShowQuiz(true);
      });
  }, [userId]);

  // 🧾 Handle quiz field changes
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // 🚀 Handle quiz submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/ai-diet", {
        ...formData,
        user_id: userId,
      });

      if (res.data.success && res.data.recommended_plan) {
        setCurrentDiet({
          ...res.data.recommended_plan,
          diet_type: res.data.diet_type,
          message: res.data.message,
        });
        setShowQuiz(false);
      } else {
        alert("AI did not return a valid recommendation.");
      }
    } catch (err) {
      console.error("Error calling AI service:", err);
      alert("Failed to get diet recommendation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Allow user to retake quiz
  const handleRegenerate = () => setShowQuiz(true);

  return (
    <div style={styles.pageContainer}>
      <h2 style={styles.title}>🧠 AI Diet Plan Generator</h2>

      {/* Show current diet if available */}
      {currentDiet && !showQuiz && (
        <div style={styles.resultBox}>
          <h3>🥗 Your AI-Recommended Diet Plan</h3>
          <p>
            <strong>Diet Type:</strong> {currentDiet.diet_type || currentDiet.diet_name}
          </p>
          <p>
            <strong>Description:</strong> {currentDiet.description}
          </p>
          {currentDiet.message && (
            <p style={{ color: "green" }}>
              <strong>AI Message:</strong> {currentDiet.message}
            </p>
          )}

          <button style={styles.regenButton} onClick={handleRegenerate}>
            🔁 Regenerate Diet Plan
          </button>
        </div>
      )}

      {/* Show quiz only when needed */}
      {showQuiz && (
        <form onSubmit={handleSubmit} style={styles.formContainer}>
          <label>Age:</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
          />

          <label>Gender:</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <label>Activity Level:</label>
          <select
            name="activity_level"
            value={formData.activity_level}
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>

          <label>Goal:</label>
          <select
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            <option value="weight_loss">Weight Loss</option>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="maintenance">Maintenance</option>
            <option value="fat_loss">Fat Loss</option>
            <option value="endurance">Endurance</option>
            <option value="diabetes management">Diabetes Management</option>
            <option value="pcos management">PCOS Management</option>
          </select>

          <label>Preferred Cuisine:</label>
          <select
            name="preferred_cuisine"
            value={formData.preferred_cuisine}
            onChange={handleChange}
          >
            <option value="any">Any</option>
            <option value="asian">Asian</option>
            <option value="mediterranean">Mediterranean</option>
            <option value="indian">Indian</option>
            <option value="vegan">Vegan</option>
          </select>

          <label>Dietary Restrictions:</label>
          <select
            name="dietary_restrictions"
            value={formData.dietary_restrictions}
            onChange={handleChange}
          >
            <option value="none">None</option>
            <option value="gluten_free">Gluten-Free</option>
            <option value="lactose_free">Lactose-Free</option>
            <option value="nut_free">Nut-Free</option>
          </select>

          <label>Meals per Day:</label>
          <select
            name="meals_per_day"
            value={formData.meals_per_day}
            onChange={handleChange}
          >
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>

          <label>Budget Level:</label>
          <select
            name="budget_level"
            value={formData.budget_level}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? "Generating..." : "Generate My Diet Plan"}
          </button>
        </form>
      )}

      <button style={styles.backButton} onClick={() => navigate("/dashboard")}>
        🔙 Back
      </button>
    </div>
  );
}

const styles = {
  pageContainer: {
    background: "linear-gradient(to right, #f0f8ff, #ffe4e1)",
    minHeight: "100vh",
    padding: "50px 20px",
    textAlign: "center",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "30px",
    color: "#333",
    fontWeight: "bold",
  },
  formContainer: {
    display: "grid",
    gap: "15px",
    maxWidth: "500px",
    margin: "auto",
    background: "#fff",
    padding: "25px",
    borderRadius: "15px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
  },
  resultBox: {
    marginTop: "30px",
    backgroundColor: "#f9f9f9",
    borderRadius: "12px",
    padding: "25px",
    display: "inline-block",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    textAlign: "left",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
  },
  regenButton: {
    marginTop: "15px",
    backgroundColor: "#2196F3",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  backButton: {
    marginTop: "40px",
    backgroundColor: "#f44336",
    color: "#fff",
    padding: "10px 25px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default AIDietQuiz;
