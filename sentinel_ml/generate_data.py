import pandas as pd
import numpy as np
import random

np.random.seed(42)

n = 500

data = {
    "severity_score": np.random.randint(1, 11, n),
    "code_complexity": np.random.randint(1, 11, n),
    "lines_changed": np.random.randint(5, 500, n),
    "developer_feedbacks": np.random.randint(0, 6, n),
    "test_coverage": np.random.uniform(0.3, 1.0, n),
    "past_acceptance_rate": np.random.uniform(0.2, 1.0, n),
    "contains_security_fix": np.random.choice([0, 1], n),
    "review_time": np.random.uniform(0.5, 48.0, n),
}

df = pd.DataFrame(data)

# --- Feedback score ---
df["feedback_score"] = (
    5 - df["developer_feedbacks"] * 0.5 +
    df["test_coverage"] * 2 +
    df["past_acceptance_rate"]
).clip(1, 5).round(1)

# --- Priority ---
def assign_priority(row):
    if row["severity_score"] >= 8:
        return "critical"
    elif row["severity_score"] >= 6:
        return "high"
    elif row["severity_score"] >= 4:
        return "medium"
    else:
        return "low"

df["priority"] = df.apply(assign_priority, axis=1)

# --- Acceptance ---
df["accepted"] = (
    (df["developer_feedbacks"] < 3)
    & (df["test_coverage"] > 0.6)
    & (df["past_acceptance_rate"] > 0.5)
    & (df["severity_score"] < 9)
).astype(int)

df.to_csv("synthetic_pr_data.csv", index=False)
print(df.head())
print("\n✅ Dataset created with", len(df), "entries.")
