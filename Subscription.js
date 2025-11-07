import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Subscription = ({ userId }) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([
    { subscription_id: 1, name: "1 Month Plan", price: 499, duration_months: 1 },
    { subscription_id: 2, name: "3 Month Plan", price: 1299, duration_months: 3 },
    { subscription_id: 3, name: "6 Month Plan", price: 2399, duration_months: 6 },
    { subscription_id: 4, name: "1 Year Plan", price: 4499, duration_months: 12 },
  ]);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch current user's active subscription
    axios
      .get(`http://localhost:5000/api/subscriptions/current/${userId}`)
      .then((res) => {
        if (res.data.currentPlan) setCurrentPlan(res.data.currentPlan);
      })
      .catch((err) => console.error(err));
  }, [userId]);

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      setMessage("Please select a plan first.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/subscribe", {
        userId,
        planId: selectedPlan.subscription_id,
      });

      if (res.data.status === "success") {
        setCurrentPlan(res.data.currentPlan);
        setMessage("Subscribed successfully!");
      } else {
        setMessage(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("Subscription failed.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2 style={{ color: "#0072FF" }}>💳 Choose Your Meal Plan</h2>

      {currentPlan && (
        <div style={{ marginBottom: "30px", color: "#FF5722" }}>
          Current Plan: {currentPlan.name} ({currentPlan.duration_months} Month(s))
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        {plans.map((plan) => (
          <div
            key={plan.subscription_id}
            onClick={() => setSelectedPlan(plan)}
            style={{
              border:
                selectedPlan?.subscription_id === plan.subscription_id
                  ? "3px solid #0072FF"
                  : "1px solid #ccc",
              borderRadius: "12px",
              padding: "20px",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            <h3 style={{ color: "#0072FF" }}>{plan.name}</h3>
            <p>{plan.duration_months} Month(s)</p>
            <p>₹{plan.price}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubscribe}
        style={{
          marginTop: "20px",
          padding: "12px 25px",
          borderRadius: "8px",
          backgroundColor: "#4CAF50",
          color: "white",
          cursor: "pointer",
        }}
      >
        Subscribe & Pay
      </button>

      {message && <p style={{ color: "red" }}>{message}</p>}
    </div>
  );
};

export default Subscription;