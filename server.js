const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root", // your MySQL password
  database: "dietly",
});

db.connect((err) => {
  if (err) console.error("❌ Error connecting to MySQL:", err);
  else console.log("✅ Connected to MySQL database 'dietly'");
});

// ✅ Test route
app.get("/", (req, res) => res.send("Dietly backend is running 🚀"));

// ✅ Signup
app.post("/api/signup", async (req, res) => {
  const { full_name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query =
      "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)";
    db.query(query, [full_name, email, hashedPassword], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "DB error" });
      }
      res.json({ user_id: result.insertId });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (results.length === 0) return res.json({});
    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (match) res.json({ user_id: user.user_id, full_name: user.full_name });
    else res.json({});
  });
});

// ✅ Diet Plans API
app.get("/api/diet-plans/:userId", (req, res) => {
  const userId = req.params.userId;
  db.query(
    "SELECT * FROM diet_plans WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(results);
    }
  );
});

app.post("/api/diet-plans", (req, res) => {
  const {
    user_id,
    daily_calories,
    preferred_cuisine,
    restrictions,
    start_date,
    end_date,
  } = req.body;

  const query = `
    INSERT INTO diet_plans (user_id, daily_calories, preferred_cuisine, restrictions, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [user_id, daily_calories, preferred_cuisine, restrictions, start_date, end_date],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ diet_plan_id: result.insertId });
    }
  );
});

// GET current active subscription for a user
app.get("/api/subscriptions/current/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const [rows] = await db.promise().query(
      `SELECT s.*, p.name AS plan_name, p.price, p.duration_months
       FROM subscriptions s
       JOIN subscription_plans p ON s.plan_type = p.subscription_id
       WHERE s.user_id = ? AND s.is_active = 1
       ORDER BY s.start_date DESC LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) return res.json({ currentPlan: null });

    res.json({ currentPlan: rows[0] });
  } catch (err) {
    console.error("Fetch current subscription error:", err);
    res.status(500).json({ currentPlan: null });
  }
});

// POST subscribe a plan
app.post("/api/subscribe", async (req, res) => {
  const { userId, planId } = req.body;

  if (!userId || !planId) {
    return res.status(400).json({ status: "failed", message: "Missing fields" });
  }

  try {
    // Get plan info
    const [planRows] = await db.promise().query(
      "SELECT name, duration_months, price FROM subscription_plans WHERE subscription_id = ?",
      [planId]
    );

    if (planRows.length === 0) {
      return res.status(400).json({ status: "failed", message: "Invalid plan" });
    }

    const plan = planRows[0];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + plan.duration_months);

    // Insert into subscriptions
    // Deactivate old subscriptions for this user
    await db.promise().query("UPDATE subscriptions SET is_active = 0 WHERE user_id = ?", [userId]);
    const [subResult] = await db.promise().query(
      "INSERT INTO subscriptions (user_id, plan_type, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?)",
      [
        userId,
        planId,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
        1,
      ]
    );

    // Update users table
    await db.promise().query(
      "UPDATE users SET subscription_id = ? WHERE user_id = ?",
      [planId, userId]
    );

    res.json({
      status: "success",
      message: "Subscribed successfully!",
      subscriptionId: subResult.insertId,
      currentPlan: { ...plan, subscription_id: planId },
    });
  } catch (err) {
    console.error("Subscribe error:", err);
    res.status(500).json({ status: "failed", message: "Server error" });
  }
});

const { spawn } = require("child_process");

// 🧠 AI Diet Recommendation Route
app.post("/api/ai-diet", (req, res) => {
  const { user_id, ...answers } = req.body;
  console.log("📩 Received AI Diet Request:", answers);

  // Spawn the Python process with JSON argument
  const pyProcess = spawn("python", ["ai_model.py", JSON.stringify(answers)]);

  let stdout = "";
  let stderr = "";

  pyProcess.stdout.on("data", (data) => (stdout += data.toString()));
  pyProcess.stderr.on("data", (data) => (stderr += data.toString()));

  pyProcess.on("close", (code) => {
    console.log("🧠 Python process closed with code:", code);

    if (stderr) console.error("🐍 Python Error:", stderr);
    console.log("📤 Python Output:", stdout);

    let result;
    try {
      result = JSON.parse(stdout.trim()); // parse cleanly
    } catch (err) {
      console.error("❌ Invalid Python output:", stdout);
      return res.status(500).json({
        error: "AI model did not return valid JSON output",
        raw_output: stdout,
      });
    }

    const { recommended_plan_id, diet_type, message } = result;
    if (!recommended_plan_id) {
      console.error("❌ No recommended_plan_id returned from Python!");
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    // ✅ Update user’s diet plan in DB
    db.query(
      "UPDATE users SET diet_plan_id = ? WHERE user_id = ?",
      [recommended_plan_id, user_id],
      (err2) => {
        if (err2) {
          console.error("❌ DB update error:", err2);
          return res
            .status(500)
            .json({ error: "Failed to update user's diet plan" });
        }

        // ✅ Fetch diet plan info
        db.query(
          "SELECT * FROM diet_plans WHERE diet_plan_id = ?",
          [recommended_plan_id],
          (err3, planRes) => {
            if (err3 || planRes.length === 0) {
              console.error("❌ Failed to fetch plan:", err3);
              return res
                .status(500)
                .json({ error: "Failed to retrieve plan info" });
            }

            console.log("✅ Sending AI diet result:", planRes[0]);

            return res.json({
              success: true,
              message: message,
              recommended_plan: planRes[0],
            });
          }
        );
      }
    );
  });
});


// 🌿 Fetch user's current assigned diet plan
app.get("/api/current-diet/:userId", (req, res) => {
  const userId = req.params.userId;

  // ✅ Match actual column names
  const query = `
    SELECT d.diet_name, d.description
    FROM users u
    JOIN diet_plans d ON u.diet_plan_id = d.diet_plan_id
    WHERE u.user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching current diet:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (results.length > 0) {
      return res.json({
        success: true,
        currentDiet: results[0],
      });
    } else {
      return res.json({
        success: false,
        currentDiet: null,
        message: "No diet plan assigned yet.",
      });
    }
  });
});
app.post("/api/subscribe", async (req, res) => {
  const { userId, planName, price } = req.body;

  if (!userId || !planName || !price) {
    return res.status(400).json({ status: "failed", message: "Missing fields" });
  }

  try {
    // create a payment id and args
    const paymentId = Math.floor(Math.random() * 1000000);
    const amountStr = String(price);

    // spawn Java: java -cp . PaymentService <paymentId> <amountPaid> <totalAmount>
    const javaArgs = ["-cp", ".", "PaymentService", String(paymentId), amountStr, amountStr];
    const javaProcess = require("child_process").spawn("java", javaArgs, { windowsHide: true });

    let stdout = "";
    let stderr = "";

    // timeout to avoid hanging processes
    const timeoutMs = 8000;
    const timer = setTimeout(() => {
      javaProcess.kill();
    }, timeoutMs);

    javaProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    javaProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    javaProcess.on("close", (code) => {
      clearTimeout(timer);
      if (stderr && stderr.trim().length) console.error("Java Error:", stderr);

      stdout = stdout.trim();
      console.log("Java Output:", stdout);

      // parse output safely
      let parsed;
      try {
        parsed = JSON.parse(stdout || "{}");
      } catch (err) {
        console.error("Failed to parse Java output:", err, "raw:", stdout);
        return res.status(500).json({ status: "failed", message: "Invalid Java response" });
      }

      if (!parsed.status || parsed.status !== "success") {
        // payment failed according to Java
        return res.json({ status: "failed", message: parsed.message || "Payment failed" });
      }

      // Payment success -> persist subscription and generate daily meals
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30);

      db.query(
        "INSERT INTO subscriptions (user_id, plan_type, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?)",
        [
          userId,
          planName,
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0],
          1,
        ],
        (err, result) => {
          if (err) {
            console.error("DB Insert Error:", err);
            return res.status(500).json({ status: "failed", message: "Database error" });
          }

          const subscriptionId = result.insertId;

          // Insert demo daily meals (3 random ones)
          db.query("SELECT * FROM meals ORDER BY RAND() LIMIT 3", (err2, meals) => {
            if (err2) {
              console.error("Meal select error:", err2);
              return res.json({
                status: "success",
                message: parsed.message || "Subscription saved",
                transactionId: parsed.transactionId,
                subscriptionId,
                meals: [],
              });
            }

            const today = startDate.toISOString().split("T")[0];
            const insertRows = meals.map((m) => [userId, m.meal_name || m.name || "", planName, today]);

            db.query(
              "INSERT INTO daily_meals (user_id, meal_name, plan_type, meal_date) VALUES ?",
              [insertRows],
              (err3) => {
                if (err3) console.error("daily_meals insert error:", err3);

                return res.json({
                  status: "success",
                  message: parsed.message || "Subscribed and daily meals generated!",
                  transactionId: parsed.transactionId,
                  subscriptionId,
                  meals,
                });
              }
            );
          });
        }
      );
    });

  } catch (err) {
    console.error("Subscribe handler error:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// --------------------- DELIVERY ETA ---------------------
app.get("/api/delivery/:distanceKm", async (req, res) => {
  const distanceKm = req.params.distanceKm;
  try {
    const eta = await new Promise((resolve, reject) => {
      const cProcess = spawn("./DeliveryETA", [distanceKm]);
      cProcess.stdout.on("data", (data) =>
        resolve(parseInt(data.toString().trim()))
      );
      cProcess.stderr.on("data", (err) => reject(err.toString()));
    });
    res.json({ etaMinutes: eta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delivery calculation failed" });
  }
});
// ✅ Daily Meal Plan endpoint (fixed)
app.get("/api/daily-meal-plan/:user_id", async (req, res) => {
  const userId = req.params.user_id;

  try {
    // 1️⃣ Get user's diet_plan_id
    const [userRows] = await db.promise().query(
      "SELECT diet_plan_id FROM users WHERE user_id = ?",
      [userId]
    );

    if (userRows.length === 0 || !userRows[0].diet_plan_id) {
      return res.json({ meals: [], message: "No diet plan assigned yet." });
    }

    const dietPlanId = userRows[0].diet_plan_id;

    // 2️⃣ Get the diet_type (name) from diet_plans
    const [planRows] = await db.promise().query(
      "SELECT diet_name AS diet_type FROM diet_plans WHERE diet_plan_id = ?",
      [dietPlanId]
    );

    if (planRows.length === 0) {
      return res.json({ meals: [], message: "Diet plan not found." });
    }

    const dietType = planRows[0].diet_type;

    // 3️⃣ Fetch 3 unique meals from meals table with that diet_type
    const [mealRows] = await db.promise().query(
      "SELECT DISTINCT meal_name, description, calories, protein_g, carbs_g, fats_g, price, image_url FROM meals WHERE diet_type = ? ORDER BY RAND() LIMIT 3",
      [dietType]
    );

    if (mealRows.length === 0) {
      return res.json({ meals: [], message: `No meals found for ${dietType}.` });
    }

    res.json({
      status: "success",
      dietType,
      meals: mealRows,
      message: `Here are your meals for the ${dietType} diet!`
    });

  } catch (err) {
    console.error("Daily meal error:", err);
    res.status(500).json({ status: "failed", message: "Server error" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
