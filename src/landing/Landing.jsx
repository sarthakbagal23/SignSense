'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MotionConfig, useInView } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowDown, ArrowRight, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card } from '@/components/ui/card.jsx';
import { spotlight } from '@/fx.js';
import HandStage from './HandStage.jsx';
import BlurText from '@/components/fx/rb/BlurText.jsx';
import Magnet from '@/components/fx/rb/Magnet.jsx';
import ShinyText from '@/components/fx/rb/ShinyText.jsx';
import LightRays from '@/components/fx/rb/LightRays.jsx';
import { ScrollVelocity } from '@/components/fx/rb/ScrollVelocity.jsx';
import './landing-v3.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HERO_LETTERS = ['I', 'L', 'Y'];
const STORY_LETTERS = ['A', 'S', 'L'];

const beats = [
  {
    kicker: 'Imagine you’re ten.',
    title: <><span className="story-line">Your family is</span><span className="story-line"><em>still learning</em></span><span className="story-line">your language.</span></>,
    body: 'Everyone you love is at the table. You already know what you want to say. They are learning how to follow your hands.',
    first: true,
  },
  {
    kicker: 'You belong in the conversation.',
    title: <><span className="story-line">Learning can happen</span><span className="story-line">on both sides.</span></>,
    body: 'The work of connecting should not fall on one person. Family members can practice, get things wrong, and try again too.',
  },
  {
    kicker: 'Start with one letter.',
    title: <><span className="story-line">A small practice</span><span className="story-line">can open a door.</span></>,
    body: 'SignSense gives hearing family members a place to learn fingerspelling between lessons, with a clear cue for the handshape in front of them.',
  },
];

// Real coaching lines from the practice engine (src/letters.js), so the ribbon is the product's own voice.
const CUE_LINES = [
  'Rest your thumb along the side of your index finger.',
  'Touch your thumb tip to your index fingertip to close the circle.',
  'Stick your thumb out to the side, making an L.',
  'Spread your index and middle fingers apart into a V.',
];
const CUE_LINES_2 = [
  'Wrap your thumb across the front of your curled fingers.',
  'Fan your three fingers apart.',
  'Bend your index finger into a hook.',
  'Curl your index finger down to meet your thumb.',
];

function Header() {
  return (
    <header className="story-nav">
      <a className="story-brand" href="#top" aria-label="SignSense home"><img src="/mascot/wave-small.png" alt="" width="28" height="28" /><span>SignSense</span></a>
      <nav aria-label="Main navigation">
        <a href="#story">The story</a>
        <a href="#practice">The practice</a>
        <a href="#promise">Our promise</a>
      </nav>
      <Button as={Link} href="/practice?welcome=1" variant="default" size="sm" className="story-nav-cta">Try a practice round <ArrowRight size={15} aria-hidden="true" /></Button>
    </header>
  );
}

function Hero({ reduced }) {
  const [glyph, setGlyph] = useState({ letter: HERO_LETTERS[0], settled: false });
  const onLetter = useCallback((letter, settled) => setGlyph({ letter, settled }), []);
  return (
    <section className="hero3" aria-labelledby="hero-title">
      {!reduced && <div className="hero3-rays" aria-hidden="true"><LightRays raysOrigin="top-center" raysColor="#5fd4e0" raysSpeed={0.7} lightSpread={0.85} rayLength={1.5} followMouse mouseInfluence={0.05} noiseAmount={0.07} fadeDistance={1.05} saturation={0.9} /></div>}
      <div className="hero3-copy">
        <div role="heading" aria-level={1} id="hero-title" className="hero3-title" aria-label="Dinner is loud. You have a story.">
          <MotionConfig reducedMotion="user">
            <span aria-hidden="true"><BlurText text="Dinner is loud." delay={110} animateBy="words" direction="bottom" className="hero3-line" /></span>
            <span aria-hidden="true"><BlurText text="You have a story." delay={110} animateBy="words" direction="bottom" className="hero3-line hero3-line-2" /></span>
          </MotionConfig>
        </div>
        <p className="hero3-sub">Your family is still learning your language. SignSense watches your hand through the camera and tells you the one thing to adjust next.</p>
        <div className="hero3-actions">
          <Magnet padding={70} magnetStrength={3}>
            <Button as={Link} href="/practice?welcome=1" variant="default" size="lg" className="story-primary">Try a practice round <ArrowRight size={18} aria-hidden="true" /></Button>
          </Magnet>
          <a className="hero3-secondary" href="#story"><ShinyText text="Read the story" color="#c3d3d8" shineColor="#ffffff" speed={3} delay={1.5} /><ArrowDown size={15} aria-hidden="true" /></a>
        </div>
      </div>
      <div className="hero3-stage">
        <HandStage letters={HERO_LETTERS} mode="auto" onLetter={onLetter} />
        <div key={glyph.letter} className="hero3-glyph" aria-hidden="true">{glyph.letter}</div>
        <ol className="hero3-drill" aria-label="Today’s family drill: I, L, Y">
          {HERO_LETTERS.map((l) => <li key={l} className={l === glyph.letter ? 'is-on' : ''}>{l}</li>)}
          <li className="hero3-drill-note">the I-L-Y family drill</li>
        </ol>
      </div>
    </section>
  );
}

function CueRibbon() {
  return (
    <section className="cue-ribbon" aria-label="Examples of the coaching cues SignSense gives">
      <div aria-hidden="true">
        <ScrollVelocity texts={[CUE_LINES.join('  ·  '), CUE_LINES_2.join('  ·  ')]} velocity={34} numCopies={4} parallaxClassName="ss-vel" scrollerClassName="ss-vel-track" />
      </div>
    </section>
  );
}

function StoryBeat({ beat, index, setActive }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: '-38% 0px -38% 0px', once: false });
  useEffect(() => {
    if (inView) setActive(index);
  }, [inView, index, setActive]);

  return (
    <article ref={ref} className={`story-beat story3-beat${inView ? ' is-current' : ''}`} aria-current={inView ? 'step' : undefined}>
      <p className="story-kicker"><span className="story-step">0{index + 1}</span>{beat.kicker}</p>
      <h2 className="story-headline">{beat.title}</h2>
      <p className="story-body">{beat.body}</p>
      {beat.first && <a className="story-continue" href="#practice">See how we can start <ArrowDown size={15} aria-hidden="true" /></a>}
    </article>
  );
}

function Story() {
  const [active, setActive] = useState(0);
  const [glyph, setGlyph] = useState(STORY_LETTERS[0]);
  const setCurrent = useCallback((i) => setActive(i), []);
  const onLetter = useCallback((letter) => setGlyph(letter), []);
  const root = useRef(null);
  const progress = useRef(0);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      ScrollTrigger.create({ trigger: root.current, start: 'top 40%', end: 'bottom bottom', onUpdate: (self) => { progress.current = self.progress; } });
      gsap.utils.toArray('.story3-beat', root.current).forEach((beat) => {
        const copy = beat.querySelectorAll('.story-kicker, .story-headline, .story-body, .story-continue');
        gsap.fromTo(copy, { autoAlpha: 0.2, y: 34 }, { autoAlpha: 1, y: 0, stagger: 0.07, ease: 'power3.out',
          scrollTrigger: { trigger: beat, start: 'top 75%', end: 'top 35%', scrub: 0.6 } });
      });
    });
    return () => media.revert();
  }, { scope: root });

  // Reduced motion: no scroll scrubbing, so the handshape simply follows the current beat.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) progress.current = active / (STORY_LETTERS.length - 1);
  }, [active]);

  return (
    <section ref={root} id="story" className="story3" aria-label="A family learning to communicate">
      <div className="story3-copy">
        {beats.map((beat, i) => <StoryBeat key={i} beat={beat} index={i} setActive={setCurrent} />)}
      </div>
      <figure className="story3-visual">
        <div className="story3-frame">
          <HandStage letters={STORY_LETTERS} mode="scrub" progressRef={progress} pointer={false} onLetter={onLetter} />
          <div className="story3-glyph" aria-hidden="true">{glyph}</div>
        </div>
        <figcaption><span>Handshape {STORY_LETTERS.indexOf(glyph) + 1} of {STORY_LETTERS.length}</span><span>Scroll to change it</span></figcaption>
      </figure>
    </section>
  );
}

function PracticeDemo() {
  const frame = useRef(null);
  const [inView, setInView] = useState(false);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(frame.current, { autoAlpha: 0.25, y: 42, rotateX: 6, scale: 0.97 }, {
        autoAlpha: 1, y: 0, rotateX: 0, scale: 1, ease: 'power3.out',
        scrollTrigger: { trigger: frame.current, start: 'top 88%', end: 'center 58%', scrub: 0.7 },
      });
    });
    return () => media.revert();
  }, { scope: frame });

  useEffect(() => {
    const node = frame.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15, rootMargin: '0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Card ref={frame} spot={false} className="practice-demo-card">
      <div className="demo-window-bar"><div className="demo-window-brand"><img src="/mascot/wave-small.png" alt="" width="23" height="23" /><span>Practice round</span></div><span className="demo-live-state"><i aria-hidden="true" />{inView ? 'Live preview' : 'Ready to preview'}</span></div>
      <div className="practice-demo">
        {inView && <iframe src="/practice?demo=1&nointro=1&muted=1&embed=1" title="SignSense handshape practice demo" loading="eager" />}
      </div>
      <div className="demo-window-foot"><span><b>21</b> hand points tracked on your device</span><Link href="/practice?welcome=1">Open the full practice <ArrowRight size={14} aria-hidden="true" /></Link></div>
    </Card>
  );
}

function Practice() {
  const root = useRef(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const intro = root.current.querySelector('.practice-intro');
      gsap.fromTo(intro.querySelectorAll('.story-kicker, h2, .practice-lede'),
        { autoAlpha: 0, y: 38 },
        { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: intro, start: 'top 80%', end: 'center 48%', scrub: 0.65 } },
      );
      gsap.fromTo(root.current.querySelectorAll('.practice-facts li'),
        { autoAlpha: 0.35, x: -22 },
        { autoAlpha: 1, x: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: root.current.querySelector('.practice-copy'), start: 'top 76%', end: 'center 50%', scrub: 0.6 } },
      );
    });
    return () => media.revert();
  }, { scope: root });

  return (
    <section ref={root} id="practice" className="practice-section" aria-labelledby="practice-title">
      <header className="practice-intro">
        <div><p className="story-kicker"><span className="story-step">The practice</span>Small steps. Real connection.</p><h2 id="practice-title">See one shape. Fix one thing.</h2></div>
        <p className="practice-lede">One letter at a time. SignSense follows the handshape in front of you and offers one useful adjustment, then lets you try again.</p>
      </header>
      <div className="practice-preview-wrap"><PracticeDemo /><p className="practice-demo-caption">Try the letter controls. The demo loads only while it’s on screen and stays muted.</p></div>
      <div className="practice-copy">
        <ul className="practice-facts">
          <li><span className="fact-index">01</span><span><b>See the shape</b><small>Compare your hand to a clear target.</small></span></li>
          <li><span className="fact-index">02</span><span><b>Follow one cue</b><small>Adjust one thing, like thumb beside index.</small></span></li>
          <li><span className="fact-index">03</span><span><b>Keep going</b><small>Practice a letter, a name, or a tricky round.</small></span></li>
        </ul>
        <Button as={Link} href="/practice?welcome=1" variant="default" size="lg" className="story-primary">Try a practice round <ArrowRight size={18} aria-hidden="true" /></Button>
        <p className="practice-privacy"><Shield size={15} aria-hidden="true" /> Camera tracking stays on this device.</p>
      </div>
    </section>
  );
}

const loop = [
  ['Look', 'See the letter and compare your hand with its preview.'],
  ['Adjust', 'Follow one cue, like bringing your thumb beside your index finger.'],
  ['Continue', 'Hold the shape, celebrate the clean match, and move to the next letter.'],
];

function PromiseSection() {
  return (
    <section id="promise" className="promise-section" aria-labelledby="promise-title">
      <div className="promise-heading">
        <p className="story-kicker"><span className="story-step">A note</span>What this is for</p>
        <h2 id="promise-title">A place to practice.<br /><em>Not a substitute for people.</em></h2>
        <p>Fingerspelling is one small part of ASL. SignSense helps with the alphabet; learn the language and conversation from Deaf teachers and signers.</p>
      </div>
      <ol className="practice-loop">
        {loop.map(([title, body], i) => <li key={title}><span className="loop-number">0{i + 1}</span><div><h3>{title}</h3><p>{body}</p></div><Check size={17} aria-hidden="true" /></li>)}
      </ol>
      <div className="privacy-note"><Shield size={17} aria-hidden="true" /><p>Camera tracking stays in your browser. Optional AI notes send a hand crop only when you ask for them.</p></div>
      <div className="promise-cta"><div><p className="story-kicker">Start with one letter</p><h2>Make room for one more conversation.</h2></div><Button as={Link} href="/practice?welcome=1" variant="default" size="lg" className="story-primary">Start practicing <ArrowRight size={18} aria-hidden="true" /></Button></div>
    </section>
  );
}

export default function Landing() {
  const [prefersReduced, setPrefersReduced] = useState(true);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  useEffect(() => spotlight(), []);
  return (
    <div id="top" className="landing-shell">
      <a className="landing-skip" href="#main-content">Skip to content</a>
      <Header />
      <main id="main-content">
        <Hero reduced={prefersReduced} />
        <CueRibbon />
        <Story />
        <Practice />
        <PromiseSection />
      </main>
      <footer className="story-footer"><a className="story-brand" href="#top"><img src="/mascot/wave-small.png" alt="" width="24" height="24" /><span>SignSense</span></a><span>On-device hand tracking · optional AI notes</span></footer>
    </div>
  );
}
