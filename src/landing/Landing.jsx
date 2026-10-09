import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowDown, ArrowRight, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card } from '@/components/ui/card.jsx';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const familyPhoto = 'https://images.unsplash.com/photo-1576089073624-b5751a8f4de9?auto=format&fit=crop&w=2400&h=1800&q=85';
const scenePhotos = [
  { src: familyPhoto, alt: 'A family gathered around a dinner table', note: 'A story, waiting to be shared.' },
  { src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1800&h=2200&q=85', alt: 'A group of people sitting together at sunset', note: 'Understanding grows both ways.' },
  { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&h=2200&q=85', alt: 'Friends exploring together in Paris', note: 'Start small. Keep showing up.' },
];

const beats = [
  {
    kicker: 'Imagine you’re ten.',
    title: <><span className="story-line">Dinner is loud.</span><span className="story-line">You have a story.</span><span className="story-line"><em>Your family is still learning your language.</em></span></>,
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

function StoryIntro({ onSkip }) {
  const video = useRef(null);
  useEffect(() => {
    const clip = video.current;
    const timer = window.setTimeout(onSkip, 3400);
    const stopAtTwoSeconds = () => {
      if (clip.currentTime < 2) return;
      clip.currentTime = 2;
      clip.pause();
    };
    clip.addEventListener('timeupdate', stopAtTwoSeconds);
    clip.play().catch(() => {});
    return () => {
      window.clearTimeout(timer);
      clip.removeEventListener('timeupdate', stopAtTwoSeconds);
      clip.pause();
    };
  }, [onSkip]);

  return (
    <motion.div className="story-intro" initial={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }} role="presentation">
      <div className="story-intro-composition">
        <div className="story-intro-film"><video ref={video} muted playsInline preload="auto" poster="/media/senso-intro-poster.jpg" aria-hidden="true"><source src="/media/senso-intro.mp4" type="video/mp4" /></video><span className="story-intro-film-edge" /></div>
        <div className="story-intro-copy">
          <p className="story-intro-brandline">SIGNSENSE <span>·</span> A FIRST HELLO</p>
          <p className="story-intro-status" role="status" aria-live="polite">Getting your practice ready</p>
          <p className="story-intro-subline">One clear cue is on its way.</p>
          <div className="story-intro-progress" aria-hidden="true"><span /></div>
        </div>
      </div>
      <button className="intro-skip" type="button" onClick={onSkip}>Skip intro</button>
    </motion.div>
  );
}

function Header({ inert = false }) {
  return (
    <header className="story-nav" inert={inert}>
      <a className="story-brand" href="#top" aria-label="SignSense home"><img src="/mascot/wave-small.png" alt="" width="28" height="28" /><span>SignSense</span></a>
      <nav aria-label="Main navigation">
        <a href="#story">The story</a>
        <a href="#practice">The practice</a>
        <a href="#promise">Our promise</a>
      </nav>
      <Button as="a" href="app.html?welcome=1" variant="default" size="sm" className="story-nav-cta">Try a practice round <ArrowRight size={15} aria-hidden="true" /></Button>
    </header>
  );
}

function StoryBeat({ beat, index, setActive }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: '-38% 0px -38% 0px', once: false });
  useEffect(() => {
    if (inView) setActive(index);
  }, [inView, index, setActive]);

  const Heading = beat.first ? 'h1' : 'h2';
  return (
    <article
      ref={ref}
      className={`story-beat${beat.first ? ' story-beat-first' : ''}${inView ? ' is-current' : ''}`}
      aria-current={inView ? 'step' : undefined}
    >
      <p className="story-kicker"><span className="story-step">0{index + 1}</span>{beat.kicker}</p>
      <Heading className="story-headline">{beat.title}</Heading>
      <p className="story-body">{beat.body}</p>
      {beat.first && <a className="story-continue" href="#practice">See how we can start <ArrowDown size={15} aria-hidden="true" /></a>}
    </article>
  );
}

function Story({ reduced }) {
  const [active, setActive] = useState(0);
  const setCurrent = useCallback((index) => setActive(index), []);
  const root = useRef(null);

  useGSAP(() => {
    const beats = gsap.utils.toArray('.story-beat', root.current);
    const firstLines = beats[0]?.querySelectorAll('.story-line');
    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (firstLines?.length) {
        gsap.fromTo(firstLines,
          { autoAlpha: 0, yPercent: 115 },
          { autoAlpha: 1, yPercent: 0, duration: 1.05, delay: 0.64, stagger: 0.13, ease: 'power4.out',
            scrollTrigger: { trigger: beats[0], start: 'top 78%', toggleActions: 'play none none reverse' } },
        );
      }

      beats.slice(1).forEach((beat) => {
        const copy = beat.querySelectorAll('.story-kicker, .story-headline, .story-body');
        gsap.fromTo(copy,
          { autoAlpha: 0.38, y: 36 },
          { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out',
            scrollTrigger: { trigger: beat, start: 'top 72%', end: 'center 46%', scrub: 0.65 } },
        );
      });

      const responsive = gsap.matchMedia();
      responsive.add('(min-width: 621px)', () => {
        const frame = root.current.querySelector('.story-photo-frame');
        const photo = root.current.querySelector('.story-photo-frame img');
        gsap.fromTo(frame,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1.2, delay: 0.58, ease: 'power3.inOut',
            scrollTrigger: { trigger: beats[0], start: 'top 78%', toggleActions: 'play none none reverse' } },
        );
        gsap.fromTo(photo,
          { scale: 1.28, xPercent: 4, yPercent: 12 },
          { scale: 1.02, xPercent: -2, yPercent: -10, ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.7 } },
        );
      });

      responsive.add('(max-width: 620px)', () => {
        const photo = root.current.querySelector('.story-photo-frame img');
        gsap.fromTo(photo,
          { scale: 1.18, xPercent: 2, yPercent: 3 },
          { scale: 1.04, xPercent: -1, yPercent: -2, ease: 'none',
            scrollTrigger: { trigger: beats[0], start: 'top top', end: 'bottom top', scrub: 0.5 } },
        );
      });

      return () => responsive.revert();
    });
    return () => media.revert();
  }, { scope: root });

  return (
    <section ref={root} id="story" className="scroll-story" aria-label="A family learning to communicate">
      <div className="story-copy">
        {beats.map((beat, i) => <StoryBeat key={i} beat={beat} index={i} setActive={setCurrent} />)}
      </div>
      <figure className={`story-visual story-visual-${active + 1}`}>
        <motion.div className="story-photo-frame" initial={reduced ? false : { opacity: 0, scale: 1.025 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}>
          {scenePhotos.map((scene, i) => <img key={scene.src} className={i === active ? 'scene-photo scene-photo-active' : 'scene-photo'} src={scene.src} alt={i === active ? scene.alt : ''} aria-hidden={i !== active} width="1800" height="2200" fetchPriority={i === 0 ? 'high' : 'auto'} loading={i === 0 ? 'eager' : 'lazy'} />)}
          <div className="scene-note" aria-hidden="true"><span className="scene-note-index">0{active + 1}</span><span>{scenePhotos[active].note}</span></div>
        </motion.div>
        <div className="story-index" aria-hidden="true"><span>0{active + 1}</span><i><b style={{ transform: `scaleY(${(active + 1) / 3})` }} /></i><span>03</span></div>
        <figcaption><span>THE STORY · 0{active + 1} / 03</span><span aria-live="polite">{beats[active].kicker}</span></figcaption>
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
      gsap.fromTo(frame.current, { autoAlpha: 0.25, y: 42, rotateY: 3 }, {
        autoAlpha: 1, y: 0, rotateY: 0, ease: 'power3.out',
        scrollTrigger: { trigger: frame.current, start: 'top 82%', end: 'center 58%', scrub: 0.7 },
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
      <div className="demo-window-bar"><div className="demo-window-brand"><img src="/mascot/wave-small.png" alt="" width="23" height="23" /><span>SignSense <i>/</i> Practice</span></div><span className="demo-live-state"><i aria-hidden="true" />{inView ? 'LIVE PREVIEW' : 'READY TO PREVIEW'}</span></div>
      <div className="practice-demo">
        {inView && <iframe src="app.html?demo=1&nointro=1&muted=1" title="SignSense handshape practice demo" loading="eager" />}
      </div>
      <div className="demo-window-foot"><span><b>21</b> hand points tracked on your device</span><span>Click to explore <ArrowRight size={14} aria-hidden="true" /></span></div>
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
        <div><p className="story-kicker"><span className="story-step">THE PRACTICE</span>Small steps. Real connection.</p><h2 id="practice-title">Their hands can learn, too.</h2></div>
        <p className="practice-lede">One letter at a time. SignSense follows the handshape in front of you and offers one useful adjustment, then lets you try again.</p>
      </header>
      <div className="practice-copy">
        <p className="practice-rail-title">A round, at your pace</p>
        <ul className="practice-facts">
          <li><span className="fact-index">01</span><span><b>See the shape</b><small>Compare your hand to a clear target.</small></span></li>
          <li><span className="fact-index">02</span><span><b>Follow one cue</b><small>Adjust one thing, like thumb beside index.</small></span></li>
          <li><span className="fact-index">03</span><span><b>Keep going</b><small>Practice a letter, a name, or a tricky round.</small></span></li>
        </ul>
        <Button as="a" href="app.html?welcome=1" variant="default" size="lg" className="story-primary">Try a practice round <ArrowRight size={18} aria-hidden="true" /></Button>
        <p className="practice-privacy"><Shield size={15} aria-hidden="true" /> Camera tracking stays on this device.</p>
      </div>
      <div className="practice-preview-wrap"><p className="preview-overline"><span>01</span> LIVE PRODUCT PREVIEW <span className="preview-overline-rule" /></p><PracticeDemo /><p className="practice-demo-caption">Try the letter controls. The demo loads only while it’s on screen and stays muted.</p></div>
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
        <p className="story-kicker"><span className="story-step">A NOTE</span>What this is for</p>
        <h2 id="promise-title">A place to practice.<br /><em>Not a substitute for people.</em></h2>
        <p>Fingerspelling is one small part of ASL. SignSense helps with the alphabet; learn the language and conversation from Deaf teachers and signers.</p>
      </div>
      <ol className="practice-loop">
        {loop.map(([title, body], i) => <li key={title}><span className="loop-number">0{i + 1}</span><div><h3>{title}</h3><p>{body}</p></div><Check size={17} aria-hidden="true" /></li>)}
      </ol>
      <div className="privacy-note"><Shield size={17} aria-hidden="true" /><p>Camera tracking stays in your browser. Optional AI notes send a hand crop only when you ask for them.</p></div>
      <div className="promise-cta"><div><p className="story-kicker">Start with one letter</p><h2>Make room for one more conversation.</h2></div><Button as="a" href="app.html?welcome=1" variant="default" size="lg" className="story-primary">Start practicing <ArrowRight size={18} aria-hidden="true" /></Button></div>
    </section>
  );
}

export default function Landing() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [intro, setIntro] = useState(!prefersReduced);
  const finishIntro = useCallback(() => setIntro(false), []);

  useEffect(() => {
    if (!intro) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') finishIntro(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [intro, finishIntro]);

  return (
    <div id="top" className="landing-shell">
      <a className="landing-skip" href="#main-content" inert={intro}>Skip to content</a>
      <Header inert={intro} />
      <main id="main-content" inert={intro}>
        <Story reduced={prefersReduced} />
        <Practice />
        <PromiseSection />
      </main>
      <footer className="story-footer" inert={intro}><a className="story-brand" href="#top"><img src="/mascot/wave-small.png" alt="" width="24" height="24" /><span>SignSense</span></a><span>On-device hand tracking · optional AI notes</span></footer>
      <AnimatePresence>{intro && <StoryIntro key="story-intro" onSkip={finishIntro} />}</AnimatePresence>
    </div>
  );
}
