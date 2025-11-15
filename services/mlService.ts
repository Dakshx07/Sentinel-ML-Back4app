// src/services/mlService.ts
export interface MLInput {
    severity_score: number;
    code_complexity: number;
    lines_changed: number;
    developer_feedbacks: number;
    test_coverage: number;
    past_acceptance_rate: number;
    contains_security_fix: number;
    review_time: number;
  }
  
  export interface MLResult {
    feedback: "minor" | "major" | "reject";
    priority: "low" | "medium" | "high" | "critical";
    accept_prob: number;
  }
  
  /**
   * Sends issue features to ML API and returns priority + feedback + acceptance prob
   */
  export const prioritiseIssue = async (input: MLInput): Promise<MLResult> => {
    const API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';
  
    if (!API_URL) {
      console.warn("VITE_ML_API_URL not set in .env.local, using default: http://localhost:8000");
    }
  
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
  
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`ML API error: ${response.status} - ${errorText}`);
      }
  
      const data = await response.json();
      
      // Validate response structure
      if (!data.feedback || !data.priority || typeof data.accept_prob !== 'number') {
        throw new Error('Invalid ML API response format');
      }
  
      return data;
    } catch (error: any) {
      // If it's a network error, provide helpful message
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('ML API server is not running. Please start the ML API server on port 8000.');
      }
      throw error;
    }
  };