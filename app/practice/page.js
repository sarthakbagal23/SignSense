'use client';

import { StrictMode, useEffect } from 'react';
import App from '../../src/app/App.jsx';

function PracticeBoot() {
  useEffect(() => {
    import('../../src/app/core.js');
  }, []);

  return <App />;
}

export default function PracticePage() {
  return <StrictMode><PracticeBoot /></StrictMode>;
}
