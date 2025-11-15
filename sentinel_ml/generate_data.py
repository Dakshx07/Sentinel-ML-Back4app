# generate_data.py
import pandas as pd
import numpy as np

np.random.seed(42)
n = 5000

data = {
    "severity_score": np.random.uniform(1, 10, n),
    "code_complexity": np.random.uniform(1, 10, n),
    "lines_changed": np.random.randint(1, 500, n),
    "developer_feedbacks": np.random.randint(0, 10, n),
    "test_coverage": np.random.uniform(0, 1, n),
    "past_acceptance_rate": np.random.uniform(0, 1, n),
    "contains_security_fix": np.random.choice([0, 1], n, p=[0.7, 0.3]),
    "review_time": np.random.uniform(0.5, 24, n),
    "feedback_score": np.random.uniform(1, 5, n),
    "priority": np.random.choice(["low", "medium", "high", "critical"], n, p=[0.4, 0.35, 0.2, 0.05]),
    "accepted": np.random.choice([0, 1], n, p=[0.3, 0.7]),
}

df = pd.DataFrame(data)
df.to_csv("synthetic_pr_data.csv", index=False)
print("synthetic_pr_data.csv created")