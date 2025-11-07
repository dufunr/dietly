import axios from "axios";

// Base URL of your backend (make sure backend is running on this port)
const BASE_URL = "http://localhost:5000/api";

/* ===========================================================
   🧾 USER AUTHENTICATION
   =========================================================== */
// src/api.js

const instance = axios.create({
  baseURL: "http://localhost:5000", // your backend URL
});


/**
 * Sign up a new user
 * @param {Object} data - User details for signup
 * @returns {Promise} API response
 */
export const signUpUser = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/users`, data);
    return response.data;
  } catch (error) {
    console.error("❌ Error in signUpUser:", error);
    throw error.response?.data || error;
  }
};

/**
 * Login user
 * @param {string} email
 * @param {string} password
 * @returns {Promise} API response
 */
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/login`, { email, password });
    return response.data;
  } catch (error) {
    console.error("❌ Error in loginUser:", error);
    throw error.response?.data || error;
  }
};

/* ===========================================================
   🥗 MEALS (optional for later integration)
   =========================================================== */

/**
 * Fetch all meals from backend
 * @returns {Promise} Array of meals
 */
export const getMeals = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/meals`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching meals:", error);
    throw error.response?.data || error;
  }
};
export default instance;
/* ===========================================================
   🧩 FUTURE EXTENSIONS (ready for later)
   =========================================================== */

// Example placeholders (uncomment & use when you add these features later):

// export const getSubscriptions = async () => axios.get(`${BASE_URL}/subscriptions`);
// export const getDietPlans = async (userId) => axios.get(`${BASE_URL}/diet_plans/${userId}`);
// export const submitFeedback = async (data) => axios.post(`${BASE_URL}/feedback`, data);
