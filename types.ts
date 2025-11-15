export interface AnalysisIssue {
  line: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  impact: string;
  suggestedFix: string;
  filePath?: string;
}

export interface CodeFile {
  name: string;
  language: string;
  content: string;
}

export interface SampleRepo {
  id: string;
  name:string;
  description: string;
  files: CodeFile[];
}

export enum InputMode {
  Snippet,
  SampleRepo,
}

// For GitHub API response for file tree
export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export type AppView = 'landing' | 'pricing' | 'dashboard' | 'auth';

// FEAT: Overhauled DashboardView to remove all mock/broken views and add the new, functional ones.
export type DashboardView = 
  | 'developerCommandCenter' // New: Replaces Personal & Security Dashboards
  | 'smartAlerts'            // New: Replaces Notifications
  | 'repositories' 
  | 'studio' 
  | 'gitops' 
  | 'commits' 
  | 'settings' 
  | 'docs' 
  | 'pushpull' 
  | 'refactor' 
  | 'repoReport' 
  | 'workflowStreamliner' 
  | 'readmeGenerator'        // New: Productivity Tool
  | 'imageGenerator';


export interface GitHubProfile {
    login: string;
    avatar_url: string;
    html_url: string;
    name: string | null;
    public_repos: number;
    email?: string | null;
}

export interface User {
    email: string;
    username: string;
    avatarUrl: string;
    github?: GitHubProfile;
    password?: string; // For sign-up process
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface CommitAnalysisIssue {
  sha: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  reasoning: string;
  remediation: string;
  plainLanguageSummary: string;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  open_issues_count: number;
  private: boolean;
  // Sentinel-specific properties
  lastReview?: string;
  autoReview: boolean;
}

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface RefactorResult {
    refactoredCode: string;
    improvements: string[];
}

// FEAT: New types for IndexedDB storage
export interface ScanRecord {
  id?: number;
  repoFullName: string;
  filePath: string;
  timestamp: number;
  issues: AnalysisIssue[];
  status: 'fixed' | 'open';
  source: 'studio' | 'gitops' | 'pr-review';
}

export interface AlertRecord {
  id?: number;
  timestamp: number;
  repoFullName: string;
  type: 'PR_COMMENT';
  details: string; // e.g., "Posted 3 issues to PR #123"
  url?: string; // Link to the PR
}

// FEAT: Type for GitHub Dependabot Alerts
export interface DependabotAlert {
    number: number;
    state: 'open' | 'fixed' | 'dismissed';
    dependency: {
        package: {
            ecosystem: string;
            name: string;
        };
        manifest_path: string;
    };
    security_advisory: {
        ghsa_id: string;
        cve_id: string | null;
        summary: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
    };
    html_url: string;
    fixed_in?: string; // Not a standard field, but useful for our logic
    vulnerable_version_range: string;
}

// FEAT: Add type for the rich context object for the automated README generator.
export interface ReadmeGenerationContext {
    repoName: string;
    repoDescription: string | null;
    stars: number;
    forks: number;
    license: string | null;
    mainLanguage: string | null;
    topics: string[];
    dependencies: string[];
    devDependencies: string[];
    topContributors: string[];
}