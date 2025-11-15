# train_models.py
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
import joblib
import warnings
warnings.filterwarnings("ignore")

# Load data
DATA_PATH = Path("synthetic_pr_data.csv")
if not DATA_PATH.exists():
    raise FileNotFoundError("Run generate_data.py first")
df = pd.read_csv(DATA_PATH)

# Feedback bucket
def feedback_bucket(score):
    if score <= 2.2: return "reject"
    elif score <= 3.6: return "major"
    else: return "minor"
df["feedback_label"] = df["feedback_score"].apply(feedback_bucket)

# Features
NUM_FEATURES = [
    "severity_score", "code_complexity", "lines_changed",
    "developer_feedbacks", "test_coverage", "past_acceptance_rate",
    "contains_security_fix", "review_time"
]
X = df[NUM_FEATURES].copy()

# Targets
le_priority = LabelEncoder()
y_priority = le_priority.fit_transform(df["priority"])

le_feedback = LabelEncoder()
y_feedback = le_feedback.fit_transform(df["feedback_label"])

y_accept = df["accepted"].values

# Save encoders
joblib.dump(le_priority, "labelencoder_priority.pkl")
joblib.dump(le_feedback, "labelencoder_feedback.pkl")

# Train helper
def train_and_save(pipe, params, X, y, name):
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    gs = GridSearchCV(pipe, params, cv=3, n_jobs=-1) if params else pipe
    gs.fit(X_tr, y_tr)
    best = gs.best_estimator_
    preds = best.predict(X_te)
    print(f"\n{name} - F1: {classification_report(y_te, preds, output_dict=True)['weighted avg']['f1-score']:.3f}")
    joblib.dump(best, f"{name}.pkl")

# Train 3 models
train_and_save(
    Pipeline([("scaler", StandardScaler()), ("clf", GradientBoostingClassifier(random_state=42))]),
    {"clf__n_estimators": [100], "clf__max_depth": [5]}, X, y_feedback, "model_feedback"
)

train_and_save(
    Pipeline([("scaler", StandardScaler()), ("clf", RandomForestClassifier(random_state=42, class_weight="balanced"))]),
    {"clf__n_estimators": [200]}, X, y_priority, "model_priority"
)

train_and_save(
    Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42))]),
    {"clf__C": [1.0]}, X, y_accept, "model_accept"
)

joblib.dump(NUM_FEATURES, "model_features.pkl")
print("\nAll models trained and saved!")