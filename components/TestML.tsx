// src/components/TestML.tsx
import { useState } from "react";
import { prioritiseIssue } from "../services/mlService";

export default function TestML() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const test = async () => {
    setLoading(true);
    try {
      const res = await prioritiseIssue({
        severity_score: 9.5,
        code_complexity: 8.5,
        lines_changed: 200,
        developer_feedbacks: 4,
        test_coverage: 0.3,
        past_acceptance_rate: 0.6,
        contains_security_fix: 1,
        review_time: 7.0,
      });
      setResult(res);
    } catch (err: any) {
      setResult({ 
        error: err.message,
        priority: 'unknown',
        feedback: 'error',
        accept_prob: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      critical: "bg-red-600 text-white",
      high: "bg-orange-600 text-white",
      medium: "bg-yellow-500 text-black",
      low: "bg-green-600 text-white",
    };
    return `px-3 py-1 rounded-full text-xs font-bold ${styles[priority] || styles.low}`;
  };

  return (
    <div className="mx-auto max-w-4xl p-6 bg-light-secondary dark:bg-dark-secondary rounded-xl shadow-lg border border-gray-200 dark:border-white/10 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-dark-text dark:text-white font-heading">
          ML Vulnerability Prioritizer
        </h2>
        <span className="text-sm text-medium-dark-text dark:text-medium-text">Live Demo</span>
      </div>

      <button
        onClick={test}
        disabled={loading}
        className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Analyzing..." : "Run Priority Test"}
      </button>

      {result && (
        <div className="mt-6 p-5 bg-light-primary dark:bg-dark-primary rounded-lg border border-gray-200 dark:border-white/10">
          {result.error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 font-semibold">Error</p>
              <p className="text-red-500 dark:text-red-300 text-sm mt-1">{result.error}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Make sure the ML API server is running on port 8000. Check the terminal for ML API status.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-medium-dark-text dark:text-medium-text">Priority</p>
                  <div className="mt-1">
                    <span className={getPriorityBadge(result.priority)}>
                      {result.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-medium-dark-text dark:text-medium-text">Feedback Level</p>
                  <p className="mt-1 text-lg font-semibold text-dark-text dark:text-white">{result.feedback}</p>
                </div>
                <div>
                  <p className="text-sm text-medium-dark-text dark:text-medium-text">Merge Confidence</p>
                  <p className="mt-1 text-lg font-semibold text-dark-text dark:text-white">
                    {(result.accept_prob * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {result.accept_prob > 0.7 && (
                <button className="mt-4 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                  Auto-Fix Available
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}