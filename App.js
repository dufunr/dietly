import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/SignUp";
import Dashboard from "./components/Dashboard";
import Subscription from "./components/Subscription";
import AIQuiz from "./components/AIDietQuiz";
import Analytics from "./components/Analytics";
import DailyMeal from "./components/DailyMeal";


function App() {
  const [userId, setUserId] = useState(null); // logged-in user

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setUserId={setUserId} />} />
        <Route path="/signup" element={<Signup setUserId={setUserId} />} />
        <Route path="/dashboard" element={userId ? <Dashboard userId={userId} /> : <Navigate to="/" />} />
        <Route path="/subscribe" element={userId ? <Subscription userId={userId} /> : <Navigate to="/" />} />
        <Route path="/ai-quiz" element={userId ? <AIQuiz userId={userId} /> : <Navigate to="/" />} />
        <Route path="/analytics" element={userId ? <Analytics userId={userId} /> : <Navigate to="/" />} />
        <Route path="/daily-meal" element={userId ? <DailyMeal userId={userId} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
export default App;
