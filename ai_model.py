import sys
import json
import re
import random
import numpy as np
import pandas as pd
import mysql.connector
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

def respond_json(payload):
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()

def canonical(s):
    """Normalize strings for matching: lower, strip, replace _, -, multiple spaces -> single, remove non-alnum"""
    if s is None:
        return ""
    s = str(s).strip().lower()
    s = s.replace("_", " ").replace("-", " ")
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"[^a-z0-9 ]", "", s)  # keep letters, numbers, spaces
    s = s.strip()
    return s

def log_terminal(msg):
    """Log to terminal (stderr) for debugging"""
    print(f"[DIET-ML] {msg}", file=sys.stderr)

# -------------------- 1) Read input JSON --------------------
if len(sys.argv) < 2:
    respond_json({"error": "No input data received"})
    sys.exit(1)

try:
    input_data = json.loads(sys.argv[1])
except Exception as e:
    respond_json({"error": f"Invalid JSON input: {str(e)}"})
    sys.exit(1)

# normalize input keys/values
for k in list(input_data.keys()):
    v = input_data[k]
    if isinstance(v, str):
        input_data[k] = v.strip()

# backward-compatibility synonyms
if "restrictions" in input_data and "dietary_restrictions" not in input_data:
    input_data["dietary_restrictions"] = input_data.pop("restrictions")

# canonical normalized version for goal (used for matching)
user_goal_raw = input_data.get("goal", "") or ""
user_goal_canon = canonical(user_goal_raw)

log_terminal(f"Processing request for goal: '{user_goal_raw}' (canonical: '{user_goal_canon}')")

# -------------------- 2) Load dataset --------------------
CSV_PATH = "diet_dataset_clean(1).csv"  # change if needed
try:
    df = pd.read_csv(CSV_PATH)
    log_terminal(f"Loaded dataset with {len(df)} records")
except Exception as e:
    respond_json({"error": f"Failed to read CSV: {str(e)}"})
    sys.exit(1)

# normalize text columns in dataframe
for c in df.columns:
    if df[c].dtype == "object":
        df[c] = df[c].astype(str).str.strip().str.lower()

# -------------------- 3) Validate expected columns --------------------
expected = [
    'age','gender','activity_level','goal',
    'preferred_cuisine','dietary_restrictions',
    'meals_per_day','budget_level','recommended_diet'
]
missing = [c for c in expected if c not in df.columns]
if missing:
    respond_json({"error": f"CSV missing columns: {missing}"})
    sys.exit(1)

# -------------------- 4) Encode --------------------
label_encoders = {}
X_df = df.copy()
for col in X_df.columns:
    if col == 'recommended_diet':
        continue
    if X_df[col].dtype == 'object':
        le = LabelEncoder()
        X_df[col] = le.fit_transform(X_df[col].astype(str))
        label_encoders[col] = le

target_enc = LabelEncoder()
y = target_enc.fit_transform(df['recommended_diet'].astype(str))
X = X_df.drop(columns=['recommended_diet'])

# add goal weight duplicates to emphasize goal
if 'goal' in X.columns:
    X['goal_w1'] = X['goal']
    X['goal_w2'] = X['goal']

# -------------------- 5) Train model --------------------
try:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(n_estimators=300, max_depth=12, class_weight='balanced', random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    train_acc = model.score(X_train, y_train)
    test_acc = model.score(X_test, y_test)
    log_terminal(f"Model trained successfully - Train accuracy: {train_acc:.3f}, Test accuracy: {test_acc:.3f}")
except Exception as e:
    respond_json({"error": f"Model training failed: {str(e)}"})
    sys.exit(1)

# -------------------- 6) Prepare goal -> diet mapping (canonical) --------------------
GOAL_DIET_MAP = {
    "weight loss": ["low carb", "fat loss", "keto", "intermittent fasting", "detox"],
    "muscle gain": ["high protein", "bodybuilder", "weight gain"],
    "fat loss": ["fat loss", "paleo", "low carb", "keto"],
    "endurance": ["endurance athlete", "zone diet", "balanced"],
    "maintenance": ["balanced", "flexitarian", "whole30"],
    "pcos management": ["PCOS-Friendly", "pcos-friendly", "pcos_friendly", "pcosfriendly"],
    "diabetes management": ["diabetic-friendly", "diabetic friendly", "diabeticfriendly"],
}

# canonicalize the map for exact matching later
GOAL_DIET_MAP_CANON = {}
for g, diets in GOAL_DIET_MAP.items():
    GOAL_DIET_MAP_CANON[canonical(g)] = [canonical(d) for d in diets]

# helper: canonical forms of model classes (target_enc.classes_)
model_diets = list(target_enc.classes_)
model_diets_canon = {canonical(d): d for d in model_diets}
log_terminal(f"Available diet plans in model: {model_diets}")

# -------------------- 7) Encode user input vector --------------------
def encode_val(col, raw_val):
    """Encode value using label encoders; fallback to mode from df"""
    if col.startswith("goal_w"):
        return None
    if col in label_encoders:
        le = label_encoders[col]
        sval = str(raw_val).strip().lower() if raw_val is not None else ""
        if sval in le.classes_:
            return int(le.transform([sval])[0])
        else:
            try:
                mode_val = df[col].astype(str).mode().iloc[0]
                return int(le.transform([mode_val])[0])
            except Exception:
                return 0
    else:
        try:
            return float(raw_val) if raw_val is not None and raw_val != "" else float(df[col].mode().iloc[0])
        except Exception:
            return 0.0

user_row = {}
goal_enc_val = None
for col in X.columns:
    if col.startswith("goal_w"):
        user_row[col] = None
        continue
    raw = None
    if col in input_data:
        raw = input_data.get(col)
    elif col == "dietary_restrictions" and "restrictions" in input_data:
        raw = input_data.get("restrictions")
    elif col == "meals_per_day" and "meals_per_day" in input_data:
        raw = input_data.get("meals_per_day")
    else:
        raw = None
    enc = encode_val(col, raw)
    user_row[col] = enc
    if col == "goal":
        goal_enc_val = enc

# fill weighted goals
for col in X.columns:
    if col.startswith("goal_w"):
        user_row[col] = goal_enc_val if goal_enc_val is not None else 0

user_input_df = pd.DataFrame([user_row], columns=X.columns)
log_terminal(f"User input encoded successfully")

# -------------------- 8) Apply rule-based selection with randomization --------------------
final_diet_label = None
overridden = False
confidence_out = None
prediction_method = "ML"  # track which method was used

gcanon = user_goal_canon

# Check if goal has rule-based mapping
if gcanon in GOAL_DIET_MAP_CANON:
    allowed_canon_diets = GOAL_DIET_MAP_CANON[gcanon]
    log_terminal(f"Rule-based mapping found for goal '{user_goal_raw}': {allowed_canon_diets}")
    
    # Find all matching diets from allowed list that exist in model
    matching_diets = []
    for ad in allowed_canon_diets:
        if ad in model_diets_canon:
            matching_diets.append(model_diets_canon[ad])
        else:
            # try substring matching
            for md_canon, md_orig in model_diets_canon.items():
                if ad in md_canon or md_canon in ad:
                    if md_orig not in matching_diets:
                        matching_diets.append(md_orig)
    
    if matching_diets:
        # RANDOMLY select from matching diets
        final_diet_label = random.choice(matching_diets)
        overridden = True
        confidence_out = 1.0
        prediction_method = "RULE-BASED"
        log_terminal(f"✓ RULE-BASED SELECTION: Randomly selected '{final_diet_label}' from {len(matching_diets)} options: {matching_diets}")
    else:
        log_terminal(f"✗ Rule-based: No matching diets found in model for {allowed_canon_diets}")
else:
    log_terminal(f"No rule-based mapping exists for goal '{user_goal_raw}'")

# -------------------- 9) Fallback to ML prediction --------------------
if not overridden:
    try:
        probs = model.predict_proba(user_input_df)[0]
        top_idx = np.argmax(probs)
        final_diet_label = target_enc.inverse_transform([top_idx])[0]
        confidence_out = float(probs[top_idx])
        prediction_method = "ML"
        log_terminal(f"✓ ML PREDICTION: '{final_diet_label}' (confidence: {confidence_out:.3f})")
        
        # Show top 3 predictions for debugging
        top3_idx = np.argsort(probs)[-3:][::-1]
        top3 = [(target_enc.inverse_transform([i])[0], probs[i]) for i in top3_idx]
        log_terminal(f"  Top 3 ML predictions: {[(d, f'{p:.3f}') for d, p in top3]}")
    except Exception as e:
        respond_json({"error": f"Prediction failed: {str(e)}"})
        sys.exit(1)

# -------------------- 10) Database lookup and response --------------------
log_terminal(f"Final recommendation: '{final_diet_label}' via {prediction_method}")

try:
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="dietly"
    )
    cur = db.cursor(dictionary=True)
    
    # Try exact match first
    cur.execute("SELECT diet_plan_id, diet_name FROM diet_plans WHERE LOWER(diet_name) = %s LIMIT 1", 
                (str(final_diet_label).lower(),))
    row = cur.fetchone()
    
    # Fallback to canonical matching
    if not row:
        cur.execute("SELECT diet_plan_id, diet_name FROM diet_plans")
        all_plans = cur.fetchall()
        final_canon = canonical(final_diet_label)
        for r in all_plans:
            if canonical(r['diet_name']) == final_canon:
                row = r
                break

    diet_plan_id = row["diet_plan_id"] if row else None
    
    if diet_plan_id:
        log_terminal(f"✓ Database lookup successful: diet_plan_id = {diet_plan_id}")
    else:
        log_terminal(f"✗ Database lookup failed: No matching diet plan found for '{final_diet_label}'")
    
    db.close()

    # Clean response for React (no debug info)
    respond_json({
        "recommended_plan_id": diet_plan_id,
        "diet_type": final_diet_label,
        "confidence": float(confidence_out) if confidence_out is not None else None,
        "message": f"Recommended diet plan: {final_diet_label}"
    })

except Exception as e:
    log_terminal(f"✗ Database error: {str(e)}")
    respond_json({
        "recommended_plan_id": None,
        "diet_type": final_diet_label,
        "confidence": float(confidence_out) if confidence_out is not None else None,
        "message": f"Recommended diet plan: {final_diet_label}"
    })
    sys.exit(0)