# ml_api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import uvicorn

app = FastAPI(title="Sentinel ML Prioritizer", version="1.0")

# Load models
feedback_model = joblib.load("model_feedback.pkl")
priority_model = joblib.load("model_priority.pkl")
accept_model = joblib.load("model_accept.pkl")
le_priority = joblib.load("labelencoder_priority.pkl")
le_feedback = joblib.load("labelencoder_feedback.pkl")
features = joblib.load("model_features.pkl")

class IssueInput(BaseModel):
    severity_score: float = 8.0
    code_complexity: float = 7.0
    lines_changed: int = 100
    developer_feedbacks: int = 2
    test_coverage: float = 0.6
    past_acceptance_rate: float = 0.8
    contains_security_fix: int = 1
    review_time: float = 5.0

    class Config:
        schema_extra = {
            "example": {
                "severity_score": 9.0,
                "code_complexity": 8.0,
                "lines_changed": 150,
                "developer_feedbacks": 3,
                "test_coverage": 0.4,
                "past_acceptance_rate": 0.7,
                "contains_security_fix": 1,
                "review_time": 6.0
            }
        }

@app.post("/predict")
async def predict(input: IssueInput):
    X = np.array([[getattr(input, f) for f in features]])
    fb = le_feedback.inverse_transform([feedback_model.predict(X)[0]])[0]
    pri = le_priority.inverse_transform([priority_model.predict(X)[0]])[0]
    prob = round(accept_model.predict_proba(X)[0][1], 3)
    return {"feedback": fb, "priority": pri, "accept_prob": prob}

@app.get("/")
async def root():
    return {"message": "ML API is live!", "docs": "/docs"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)