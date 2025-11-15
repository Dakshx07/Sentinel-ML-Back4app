# train_models.py
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import warnings
warnings.filterwarnings("ignore")

# --------- Load data ---------
DATA_PATH = Path("synthetic_pr_data.csv")
if not DATA_PATH.exists():
    raise FileNotFoundError("synthetic_pr_data.csv not found — run generate_data.py first")

df = pd.read_csv(DATA_PATH)
print("Loaded data:", df.shape)
print(df.head())

# --------- Create feedback label ----------
def feedback_bucket(score):
    if score <= 2.2:
        return "reject"
    elif score <= 3.6:
        return "major"
    else:
        return "minor"

if "feedback_score" not in df.columns:
    raise KeyError("feedback_score missing — regenerate dataset.")

df["feedback_label"] = df["feedback_score"].apply(feedback_bucket)

# --------- Class balance logging ----------
print("\nClass distribution (feedback_label):")
print(df["feedback_label"].value_counts(normalize=True))

print("\nClass distribution (priority):")
print(df["priority"].value_counts(normalize=True))

print("\nAcceptance distribution:")
print(df["accepted"].value_counts(normalize=True))

# --------- Features used by ML API ----------
NUM_FEATURES = [
    "severity_score",
    "code_complexity",
    "lines_changed",
    "developer_feedbacks",
    "test_coverage",
    "past_acceptance_rate",
    "contains_security_fix",
    "review_time",
]

X = df[NUM_FEATURES].copy()

# --------- Encode targets ----------
le_priority = LabelEncoder()
y_priority = le_priority.fit_transform(df["priority"])

le_feedback = LabelEncoder()
y_feedback = le_feedback.fit_transform(df["feedback_label"])

y_accept = df["accepted"].values

joblib.dump(le_priority, "labelencoder_priority.pkl")
joblib.dump(le_feedback, "labelencoder_feedback.pkl")

# --------- Train helper ----------
def train_and_evaluate(pipeline, param_grid, X, y, model_name):
    print(f"\n--- Training {model_name} ---")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    if param_grid:
        gs = GridSearchCV(pipeline, param_grid, cv=3, n_jobs=-1)
        gs.fit(X_train, y_train)
        best = gs.best_estimator_
        print(f"Best params: {gs.best_params_}")
    else:
        best = pipeline.fit(X_train, y_train)

    preds = best.predict(X_test)

    print("\nClassification report:")
    print(classification_report(y_test, preds))
    print("Confusion matrix:")
    print(confusion_matrix(y_test, preds))

    joblib.dump(best, f"{model_name}.pkl")
    print(f"Saved {model_name}.pkl")

    return best

# --------- Model 1: Feedback (3-class) ----------
pipe_feedback = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", GradientBoostingClassifier(random_state=42))
])
params_feedback = {
    "clf__n_estimators": [50, 100],
    "clf__max_depth": [3, 5],
    "clf__learning_rate": [0.05, 0.1]
}
train_and_evaluate(pipe_feedback, params_feedback, X, y_feedback, "model_feedback")

# --------- Model 2: Priority (4-class) ----------
pipe_priority = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", RandomForestClassifier(random_state=42, class_weight="balanced"))
])
params_priority = {
    "clf__n_estimators": [100, 200],
    "clf__max_depth": [5, 10]
}
train_and_evaluate(pipe_priority, params_priority, X, y_priority, "model_priority")

# --------- Model 3: Acceptance (binary) ----------
pipe_accept = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42))
])
params_accept = {
    "clf__C": [0.1, 1.0, 10.0]
}
train_and_evaluate(pipe_accept, params_accept, X, y_accept, "model_accept")

joblib.dump(NUM_FEATURES, "model_features.pkl")
print("\nAll done. Models + encoders saved.")
