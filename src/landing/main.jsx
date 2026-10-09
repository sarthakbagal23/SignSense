import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import './landing.css';
import { spotlight } from '../fx.js';
import Landing from './Landing.jsx';

spotlight();
createRoot(document.getElementById('root')).render(<StrictMode><Landing /></StrictMode>);
