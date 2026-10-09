'use client';

import Link from 'next/link';
import { ArrowRight, Check, LockKeyhole, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

const features = [
  ['01', 'Learn by seeing', 'A clear target for every letter, with enough space to notice what your hand is doing.'],
  ['02', 'One useful cue', 'No noisy scorecards. Get the next adjustment that actually helps you improve.'],
  ['03', 'Build a habit', 'Short rounds make it easy to practice between lessons, conversations, and real life.'],
];

function Header() {
  return (
    <header className="product-nav">
      <Link className="product-brand" href="/" aria-label="SignSense home"><img src="/mascot/wave-small.png" alt="" width="30" height="30" /><span>SignSense</span></Link>
      <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#why-signsense">Why SignSense</a><a href="#privacy">Privacy</a></nav>
      <Button as={Link} href="/practice?welcome=1" className="nav-action">Start practicing <ArrowRight size={15} aria-hidden="true" /></Button>
    </header>
  );
}

function Hero() {
  return (
    <section className="product-hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-dot" />A calmer way to learn fingerspelling</p>
        <h1 id="hero-title">Make room for <em>more</em> conversation.</h1>
        <p className="hero-lede">SignSense helps you learn the ASL alphabet with clear visual feedback, thoughtful practice, and zero pressure to be perfect.</p>
        <div className="hero-actions"><Button as={Link} href="/practice?welcome=1" size="lg" className="primary-action">Try a practice round <ArrowRight size={18} aria-hidden="true" /></Button><a className="text-action" href="#how-it-works"><span className="play-icon"><Play size={13} fill="currentColor" aria-hidden="true" /></span> See how it works</a></div>
        <div className="hero-proof"><span><Check size={14} aria-hidden="true" />Built for small daily wins</span><span><LockKeyhole size={14} aria-hidden="true" />Camera stays on your device</span></div>
      </div>
      <div className="hero-art" aria-label="SignSense practice preview">
        <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        <div className="hero-window"><div className="window-top"><span className="window-brand"><img src="/mascot/wave-small.png" alt="" width="20" height="20" /> SignSense</span><span className="window-status"><i />Practice round</span></div><div className="window-content"><div className="letter-mark">A</div><div className="window-prompt">Make this shape</div><div className="hand-placeholder"><div className="hand-glow" /><span>Place your hand in frame</span></div><div className="window-progress"><span /><b>1 of 5</b></div></div></div>
        <div className="floating-note note-top"><span className="note-check"><Check size={13} /></span><div><b>Good start</b><small>Thumb position looks right</small></div></div><div className="floating-note note-bottom"><span className="note-number">01</span><div><small>Today&apos;s practice</small><b>2 min is enough</b></div></div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return <section id="how-it-works" className="how-section" aria-labelledby="how-title"><div className="section-heading"><p className="eyebrow">A practice loop that makes sense</p><h2 id="how-title">Simple enough to start.<br /><em>Useful enough to return to.</em></h2><p>Good learning tools get out of the way. SignSense gives you just enough guidance to keep moving.</p></div><div className="feature-grid">{features.map(([number, title, body]) => <article className="feature-card" key={number}><span className="feature-number">{number}</span><div className="feature-icon"><Check size={17} aria-hidden="true" /></div><h3>{title}</h3><p>{body}</p></article>)}</div></section>;
}

function ProductPreview() {
  return <section className="preview-section" id="why-signsense" aria-labelledby="preview-title"><div className="preview-copy"><p className="eyebrow">Designed for real people</p><h2 id="preview-title">Practice without<br /><em>performing.</em></h2><p>There is no red buzzer, no streak anxiety, and no pretending that a camera can teach a whole language. Just a focused place to get a little better.</p><ul><li><Check size={16} aria-hidden="true" />Real-time handshape guidance</li><li><Check size={16} aria-hidden="true" />Gentle feedback, not judgment</li><li><Check size={16} aria-hidden="true" />Short rounds that fit your day</li></ul><Button as={Link} href="/practice?welcome=1" className="primary-action">Open the practice room <ArrowRight size={17} aria-hidden="true" /></Button></div><div className="preview-frame"><div className="preview-header"><span><Sparkles size={14} aria-hidden="true" />Live product preview</span><i>Interactive</i></div><div className="preview-screen"><iframe src="/practice?demo=1&nointro=1&muted=1" title="Interactive SignSense practice preview" loading="lazy" /></div><p className="preview-caption">Try the letter controls. The preview is muted and runs locally in your browser.</p></div></section>;
}

function FooterCTA() {
  return <section className="closing-section" id="privacy" aria-labelledby="closing-title"><div className="closing-mark">SS</div><div><p className="eyebrow">Start where you are</p><h2 id="closing-title">A few minutes can change<br /><em>the next conversation.</em></h2><p>Learn one letter today. Come back when you&apos;re ready for the next.</p></div><Button as={Link} href="/practice?welcome=1" size="lg" className="light-action">Start practicing <ArrowRight size={18} aria-hidden="true" /></Button></section>;
}

export default function Landing() {
  return <div className="landing-shell"><a className="landing-skip" href="#main-content">Skip to content</a><Header /><main id="main-content"><Hero /><HowItWorks /><ProductPreview /><FooterCTA /></main><footer className="product-footer"><Link className="product-brand" href="/"><img src="/mascot/wave-small.png" alt="" width="24" height="24" /><span>SignSense</span></Link><span>Learn with care. Practice with confidence.</span><span>© 2026 SignSense</span></footer></div>;
}
