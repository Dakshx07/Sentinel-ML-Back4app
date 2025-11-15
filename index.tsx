import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// FIX: Expose React to the global window object.
// UMD scripts like SWR and React-ApexCharts depend on window.React being available.
// Since this app loads React as a module, it's not on the window by default.
(window as any).React = React;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);