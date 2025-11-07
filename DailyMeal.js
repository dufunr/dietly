import React, { useEffect, useState } from "react";
import axios from "axios";

const DailyMeal = ({ userId }) => {
  const [meals, setMeals] = useState([]);
  const [dietType, setDietType] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:5000/api/daily-meal-plan/${userId}`)
      .then((res) => {
        if (res.data.status === "success") {
          setMeals(res.data.meals);
          setDietType(res.data.dietType);
          setMessage(res.data.message);
        } else {
          setMessage(res.data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        setMessage("Error fetching meals.");
      });
  }, [userId]);

  return (
    <div
      style={{
        textAlign: "center",
        fontFamily: "Poppins, sans-serif",
        padding: "40px",
        color: "#333",
      }}
    >
      <h2
        style={{
          background: "linear-gradient(90deg, #00C6FF, #0072FF)",
          color: "white",
          display: "inline-block",
          padding: "10px 25px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        🍽 Your Daily Meal Plan
      </h2>

      {meals.length > 0 ? (
        <>
          <h3 style={{ color: "#0072FF" }}>{dietType} Diet</h3>
          <p style={{ marginTop: "10px", fontStyle: "italic" }}>{message}</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginTop: "30px",
            }}
          >
            {meals.map((meal, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  padding: "20px",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <h4 style={{ color: "#0072FF" }}>{meal.meal_name}</h4>
                <p>{meal.description}</p>
                <p>
                  <strong>{meal.calories}</strong> kcal | Protein:{" "}
                  {meal.protein_g}g | Carbs: {meal.carbs_g}g | Fats:{" "}
                  {meal.fats_g}g
                </p>
                <p style={{ color: "#4CAF50", fontWeight: "bold" }}>
                  ₹{meal.price}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p
          style={{
            color: "#C62828",
            fontWeight: "bold",
            marginTop: "40px",
          }}
        >
          ❌ {message}
        </p>
      )}
    </div>
  );
};

export default DailyMeal;