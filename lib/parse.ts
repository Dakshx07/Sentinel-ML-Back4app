// lib/parse.ts
// Import events shim first to ensure EventEmitter is available for Parse SDK
import '../src/events-shim';
// Import Parse SDK - use browser build to avoid Node.js dependencies
import Parse from 'parse';

const APP_ID = import.meta.env.VITE_BACK4APP_APP_ID;
const JS_KEY = import.meta.env.VITE_BACK4APP_JS_KEY;
const SERVER_URL = import.meta.env.VITE_BACK4APP_SERVER_URL;

// Initialize Parse only if env vars are available
// Use try-catch to handle any initialization errors gracefully
let parseInitialized = false;

if (APP_ID && JS_KEY && SERVER_URL) {
  try {
    // Disable LiveQuery before initialization to avoid EventEmitter issues
    // LiveQuery requires Node.js EventEmitter which isn't available in browser
    if (typeof Parse !== 'undefined' && Parse.LiveQuery) {
      // Disable LiveQuery to prevent EventEmitter constructor errors
      try {
        delete (Parse as any).LiveQuery;
      } catch (e) {
        // Ignore if LiveQuery can't be deleted
      }
    }
    
    // Parse SDK browser initialization
    Parse.initialize(APP_ID, JS_KEY);
    Parse.serverURL = SERVER_URL;
    
    parseInitialized = true;
    console.log('Parse SDK initialized successfully');
  } catch (error: any) {
    console.error('Failed to initialize Parse SDK:', error);
    parseInitialized = false;
    // Don't throw - allow app to continue without Parse
  }
} else {
  console.warn('Back4App env vars missing. Parse SDK will not be initialized. Check .env.local');
  console.warn('Required vars: VITE_BACK4APP_APP_ID, VITE_BACK4APP_JS_KEY, VITE_BACK4APP_SERVER_URL');
}

export default Parse;
export { parseInitialized };
