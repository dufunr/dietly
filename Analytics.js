import React, { useEffect, useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

function Analytics() {
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [dietPlanData, setDietPlanData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    // Fetch subscriptions per plan
    axios
      .get("http://localhost:8000/subscriptions")
      .then((res) => setSubscriptionData(res.data))
      .catch((err) => console.error("Error fetching subscriptions:", err));

    // Fetch meals per diet type
    axios
      .get("http://localhost:8000/diet-plans")
      .then((res) => setDietPlanData(res.data))
      .catch((err) => console.error("Error fetching diet plans:", err));

    // Fetch weekly new subscribers
    axios
      .get("http://localhost:8000/weekly-subs")
      .then((res) => setWeeklyData(res.data))
      .catch((err) => console.error("Error fetching weekly subscribers:", err));
  }, []);

  // Subscriptions chart
  const subscriptionChart = {
    labels: subscriptionData.map((d) => d.plan_name),
    datasets: [
      {
        label: "Number of Subscribers",
        data: subscriptionData.map((d) => d.count),
        backgroundColor: ["#4CAF50", "#FF6347", "#FFB74D", "#42A5F5"],
        borderRadius: 10,
      },
    ],
  };

  // Diet plans chart
  const dietPlanChart = {
    labels: dietPlanData.map((d) => d.diet_type),
    datasets: [
      {
        label: "Number of Meals",
        data: dietPlanData.map((d) => d.count),
        backgroundColor: [
          "#FFB74D",
          "#4CAF50",
          "#42A5F5",
          "#FF6347",
          "#BA68C8",
          "#26A69A",
        ],
        borderRadius: 10,
      },
    ],
  };

  // Weekly subscribers line chart
  const lineChartData = {
    labels: weeklyData.map((d) => `Week ${d.week}`),
    datasets: [
      {
        label: "New Subscribers",
        data: weeklyData.map((d) => d.new_subs),
        borderColor: "#FF6347",
        backgroundColor: "rgba(255,99,71,0.2)",
        tension: 0.4,
      },
    ],
  };

  return (
    <div
      style={{
        padding: "40px 20px",
        minHeight: "100vh",
        background: "#f0f8ff",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontSize: "2.5rem",
          color: "#FF6347",
          marginBottom: "30px",
        }}
      >
        📊 Dietly Analytics Dashboard
      </h2>

      {/* Subscriptions per plan */}
      <div
        style={{
          maxWidth: "700px",
          margin: "30px auto",
          padding: "20px",
          background: "#fff0f5",
          borderRadius: "15px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ color: "#4CAF50", marginBottom: "15px" }}>
          Subscriptions per Plan
        </h3>
        <Bar
          data={subscriptionChart}
          options={{ responsive: true, plugins: { legend: { position: "top" } } }}
        />
      </div>

      {/* Meals per diet type */}
      <div
        style={{
          maxWidth: "700px",
          margin: "30px auto",
          padding: "20px",
          background: "#fff0f5",
          borderRadius: "15px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ color: "#4CAF50", marginBottom: "15px" }}>
          Meals per Diet Type
        </h3>
        <Pie
          data={dietPlanChart}
          options={{ responsive: true, plugins: { legend: { position: "right" } } }}
        />
      </div>

      {/* Weekly new subscribers */}
      <div
        style={{
          maxWidth: "700px",
          margin: "30px auto",
          padding: "20px",
          background: "#fff0f5",
          borderRadius: "15px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ color: "#4CAF50", marginBottom: "15px" }}>
          New Subscribers Over Weeks
        </h3>
        <Line
          data={lineChartData}
          options={{ responsive: true, plugins: { legend: { position: "top" } } }}
        />
      </div>
    </div>
  );
}

export default Analytics;
