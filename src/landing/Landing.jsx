'use client';

import Link from 'next/link';
import { ArrowDownRight, ArrowRight, Check, ChevronRight, LockKeyhole, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

const principles = [
  { number: '01', title: 'See the shape', body: 'Meet each letter with a clear visual target before you ever turn on the camera.' },
  { number: '02', title: 'Try without pressure', body: 'Make a shape, get one useful cue, and try again. No red buzzer. No performance.' },
  { number: '03', title: 'Keep the connection', body: 'Small, repeatable practice gives you more confidence when a real conversation arrives.' },
];

function Header() {
  return <header className="product-nav"><Link className="product-brand" href="/" aria-label="SignSense home"><img src="/mascot/wave-small.png" alt="" width="30" height="30" /><span>SignSense</span></Link><nav aria-label="Main navigation"><a href="#story">Our approach</a><a href="#practice">The practice room</a><a href="#privacy">Privacy</a></nav><Button as={Link} href="/practice?welcome=1" className="nav-action">Try it free <ArrowRight size={15} aria-hidden="true" /></Button></header>;
}

function Hero() {
  return <section className="story-hero" aria-labelledby="hero-title"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot" />A gentler way to learn ASL fingerspelling</p><h1 id="hero-title">The first step to a bigger <em>conversation.</em></h1><p className="hero-lede">SignSense turns the awkward first few minutes of learning into a calm, focused practice you can actually come back to.</p><div className="hero-actions"><Button as={Link} href="/practice?welcome=1" size="lg" className="primary-action">Start with one letter <ArrowRight size={18} aria-hidden="true" /></Button><a className="text-action" href="#story"><span className="play-icon"><Play size={12} fill="currentColor" aria-hidden="true" /></span> Why we made this</a></div><div className="hero-proof"><span><Check size={14} aria-hidden="true" />Free to begin</span><span><LockKeyhole size={14} aria-hidden="true" />Your camera stays on your device</span></div></div><div className="hero-stage"><div className="stage-label">A quieter kind of progress <ArrowDownRight size={15} /></div><div className="hero-card"><div className="hero-card-top"><span><img src="/mascot/wave-small.png" alt="" width="19" height="19" /> SignSense</span><small><i />Practice room</small></div><div className="hero-letter"><span>Learn</span><strong>A</strong><span>Make this shape</span></div><div className="hero-hand"><div className="hand-lines"><i /><i /><i /><i /><i /></div><span>Place your hand in frame</span></div><div className="hero-card-bottom"><span className="progress-bar"><i /></span><b>1 / 5</b></div></div><div className="stage-note note-one"><span>Good start</span><small>Your thumb is in the right place</small></div><div className="stage-note note-two"><small>Today&apos;s goal</small><span>2 focused minutes</span></div></div></section>;
}

function Story() {
  return <section className="story-section" id="story" aria-labelledby="story-title"><div className="story-aside"><span className="story-index">The idea</span><span className="story-rule" /><span className="story-index">01 — 03</span></div><div className="story-content"><p className="eyebrow eyebrow-light">Learning should feel like an invitation</p><h2 id="story-title">You don&apos;t need to be perfect<br />to <em>begin.</em></h2><div className="story-columns"><p>Signing is a way to meet someone where they are. But learning the first few handshapes can feel strangely high-stakes: a camera, a score, the fear of getting it wrong.</p><p>We built SignSense to take that pressure away. It gives you a clear next step, then enough room to notice what your hands are doing. That&apos;s it.</p></div><a className="story-link" href="#practice">See the practice loop <ArrowRight size={16} /></a></div></section>;
}

function PracticePrinciples() {
  return <section className="principles-section" id="practice" aria-labelledby="principles-title"><div className="section-intro"><p className="eyebrow">How it works</p><h2 id="principles-title">A practice loop<br /><em>that respects you.</em></h2><p>Good tools don&apos;t make learning louder. They make the next step obvious.</p></div><div className="principles-list">{principles.map((item) => <article className="principle" key={item.number}><span className="principle-number">{item.number}</span><div><h3>{item.title}</h3><p>{item.body}</p></div><ChevronRight className="principle-arrow" size={20} aria-hidden="true" /></article>)}</div></section>;
}

function ProductPreview() {
  return <section className="product-section" aria-labelledby="product-title"><div className="product-copy"><p className="eyebrow eyebrow-light">Inside the practice room</p><h2 id="product-title">Useful feedback.<br /><em>Nothing extra.</em></h2><p>Every round has one job: help you notice the next small adjustment. The interface stays quiet so your attention can stay on your hands.</p><ul><li><Check size={16} aria-hidden="true" />A clear target for every letter</li><li><Check size={16} aria-hidden="true" />Gentle cues you can act on</li><li><Check size={16} aria-hidden="true" />Short rounds that fit real life</li></ul><Button as={Link} href="/practice?welcome=1" className="light-action">Open the practice room <ArrowRight size={17} aria-hidden="true" /></Button></div><div className="preview-frame"><div className="preview-header"><span><Sparkles size={14} aria-hidden="true" />Live product preview</span><i>Runs locally</i></div><div className="preview-screen"><iframe src="/practice?demo=1&nointro=1&muted=1" title="Interactive SignSense practice preview" loading="lazy" /></div><p className="preview-caption">Try the letter controls. No account or upload required.</p></div></section>;
}

function FooterCTA() {
  return <section className="closing-section" id="privacy" aria-labelledby="closing-title"><div className="closing-top"><span className="closing-mark">SS</span><p className="eyebrow">Start where you are</p></div><h2 id="closing-title">One letter is enough<br /><em>for today.</em></h2><p>Come back when you&apos;re ready for the next.</p><Button as={Link} href="/practice?welcome=1" size="lg" className="primary-action">Start practicing <ArrowRight size={18} aria-hidden="true" /></Button></section>;
}

export default function Landing() {
  return <div className="landing-shell"><a className="landing-skip" href="#main-content">Skip to content</a><Header /><main id="main-content"><Hero /><Story /><PracticePrinciples /><ProductPreview /><FooterCTA /></main><footer className="product-footer"><Link className="product-brand" href="/"><img src="/mascot/wave-small.png" alt="" width="24" height="24" /><span>SignSense</span></Link><span>Learn with care. Practice with confidence.</span><span>© 2026 SignSense</span></footer></div>;
}
