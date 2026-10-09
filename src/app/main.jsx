import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import App from './App.jsx';

function Boot() {
  // Start the tracking core once the markup exists (dynamic import runs the module a single time).
  useEffect(() => { import('./core.js'); }, []);
  return <App />;
}
createRoot(document.getElementById('root')).render(<StrictMode><Boot /></StrictMode>);
