// src/lib/parse.ts
import Parse from 'parse';

const APP_ID = import.meta.env.VITE_BACK4APP_APP_ID;
const JS_KEY = import.meta.env.VITE_BACK4APP_JS_KEY;
const SERVER_URL = import.meta.env.VITE_BACK4APP_SERVER_URL;

if (!APP_ID || !JS_KEY || !SERVER_URL) {
  throw new Error('Back4App env vars missing. Check .env.local');
}

Parse.initialize(APP_ID, JS_KEY);
Parse.serverURL = SERVER_URL;

export default Parse;