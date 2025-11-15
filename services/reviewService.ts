

import { Repository, User } from '../types';
import { CURRENT_USER_KEY } from './authService';

const VULNERABILITIES_KEY = 'sentinel-vulnerabilities';
const ACTIVITY_LOG_KEY = 'sentinel-activity-log';

export interface IVulnerability {
    id: string;
    repoId: number;
    repoName: string;
    filePath: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    title: string;
    timestamp: number;
}

export interface IActivityLog {
    id: string;
    type: 'NEW_VULNERABILITY' | 'AUTOREVIEW_ENABLED' | 'SCAN_COMPLETED';
    text: string;
    time: string; // User-friendly time string e.g., "2h ago"
    timestamp: number;
}

const MOCK_VULNERABILITIES = [
    { severity: 'Critical', title: 'SQL Injection in user API', filePath: 'app.py' },
    { severity: 'High', title: 'Cross-Site Scripting (XSS) in comments', filePath: 'Comment.tsx' },
    { severity: 'Medium', title: 'Insecure Direct Object Reference', filePath: 'main.tf' },
    { severity: 'Low', title: 'Missing CSRF token in form', filePath: 'views/login.html' },
];

const getStoredData = <T>(key: string): T[] => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        return [];
    }
};

const setStoredData = <T>(key: string, data: T[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

const addActivityLog = (type: IActivityLog['type'], text: string) => {
    const logs = getStoredData<IActivityLog>(ACTIVITY_LOG_KEY);
    const newLog: IActivityLog = {
        id: `log-${Date.now()}`,
        type,
        text,
        timestamp: Date.now(),
        time: formatTimeAgo(Date.now()),
    };
    const updatedLogs = [newLog, ...logs].slice(0, 50); // Keep last 50 logs
    setStoredData(ACTIVITY_LOG_KEY, updatedLogs);
};

// --- Simulation Logic ---

// Use 'number' for interval IDs in browser environments, as 'setInterval' returns a number.
let reviewInterval: number | null = null;

const runReviewCycle = () => {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) {
        if (reviewInterval) {
            clearInterval(reviewInterval);
            reviewInterval = null;
        }
        return;
    };
    const user: User = JSON.parse(userJson);
    const reposJson = localStorage.getItem(`sentinel-repos-${user.email}`);
    if (!reposJson) return;

    const repos: Repository[] = JSON.parse(reposJson);
    const reposToReview = repos.filter(r => r.autoReview);

    if (reposToReview.length === 0) {
        if (reviewInterval) {
            clearInterval(reviewInterval);
            reviewInterval = null;
        }
        return;
    }

    reposToReview.forEach(repo => {
        // Randomly decide whether to find a vulnerability in this cycle
        if (Math.random() < 0.2) { // 20% chance each cycle
            const vulnerabilities = getStoredData<IVulnerability>(VULNERABILITIES_KEY);
            const mockVuln = MOCK_VULNERABILITIES[Math.floor(Math.random() * MOCK_VULNERABILITIES.length)];
            const newVuln: IVulnerability = {
                id: `vuln-${Date.now()}`,
                repoId: repo.id,
                repoName: repo.name,
                severity: mockVuln.severity as IVulnerability['severity'],
                title: mockVuln.title,
                filePath: mockVuln.filePath,
                timestamp: Date.now(),
            };
            setStoredData(VULNERABILITIES_KEY, [newVuln, ...vulnerabilities]);
            addActivityLog('NEW_VULNERABILITY', `New ${newVuln.severity.toLowerCase()} issue found in ${repo.name}.`);
        }
    });
};

export const startReview = (repoId: number, repoName: string) => {
    addActivityLog('AUTOREVIEW_ENABLED', `Auto-review enabled for ${repoName}.`);
    if (!reviewInterval) {
        runReviewCycle(); // Run immediately
        reviewInterval = window.setInterval(runReviewCycle, 3000);
    }
};

export const stopReview = (repoId: number, repoName: string) => {
    // Logic to stop is handled by the cycle checking which repos have autoReview: false
};

// --- Dashboard Data Fetching ---

export const getDashboardData = (allRepos: Repository[]) => {
    const vulnerabilities = getStoredData<IVulnerability>(VULNERABILITIES_KEY);
    const activityLogs = getStoredData<IActivityLog>(ACTIVITY_LOG_KEY);
    
    const totalRepos = allRepos.length;
    const autoReviewCount = allRepos.filter(r => r.autoReview).length;
    const criticalCount = vulnerabilities.filter(v => v.severity === 'Critical').length;

    const highPriorityVulnerabilities = vulnerabilities
        .filter(v => v.severity === 'Critical' || v.severity === 'High')
        .sort((a, b) => {
            const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
            if (a.severity !== b.severity) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }
            return b.timestamp - a.timestamp; // Sort by most recent if severity is the same
        });

    const now = new Date();
    const fourWeeksAgo = now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000;
    const trend = [0, 0, 0, 0]; // 4 weeks ago to last week
    vulnerabilities.forEach(vuln => {
        if (vuln.timestamp >= fourWeeksAgo) {
            const weekIndex = Math.floor((vuln.timestamp - fourWeeksAgo) / (7 * 24 * 60 * 60 * 1000));
            if (weekIndex >= 0 && weekIndex < 4) {
                trend[weekIndex]++;
            }
        }
    });

    return {
        totalRepos,
        autoReviewCount,
        criticalCount,
        highPriorityVulnerabilities,
        recentActivity: activityLogs.map(log => ({...log, time: formatTimeAgo(log.timestamp)})).slice(0, 5),
        trendData: {
            categories: ['4 Weeks Ago', '3 Weeks Ago', '2 Weeks Ago', 'Last Week'],
            series: [{ name: 'Vulnerabilities', data: trend }],
        },
    };
};