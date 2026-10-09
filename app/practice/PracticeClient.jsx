'use client';

import { useEffect } from 'react';
import App from '../../src/app/App.jsx';

export default function PracticeClient() {
  useEffect(() => {
    void import('../../src/app/core.js');
  }, []);

  return <App />;
}
