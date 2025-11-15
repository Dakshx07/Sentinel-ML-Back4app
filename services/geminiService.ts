import { GoogleGenAI, Type, GenerateContentResponse, Modality, GenerateImagesResponse } from "@google/genai";
import { AnalysisIssue, CommitAnalysisIssue, GitHubCommit, RefactorResult, Repository, ReadmeGenerationContext } from '../types';
import { setCache, getCache } from '../utils/cacheUtils';

const API_KEY_LOCAL_STORAGE_KEY = 'sentinel-api-key';
const SYSTEM_INSTRUCTION_LOCAL_STORAGE_KEY = 'sentinel-system-instruction';
export const MAX_OUTPUT_TOKENS_LOCAL_STORAGE_KEY = 'sentinel-max-output-tokens';

// Exported for use in the settings page and as a fallback
export const DEFAULT_SYSTEM_INSTRUCTION = "You are Sentinel, a world-class AI code security agent. Your purpose is to conduct deep, context-aware code reviews. Analyze the provided code for security vulnerabilities (like OWASP Top 10), logical bugs, and code quality issues ('code smells').";

export const isApiKeySet = (): boolean => {
    return !!localStorage.getItem(API_KEY_LOCAL_STORAGE_KEY);
};

const getAiClient = () => {
    const apiKey = localStorage.getItem(API_KEY_LOCAL_STORAGE_KEY);
    if (!apiKey) {
        throw new Error("Gemini API Key not found. Please set it on the AI Agent Settings page.");
    }
    return new GoogleGenAI({ apiKey });
};

// --- START: Retry & Rate Limiting Logic ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
let lastApiCallTimestamp = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between calls

async function withRetry<T>(fn: () => Promise<T>, retries = 3, initialDelay = 1000): Promise<T> {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTimestamp;

    if (timeSinceLastCall < MIN_REQUEST_INTERVAL) {
        const delay = MIN_REQUEST_INTERVAL - timeSinceLastCall;
        console.log(`Rate limiting: delaying next API call by ${delay}ms.`);
        await sleep(delay);
    }
    
    lastApiCallTimestamp = Date.now();

    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (error: any) {
            const rawMessage = error.message || error.toString();
            let isRetryable = false;

            // Try to parse for more details to distinguish between rate limits (retryable) and quotas (not retryable).
            try {
                const errorObj = JSON.parse(rawMessage);
                if (errorObj.error) {
                    const status = errorObj.error.status;
                    const message = (errorObj.error.message || '').toLowerCase();
                    // A resource exhausted error is only retryable if it's a rate limit, not a hard quota.
                    if (status === 'RESOURCE_EXHAUSTED' && !message.includes('quota')) {
                        isRetryable = true;
                    }
                }
            } catch (e) {
                // If parsing fails, fall back to simple string matching for generic rate limit messages.
                if (rawMessage.includes('rate limit')) {
                    isRetryable = true;
                }
            }
            
            if (isRetryable && attempt < retries - 1) {
                const delay = initialDelay * Math.pow(2, attempt) + Math.floor(Math.random() * 500); // Exponential backoff with jitter
                console.warn(`API call failed with retryable error. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${retries})`);
                await sleep(delay);
                attempt++;
            } else {
                // For non-retryable errors (like quota), or if all retries are exhausted, throw the error.
                throw error;
            }
        }
    }
    // This line should be unreachable if the loop logic is correct.
    throw new Error('Exceeded max retries for API call.');
}

const handleGeminiError = (e: any): never => {
    console.error("Gemini API Error:", e);
    let userMessage = e.message || 'An unknown error occurred.';

    // Try to parse the error for a more user-friendly message
    try {
        const errorObj = JSON.parse(e.message).error;
        if (errorObj) {
            const status = errorObj.status;
            const message = (errorObj.message || '').toLowerCase();
            if (status === 'RESOURCE_EXHAUSTED') {
                if (message.includes('quota')) {
                    userMessage = "You've exceeded your Gemini API quota. Please check your plan and billing details.";
                } else {
                    userMessage = "API rate limit reached. Please wait a moment and try again.";
                }
            } else if (errorObj.message) {
                 userMessage = errorObj.message;
            }
        }
    } catch(parseError) {
        // The error was not JSON, so we use the raw message.
    }

    throw new Error(userMessage);
};
// --- END: Retry & Rate Limiting Logic ---

// --- API Functions ---

export const analyzeCode = async (code: string, language: string): Promise<AnalysisIssue[]> => {
    const cacheKey = `analysis-${code}`;
    const cachedResult = getCache<AnalysisIssue[]>(cacheKey);
    if (cachedResult) return cachedResult;
    
    const maxTokens = parseInt(localStorage.getItem(MAX_OUTPUT_TOKENS_LOCAL_STORAGE_KEY) || '0', 10);
    const instruction = localStorage.getItem(SYSTEM_INSTRUCTION_LOCAL_STORAGE_KEY) || DEFAULT_SYSTEM_INSTRUCTION;
    const prompt = `Review the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    const codeAnalysisSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                line: { type: Type.INTEGER, description: 'The specific line number of the identified issue.' },
                severity: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'], description: 'The severity of the issue.' },
                title: { type: Type.STRING, description: 'A concise, descriptive title for the issue.' },
                description: { type: Type.STRING, description: 'A detailed explanation of the issue and why it is a problem.' },
                impact: { type: Type.STRING, description: 'The potential impact if this issue is not addressed.' },
                suggestedFix: { type: Type.STRING, description: 'A concrete code snippet showing how to fix the issue.' },
            },
            required: ['line', 'severity', 'title', 'description', 'impact', 'suggestedFix'],
        }
    };

    try {
        const response: GenerateContentResponse = await withRetry(() => getAiClient().models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: { parts: [{ text: prompt }] },
            config: {
                systemInstruction: { parts: [{ text: instruction }] },
                responseMimeType: 'application/json',
                responseSchema: codeAnalysisSchema,
                ...(maxTokens > 0 && { maxOutputTokens: maxTokens })
            },
        }));

        const resultText = response.text.trim();
        const results = JSON.parse(resultText) as AnalysisIssue[];
        setCache(cacheKey, results);
        return results;

    } catch (e) {
        handleGeminiError(e);
    }
};

export const analyzeCommitHistory = async (commits: GitHubCommit[]): Promise<CommitAnalysisIssue[]> => {
    const commitPayload = commits.slice(0, 30).map(c => ({ sha: c.sha, message: c.commit.message }));
    const prompt = `Analyze these Git commit messages for potential security red flags such as exposed secrets (API keys, passwords), insecure configurations, or suspicious keywords (e.g., 'disable security', 'temp creds'). For each commit message that contains a clear red flag, create an issue object. If a commit message is benign, DO NOT create an issue for it. If no commits contain any red flags, you MUST return an empty array. Commits: ${JSON.stringify(commitPayload)}`;
    
     const commitAnalysisSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                sha: { type: Type.STRING, description: 'The SHA of the commit with the issue.' },
                severity: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'], description: 'The severity of the issue.' },
                title: { type: Type.STRING, description: 'A concise title for the issue.' },
                description: { type: Type.STRING, description: 'A detailed explanation of the issue.' },
                plainLanguageSummary: { type: Type.STRING, description: 'An easy-to-understand summary of the problem.' },
                reasoning: { type: Type.STRING, description: 'Why the AI flagged this commit.' },
                remediation: { type: Type.STRING, description: 'Steps to fix the issue.' },
            },
            required: ['sha', 'severity', 'title', 'description', 'plainLanguageSummary', 'reasoning', 'remediation'],
        }
    };
    
    try {
        const response: GenerateContentResponse = await withRetry(() => getAiClient().models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: { parts: [{ text: prompt }] },
            config: {
                 responseMimeType: 'application/json',
                 responseSchema: commitAnalysisSchema,
            },
        }));

        const resultText = response.text.trim();
        return JSON.parse(resultText) as CommitAnalysisIssue[];
    } catch (e) {
         handleGeminiError(e);
    }
};

export const queryRepoInsights = async (query: string, history: { sender: 'user' | 'ai', text: string }[], files: { name: string, content: string }[]): Promise<string> => {
    const fileContext = files.map(f => `File: ${f.name}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n');
    const systemInstruction = `You are an expert AI assistant for software developers. Your answers must be clear, concise, and directly helpful for development tasks. Absolutely do not use any markdown formatting like asterisks for bolding or italics. All output should be plain text, except for code snippets which should be in markdown code fences. Use the provided file contents to answer the user's question about the repository. File context:\n${fileContext}`;

    const conversationHistory = history.map(turn => ({
        role: turn.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: turn.text }],
    }));

    const fullContents = [
        ...conversationHistory,
        { role: 'user' as const, parts: [{ text: query }] }
    ];

    try {
        const response: GenerateContentResponse = await withRetry(() => getAiClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullContents,
            config: {
                systemInstruction: { parts: [{ text: systemInstruction }] },
            }
        }));
        return response.text;
    } catch (e) {
        handleGeminiError(e);
    }
};

export const refactorCode = async (code: string, language: string): Promise<RefactorResult> => {
     const cacheKey = `refactor-${code}`;
    const cachedResult = getCache<RefactorResult>(cacheKey);
    if (cachedResult) return cachedResult;

    const prompt = `Refactor the following ${language} code to improve its security, performance, and readability. Do not change its core functionality.`;

    const refactorSchema = {
        type: Type.OBJECT,
        properties: {
            refactoredCode: { type: Type.STRING, description: "The complete, refactored code block." },
            improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A bulleted list of the key improvements made."
            }
        },
        required: ['refactoredCode', 'improvements']
    };

    try {
        const response: GenerateContentResponse = await withRetry(() => getAiClient().models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: { parts: [{text: prompt}, {text: `\`\`\`${language}\n${code}\n\`\`\``}] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: refactorSchema,
            },
        }));

        const result = JSON.parse(response.text) as RefactorResult;
        setCache(cacheKey, result);
        return result;
    } catch (e) {
        handleGeminiError(e);
    }
};

export const generateRepoReport = async (repo: Repository, commits: any[], contributors: any[], languages: any): Promise<string> => {
    const cacheKey = `repo-report-${repo.full_name}-${commits[0]?.sha}`;
    const cached = getCache<string>(cacheKey);
    if (cached) return cached;
    
    const prompt = `
Generate a comprehensive, developer-focused report for the repository "${repo.full_name}". 
The report MUST be in clean, well-structured Markdown format with ample spacing. Use H3 "###" for all section headings. Use bold "**" for emphasis. Use bullet points "- " for lists.

**Repository Details:**
- Description: ${repo.description}
- Language: ${repo.language}
- Stars: ${repo.stargazers_count}

**Recent Commits (last 10):**
${commits.map(c => `- ${c.commit.message.split('\n')[0]}`).join('\n')}

**Top Contributors:**
${contributors.map(c => `- ${c.login} (${c.contributions} contributions)`).join('\n')}

**Language Breakdown:**
${Object.entries(languages).map(([lang, bytes]) => `- ${lang}: ${bytes} bytes`).join('\n')}

Based on the data above, generate a professional report with the following sections.

### Executive Summary
A brief, high-level overview of the repository's current state and recent activity.

### Recent Development Focus
What does the recent commit history suggest is the main focus of development? Mention any significant features or fixes.

### Codebase Insights
Briefly comment on the language breakdown. Is it a monolith, a microservice, a frontend app? What does the mix of languages imply?

### Community & Activity
Comment on the contributor activity. Does it look like a solo project, a small team, or a large open-source community?

### Suggestions for New Developers
Based on the data, suggest one or two concrete things a new developer joining the project should look at first to get up to speed.
`;

    try {
        const response: GenerateContentResponse = await withRetry(() => getAiClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
        }));
        const report = response.text;
        setCache(cacheKey, report);
        return report;
    } catch (e) {
        handleGeminiError(e);
    }
}


export const analyzeDependencies = async (dependencies: { name: string, version: string }[]): Promise<string> => {
    const cacheKey = `deps-analysis-${JSON.stringify(dependencies)}`;
    const cachedResult = getCache<string>(cacheKey);
    if (cachedResult) return cachedResult;

    const prompt = `As a security and performance analyst, examine the following software dependencies. For each finding, provide a clear title, a brief explanation of the risk or opportunity, and a specific recommendation. **Do not use markdown asterisks or any other markdown formatting.** Present the information in plain, readable text. If there are no noteworthy findings, state that 'No significant security or optimization issues were found.' Dependencies: ${JSON.stringify(dependencies, null, 2)}`;
    
    try {
        const response: GenerateContentResponse = await withRetry(() => getAiClient().models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: { parts: [{ text: prompt }] },
        }));
        const summary = response.text;
        setCache(cacheKey, summary);
        return summary;
    } catch (e) {
        handleGeminiError(e);
    }
}

export const generateImage = async (prompt: string): Promise<string> => {
    const cacheKey = `image-${prompt}`;
    const cachedResult = getCache<string>(cacheKey);
    if (cachedResult) return cachedResult;

    try {
        const response: GenerateImagesResponse = await withRetry(() => getAiClient().models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
            }
        }));
        
        const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (!base64ImageBytes) {
            throw new Error("Image generation failed to return an image.");
        }
        
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
        setCache(cacheKey, imageUrl, 60 * 60 * 1000); // 1 hour TTL for images
        return imageUrl;
        
    } catch (e) {
        handleGeminiError(e);
    }
};

export const getImagePromptSuggestions = async (currentPrompt: string): Promise<string[]> => {
    const prompt = `The user wants to generate an image. Their current prompt is: "${currentPrompt}".
    Provide 3 alternative, more descriptive, and creative prompts that would result in a visually interesting image.
    The suggestions should be diverse in style (e.g., photorealistic, abstract, diagrammatic, cyberpunk).
    Return ONLY a JSON array of strings. Example: ["suggestion 1", "suggestion 2", "suggestion 3"]`;

    const suggestionSchema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };

    try {
        const response: GenerateContentResponse = await withRetry(() => getAiClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: suggestionSchema,
            },
        }));

        const resultText = response.text.trim();
        return JSON.parse(resultText) as string[];
    } catch (e) {
        handleGeminiError(e);
    }
};


export const generateSpeech = async (text: string): Promise<string> => {
    const cacheKey = `speech-${text}`;
    const cachedResult = getCache<string>(cacheKey);
    if (cachedResult) return cachedResult;

    try {
        const response: GenerateContentResponse = await withRetry(() => getAiClient().models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
            },
        }));

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from API.");
        }
        setCache(cacheKey, base64Audio);
        return base64Audio;
    } catch (e) {
        handleGeminiError(e);
    }
};

// --- START: New functions for README Generator ---

const README_TEMPLATES: Record<string, string> = {
    minimalist: `
- **Style:** Clean, concise, and straight to the point.
- **Tone:** Neutral and factual.
- **Sections:**
    - Project Title & Badges
    - A one-sentence description.
    - Installation (a single code block).
    - Usage (a single code block).
    - License.`,
    enterprise: `
- **Style:** Professional, formal, and structured.
- **Tone:** Authoritative and trustworthy.
- **Sections:**
    - Project Title & Badges
    - Formal Project Description
    - Key Features (bullet points)
    - System Requirements
    - Installation & Configuration
    - Usage Guide
    - Support & Service Level Agreement (SLA)
    - Security & Compliance
    - License`,
    startup: `
- **Style:** Energetic, modern, and visually engaging. Use emojis liberally.
- **Tone:** Enthusiastic and persuasive.
- **Sections:**
    - Project Title & Badges (include a "version" badge)
    - Catchy tagline.
    - "Why [Project Name]?" section with compelling bullet points.
    - "🚀 Quick Start" guide.
    - Demo (include a placeholder for a GIF or screenshot).
    - Core Features (with icons/emojis).
    - "Join our Community" section (placeholder for Discord/Slack).
    - License`,
    'open-source': `
- **Style:** Community-focused and welcoming.
- **Tone:** Collaborative and encouraging.
- **Sections:**
    - Project Title & Badges (include "contributors", "PRs welcome" badges)
    - Project Description & Goals.
    - Key Features.
    - "Getting Started" for users.
    - "Contributing": A detailed section encouraging contributions, explaining how to set up the dev environment, and linking to a (placeholder) CONTRIBUTING.md.
    - Code of Conduct.
    - "Meet the Contributors" section.
    - License.`,
    docs: `
- **Style:** Highly structured, like a formal documentation page.
- **Tone:** Informative and precise.
- **Sections:**
    - Project Title & Badges
    - Overview.
    - Table of Contents.
    - Installation.
    - Configuration: Detailed explanation of all config options, perhaps in a table.
    - API Reference (placeholder for key functions/classes).
    - Examples: Multiple code snippets showing different use cases.
    - Troubleshooting.
    - License.`
};


export const generateReadmeFromContext = async (context: ReadmeGenerationContext, template: string = 'auto'): Promise<string> => {
    const cacheKey = `readme-gen-ctx-${context.repoName}-${template}`;
    const cached = getCache<string>(cacheKey);
    if (cached) return cached;

    const { repoName, repoDescription, stars, forks, license, mainLanguage, topics, dependencies, devDependencies, topContributors } = context;

    let templateInstruction = '';
    if (template === 'auto') {
        templateInstruction = `
Analyze the repository context and choose the MOST appropriate template from the following options to structure your response.
Template Options:
- **Minimalist**: For small utilities or personal projects.
- **Enterprise**: For large, business-critical software.
- **Startup**: For new, fast-moving projects aiming for user adoption.
- **Open-Source**: For community-driven projects seeking contributors.
- **Docs**: For libraries or APIs that need detailed documentation.

Here are the detailed instructions for each template style:
${Object.entries(README_TEMPLATES).map(([key, value]) => `\n**${key.charAt(0).toUpperCase() + key.slice(1)} Template:**${value}`).join('')}
`;
    } else if (README_TEMPLATES[template]) {
        templateInstruction = `
You MUST follow the structure and tone of the "${template}" template.
Template Instructions:
${README_TEMPLATES[template]}
`;
    }

    const prompt = `
Generate a **professional, modern, visually stunning README.md** for the repository **${repoName}**.

**Project Description:** ${repoDescription || 'An innovative project.'}
**Main Language:** ${mainLanguage || 'Not specified'}
**Stars:** ${stars} | **Forks:** ${forks}
**License:** ${license || 'Not specified'}

**Key Information from Analysis:**
- **Topics/Keywords:** ${topics.join(', ') || 'N/A'}
- **Main Dependencies:** ${dependencies.slice(0, 5).join(', ') || 'N/A'}
- **Development Dependencies:** ${devDependencies.slice(0, 5).join(', ') || 'N/A'}
- **Top Contributors:** ${topContributors.slice(0, 3).join(', ') || 'N/A'}

**INSTRUCTIONS:**
${templateInstruction}

**Universal Requirements for ALL templates:**
- Start with the repository name as a main heading (\`# ${repoName}\`).
- **Immediately after the heading, you MUST add a line of Shields.io badges for:**
    - GitHub license (e.g., \`![License](https://img.shields.io/github/license/${repoName})\`)
    - GitHub stars (e.g., \`![Stars](https://img.shields.io/github/stars/${repoName}?style=social)\`)
    - Main language (e.g., \`![Language](https://img.shields.io/github/languages/top/${repoName})\`)
- Use modern Markdown formatting (e.g., emojis where appropriate, bold text, blockquotes).
- **Return ONLY the raw Markdown content.** Do not include any explanations, introductory text, or backticks fencing the entire block.
`;

    try {
        const response: GenerateContentResponse = await withRetry(() => getAiClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
        }));
        const content = response.text.trim();
        setCache(cacheKey, content, 60 * 1000); // Cache for 1 minute
        return content;
    } catch (e) {
        handleGeminiError(e);
    }
};

// --- END: New functions for README Generator ---