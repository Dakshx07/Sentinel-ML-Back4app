# ML Integration Guide

## ✅ ML Integration Status

The ML integration is **fully functional** and ready to use. All errors have been fixed and the component is properly integrated.

## 🎯 What Was Fixed

1. **Environment Variable Support**
   - Added `VITE_ML_API_URL` to TypeScript environment types
   - Default fallback to `http://localhost:8000` if not set

2. **Error Handling**
   - Improved error messages in `mlService.ts`
   - Better network error detection
   - User-friendly error display in `TestML` component
   - Response validation to ensure correct data format

3. **UI/UX Improvements**
   - Updated TestML component styling to match app theme
   - Better error display with helpful messages
   - Consistent with app's design system

4. **Integration**
   - TestML component properly integrated in App.tsx
   - Shows in Developer Command Center view
   - No breaking changes to existing functionality

## 🚀 How to Use

### 1. Start the ML API Server

First, start the FastAPI ML server:

```bash
cd sentinel_ml
python ml_api.py
```

The ML API will run on `http://localhost:8000`

### 2. Configure Environment (Optional)

Add to `.env.local`:

```env
VITE_ML_API_URL=http://localhost:8000
```

**Note:** If not set, it defaults to `http://localhost:8000`

### 3. Run the Frontend

```bash
npm run dev
```

### 4. Access ML Test Panel

1. Navigate to the Dashboard
2. Go to "Developer Command Center" view
3. You'll see the "ML Vulnerability Prioritizer" panel at the top
4. Click "Run Priority Test" to test the ML integration

## 📋 ML API Requirements

The ML API expects these model files in the `sentinel_ml` directory:
- `model_feedback.pkl`
- `model_priority.pkl`
- `model_accept.pkl`
- `labelencoder_priority.pkl`
- `labelencoder_feedback.pkl`
- `model_features.pkl`

## 🔧 API Endpoint

**POST** `/predict`

**Request Body:**
```json
{
  "severity_score": 9.5,
  "code_complexity": 8.5,
  "lines_changed": 200,
  "developer_feedbacks": 4,
  "test_coverage": 0.3,
  "past_acceptance_rate": 0.6,
  "contains_security_fix": 1,
  "review_time": 7.0
}
```

**Response:**
```json
{
  "feedback": "major",
  "priority": "high",
  "accept_prob": 0.75
}
```

## ✅ Verification

The integration is working correctly if:
- ✅ Build completes without errors
- ✅ No TypeScript/linting errors
- ✅ TestML component renders in Developer Command Center
- ✅ Error messages display properly when ML API is not running
- ✅ Results display correctly when ML API is running

## 🐛 Troubleshooting

### ML API Not Running
- Error message will show: "ML API server is not running. Please start the ML API server on port 8000."
- Solution: Start the ML API server in the `sentinel_ml` directory

### CORS Errors
- If you see CORS errors, make sure the ML API allows requests from `http://localhost:3000`
- Add CORS middleware to the FastAPI app if needed

### Model Files Missing
- Ensure all `.pkl` model files are in the `sentinel_ml` directory
- Run the training script if models don't exist

## 📝 Notes

- The ML integration is **non-blocking** - the app works even if ML API is not running
- Error handling is graceful - users see helpful messages instead of crashes
- All existing functionality remains intact
- UI/UX matches the app's design system perfectly

