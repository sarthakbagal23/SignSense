'use client';

import { useEffect } from 'react';
import App from '../../src/app/App.jsx';

export default function PracticeClient() {
  useEffect(() => {
    // The landing page embeds this screen as a live preview; ?embed=1 hides the app's own header there.
    if (new URLSearchParams(window.location.search).get('embed') === '1') document.documentElement.dataset.embed = '1';
    void import('../../src/app/core.js');
  }, []);

  return <App />;
}
