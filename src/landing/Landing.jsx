'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MotionConfig, useInView } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowDown, ArrowRight, Check, Shield } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button.jsx';
import { Card } from '@/components/ui/card.jsx';
import { spotlight } from '@/fx.js';
import HandStage from './HandStage.jsx';
import BlurText from '@/components/fx/rb/BlurText.jsx';
import Magnet from '@/components/fx/rb/Magnet.jsx';
import ShinyText from '@/components/fx/rb/ShinyText.jsx';
import LightRays from '@/components/fx/rb/LightRays.jsx';
import { ScrollVelocity } from '@/components/fx/rb/ScrollVelocity.jsx';
import StarSky from './StarSky.jsx';
import { StarButton } from '@/components/fx/StarButton.jsx';
import { SpiralAnimation } from '@/components/fx/SpiralAnimation.jsx';
import PolaroidLineCarousel from '@/components/fx/PolaroidLineCarousel.jsx';
import { CardStack } from '@/components/fx/CardStack.jsx';
import BeamWordmarkFooter from '@/components/fx/BeamWordmarkFooter.jsx';
const ShaderAurora = dynamic(() => import('@/components/fx/ShaderAurora.jsx'), { ssr: false });
import Senso from './Senso.jsx';
import './landing-v3.css';
import './landing-v4.css';
import './landing-v5.css';

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
      <div className="hero3-shader" aria-hidden="true"><ShaderAurora /></div>
      <div className="hero3-copy">
        <p className="hero3-eyebrow"><i aria-hidden="true" />A practice room for your family</p>
        <div role="heading" aria-level={1} id="hero-title" className="hero3-title" aria-label="Dinner is loud. You have a story.">
          <MotionConfig reducedMotion="user">
            <span aria-hidden="true"><BlurText text="Dinner is loud." delay={110} animateBy="words" direction="bottom" className="hero3-line" /></span>
            <span aria-hidden="true"><BlurText text="You have a story." delay={110} animateBy="words" direction="bottom" className="hero3-line hero3-line-2" /></span>
          </MotionConfig>
        </div>
        <p className="hero3-sub">Your family is still learning your language. SignSense watches your hand through the camera and tells you the one thing to adjust next.</p>
        <div className="hero3-actions">
          <Magnet padding={70} magnetStrength={3}>
            <StarButton as={Link} href="/practice?welcome=1" lightColor="#bff6fb" backgroundColor="#05161a" lightWidth={140} duration={3.4} className="hero-star">Try a practice round</StarButton>
          </Magnet>
          <a className="hero3-secondary" href="#story"><ShinyText text="Read the story" color="#c3d3d8" shineColor="#ffffff" speed={3} delay={1.5} /><ArrowDown size={15} aria-hidden="true" /></a>
        </div>
      </div>
      <div className="hero3-stage">
        <HandStage letters={HERO_LETTERS} mode="auto" onLetter={onLetter} />
        <Senso pose="wave" size={160} className="hero3-senso" />
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
  const inView = useInView(ref, { margin: '-46% 0px -46% 0px', once: false });
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
      const last = root.current.querySelector('.story3-beat:last-child');
      ScrollTrigger.create({ trigger: last, start: 'top 75%', end: 'bottom bottom', onUpdate: (self) => { progress.current = self.progress; } });
      gsap.utils.toArray('.story3-beat', root.current).forEach((beat) => {
        const copy = beat.querySelectorAll('.story-kicker, .story-headline, .story-body, .story-continue');
        gsap.fromTo(copy, { autoAlpha: 0.2, y: 34 }, { autoAlpha: 1, y: 0, stagger: 0.07, ease: 'power3.out',
          scrollTrigger: { trigger: beat, start: 'top 75%', end: 'top 35%', scrub: 0.6 } });
      });
    });
    return () => media.revert();
  }, { scope: root });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) progress.current = active === 2 ? 1 : 0;
  }, [active]);

  return (
    <section ref={root} id="story" className="story3" aria-label="A family learning to communicate">
      <div className="story3-copy">
        {beats.map((beat, i) => <StoryBeat key={i} beat={beat} index={i} setActive={setCurrent} />)}
      </div>
      <figure className="story3-visual">
        <div className="story3-frame">
          <img className={`story3-img${active === 0 ? ' on' : ''}`} src="/media/story/dinner-dark.jpg" alt="A child at a dim dinner table, hands resting still, while the family talks across from them." width="1500" height="1000" />
          <img className={`story3-img${active === 1 ? ' on' : ''}`} src="/media/story/dinner-lit.jpg" alt="The same table in warmer light: the family is close, but the child is still on the edge of the conversation." width="1500" height="1000" />
          <div className={`story3-hand${active === 2 ? ' on' : ''}`}>
            <HandStage letters={STORY_LETTERS} mode="scrub" progressRef={progress} pointer={false} onLetter={onLetter} />
            <div className="story3-glyph" aria-hidden="true">{glyph}</div>
          </div>
        </div>
        <figcaption><span>{['The table', 'The same table', `Handshape ${STORY_LETTERS.indexOf(glyph) + 1} of ${STORY_LETTERS.length}`][active]}</span><span>{active === 2 ? 'Scroll to change it' : 'Keep scrolling'}</span></figcaption>
      </figure>
    </section>
  );
}

const POEM = ['Every hand', 'is a small', 'constellation.', 'Every letter,', 'a star', 'worth learning', 'to find.'];

function Poem() {
  const root = useRef(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const words = root.current.querySelectorAll('.poem-line');
      gsap.set(words, { autoAlpha: 0.08, y: 24, filter: 'blur(10px)' });
      gsap.to(words, { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.5, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top 60%', end: 'bottom 70%', scrub: 0.8 } });
    });
    return () => media.revert();
  }, { scope: root });
  return (
    <section ref={root} className="poem" aria-label="Every hand is a small constellation. Every letter, a star worth learning to find.">
      <div className="poem-sky" aria-hidden="true"><SpiralAnimation /></div>
      <p aria-hidden="true">{POEM.map((l, i) => <span key={i} className={`poem-line${i % 3 === 2 ? ' is-em' : ''}`}>{l}</span>)}</p>
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
        <Senso pose="read" size={160} className="practice-senso" />
      </div>
    </section>
  );
}

const SENSO_SLIDES = [
  { image: '/media/story/senso-wave.jpg', title: 'Hi, I’m Senso', caption: 'I’ll wave when you’re ready to start.', alt: 'Senso the octopus waving one tentacle.' },
  { image: '/media/story/senso-read.jpg', title: 'I read the alphabet', caption: 'Fingerspelling, one letter at a time.', alt: 'Senso reading a book of constellations.' },
  { image: '/media/story/senso-star.jpg', title: 'I keep the stars', caption: 'Every clean match earns one.', alt: 'Senso holding a glowing star.' },
  { image: '/media/story/senso-stars.jpg', title: 'Cheering for you', caption: 'A wrong shape is just practice.', alt: 'Senso with stars floating above its head.' },
];

function MeetSenso() {
  return (
    <section className="senso-section" aria-labelledby="senso-title">
      <header className="senso-head">
        <p className="story-kicker"><span className="story-step">Your coach</span>A friendly face for hard letters</p>
        <h2 id="senso-title">Meet <em>Senso.</em></h2>
        <p>Senso gives the one cue you need and celebrates when your hand lands. Drag the string to say hello.</p>
      </header>
      <PolaroidLineCarousel slides={SENSO_SLIDES} height="min(76svh, 640px)" cardWidth={300} sag={50} autoplay={5200} string="#5fd4e0" background="transparent" ink="#e8f6f7" ariaLabel="Senso, the practice coach" />
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
      <div className="promise-stack">
        <CardStack
          items={loop.map(([title, body], i) => ({ id: i, title, description: body, imageSrc: ['/media/story/senso-wave.jpg', '/media/story/senso-read.jpg', '/media/story/senso-star.jpg'][i] }))}
          cardWidth={360} cardHeight={300} maxVisible={3} overlap={0.5} spreadDeg={26} autoAdvance intervalMs={3200} showDots
          renderCard={(item) => (
            <div className="loop-card">
              <img src={item.imageSrc} alt="" draggable={false} />
              <div className="loop-card-text"><span>0{item.id + 1}</span><h3>{item.title}</h3><p>{item.description}</p></div>
            </div>
          )}
        />
      </div>
      <div className="privacy-note"><Shield size={17} aria-hidden="true" /><p>Camera tracking stays in your browser. Optional AI notes send a hand crop only when you ask for them.</p></div>
      <div className="promise-cta"><img className="cta-hands" src="/media/story/hands.jpg" alt="" aria-hidden="true" /><Senso pose="star" size={190} className="cta-senso" /><div><p className="story-kicker">Start with one letter</p><h2>Make room for one more conversation.</h2></div><Button as={Link} href="/practice?welcome=1" variant="default" size="lg" className="story-primary">Start practicing <ArrowRight size={18} aria-hidden="true" /></Button></div>
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
      <StarSky />
      <a className="landing-skip" href="#main-content">Skip to content</a>
      <Header />
      <main id="main-content">
        <Hero reduced={prefersReduced} />
        <CueRibbon />
        <Story />
        <Poem />
        <Practice />
        <MeetSenso />
        <PromiseSection />
      </main>
      <BeamWordmarkFooter
        brand="SignSense" wordmark="SignSense" company="SignSense" accent="#5fd4e0" background="#030a0b" ink="#e8f6f7" muted="#7fa3a8"
        wordTop="#2b9aa6" wordFoot="#04181b" wordWeight={400} fontSans='"Newsreader", Georgia, serif'
        socials={[{ label: 'GitHub', href: 'https://github.com/sarthakbagal23/SignSense', icon: 'github' }]}
        credits={[{ label: 'Built for TSA Software Development' }, { lead: 'Camera tracking stays ', label: 'on your device' }]}
        columns={[
          { title: 'Explore', links: [{ label: 'The story', href: '#story' }, { label: 'The practice', href: '#practice' }, { label: 'Our promise', href: '#promise' }] },
          { title: 'Try it', links: [{ label: 'Practice round', href: '/practice?welcome=1' }, { label: 'Demo mode', href: '/practice?demo=1' }] },
        ]}
      />
    </div>
  );
}
