'use client';

import Link from 'next/link';
import { ArrowRight, Camera, Check, CircleHelp, FlipHorizontal2, RotateCcw, ScanSearch, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card } from '@/components/ui/card.jsx';
import { KineticText } from '@/components/fx/KineticText.jsx';

const status = ['b-offline', 'b-track', 'b-fps'];

function Header() {
  return (
    <header className="practice-header">
      <Link className="practice-brand" href="/" aria-label="SignSense home"><img src="/mascot/wave-small.png" alt="" width="30" height="30" /><span>SignSense</span></Link>
      <nav className="tabs" aria-label="Practice mode">
        <button data-mode="practice" className="on" aria-pressed="true">Learn letters</button>
        <button data-mode="spell" aria-pressed="false">Spell a word</button>
        <button data-mode="warmup" aria-pressed="false"><RotateCcw size={15} aria-hidden="true" /><span className="mode-full">My warm-up</span><span className="mode-short">Warm up</span></button>
      </nav>
      <div className="practice-header-tools">
        <button id="b-goal" className="goal-button" title="Daily goal and streak">Today 0/10</button>
        <button id="b-mastery" className="quiet-button">Letter progress</button>
        <div className="system-status" aria-label="Tracking status">{status.map((id) => <span key={id} id={id} className={id === 'b-offline' ? 'badge ok' : 'badge'}>{id === 'b-offline' ? 'On-device' : id === 'b-track' ? 'Tracking: —' : '— fps'}</span>)}</div>
        <button id="b-help" className="icon-label"><CircleHelp size={17} aria-hidden="true" /><span>Help</span></button>
      </div>
    </header>
  );
}

function Stage() {
  return (
    <section className="stage-column" aria-label="Hand practice">
      <div className="stage" id="stage">
        <video id="video" playsInline muted />
        <canvas id="hud" />
        <canvas id="fx" />
        <div id="stage-placeholder" className="stage-placeholder" aria-hidden="true"><span className="placeholder-ring"><Camera size={30} /></span><span>Your practice space</span><small>Start the camera to begin a round.</small></div>
        <div className="stage-topline"><span className="stage-mode" id="modepill">PRACTICE</span><span className="streak-label" id="streak">STREAK 0</span></div>
        <canvas id="view3d" className="pip" role="img" tabIndex="0" aria-label="3D hand view. Drag or use the arrow keys to rotate; press Escape to reset." />
        <div className="pop" id="pop" aria-live="polite" />
      </div>
      <div className="sequence-row"><div className="sequence-label">YOUR ROUND</div><div className="word" id="word" aria-label="Letter sequence" /></div>
      <div className="stage-actions">
        <Button id="b-cam" variant="default" size="md"><Camera size={17} aria-hidden="true" /> Start camera</Button>
        <span className="privacy-tag"><Check size={14} aria-hidden="true" /> Camera stays on this device</span>
      </div>
      <div className="custom-word" id="custom-word" hidden>
        <label htmlFor="custom">Practice a word or name</label>
        <div className="custom-entry"><input id="custom" className="custom" name="practice-word" autoComplete="off" placeholder="For example, SAM?" maxLength={14} /><Button id="custom-start" size="sm">Practice this word</Button></div>
        <p>Letters outside this practice set will be skipped.</p>
      </div>
    </section>
  );
}

function Coach() {
  return (
    <section id="coach" className="coach-panel" data-kind="idle" aria-labelledby="coach-title">
      <div className="coach-heading"><span className="coach-senso"><img id="senso-img" src="/mascot/thinking-small.png" alt="" width="44" height="44" /></span><div><p className="panel-kicker">YOUR COACH</p><h2 id="coach-title">One cue at a time</h2></div><span className="coach-state" id="coach-ico" aria-hidden="true">•</span></div>
      <p className="coach-message" id="coach-msg" aria-live="polite" aria-atomic="true">Show your hand to the camera.</p>
      <div className="reading" id="reading" />
      <div className="coach-actions">
        <Button id="c-why" size="sm" hidden>Why this cue?</Button>
        <Button id="c-simple" size="sm" hidden>Say it another way</Button>
        <Button id="c-speak" size="sm" variant="ghost" aria-pressed="false" title="Read coaching aloud"><Volume2 size={15} aria-hidden="true" /><span className="speak-off">Listen</span><span className="speak-on">Voice on</span></Button>
      </div>
      <div className="ai-out coach-ai-out" id="coach-ai" hidden aria-live="polite" />
    </section>
  );
}

function Target() {
  return (
    <section className="target-panel" aria-labelledby="target-heading">
      <div className="panel-head"><div><p className="panel-kicker">CURRENT LETTER</p><h2 id="target-heading">Make this shape</h2></div><div className="gauge" id="gauge" style={{ '--p': 0 }} aria-label="Shape match score"><span id="gaugev">0%</span></div></div>
      <div className="target-row"><canvas id="ghost" aria-label="Target handshape preview" /><div className="target-info"><div className="glyph" id="glyph">A</div><p className="desc" id="desc">Fist, thumb resting beside the index finger</p></div></div>
      <p className="target-tip"><span className="tip-mark" /> Compare your hand with the preview, then follow the coach’s live cue.</p>
    </section>
  );
}

function Side() {
  return (
    <aside className="practice-rail" aria-label="Letter and coaching details">
      <Coach />
      <Target />
      <details className="details-panel finger-panel">
        <summary><span>Finger-by-finger check</span><small>Live shape detail</small></summary>
        <div className="meters" id="meters" aria-label="Live finger checks" />
        <p className="detail-caption">Green means that part matches. Adjustments appear in the coach above.</p>
      </details>
      <details className="details-panel">
        <summary><span>Ask Senso AI</span><small>Optional photo notes</small></summary>
        <div id="ai" className="ai-details">
          <p className="ai-note" id="ai-note">Only when you press a button, one small hand image is sent to the AI service for a second opinion.</p>
          <label className="select-label" htmlFor="ai-letter">Letter to check</label>
          <select id="ai-letter" name="ai-letter"><option value="">Current target</option></select>
          <Button id="ai-btn" variant="default" size="sm">Check this shape</Button>
          <div className="ai-action-row"><Button id="ai-name" size="sm">Word tips</Button><Button id="ai-sum" size="sm">Session recap</Button></div>
          <label className="toggle"><input type="checkbox" id="family" name="family-mode" /><span>Family mode<small>Use plain words for parents and relatives.</small></span></label>
          <Button id="go-family" size="sm" className="family-drill">Start the I-L-Y family drill</Button>
          <div className="ai-out" id="ai-out" hidden aria-live="polite" />
        </div>
      </details>
      <details className="details-panel">
        <summary><span>Letter radar</span><small>Compare the live reading</small></summary>
        <canvas id="radar" aria-label="Live score comparison across letters" />
      </details>
      <details className="details-panel controls-panel">
        <summary><span>Practice settings</span><small>Hand, sound, tracking</small></summary>
        <div className="more-controls-body">
          <label className="slider" htmlFor="tol">Tracking tolerance <input id="tol" name="tracking-tolerance" type="range" min="0.7" max="2" step="0.05" defaultValue="1" /> <b id="tolv">x1.00</b></label>
          <Button id="b-flip" size="sm"><FlipHorizontal2 size={16} aria-hidden="true" /> Flip hand</Button>
          <Button id="b-snd" size="sm"><Volume2 size={16} className="sound-on" aria-hidden="true" /><VolumeX size={16} className="sound-off" aria-hidden="true" /><span>Sound</span></Button>
          <Button id="b-dbg" size="sm"><ScanSearch size={16} aria-hidden="true" /> Inspector</Button>
        </div>
      </details>
      <section className="debug-panel" id="dbgcard" hidden><h2>Feature inspector</h2><pre id="debug-output" /></section>
    </aside>
  );
}

function Overlays() {
  return (
    <>
      <div id="start" className="overlay" hidden>
        <section className="start-card" role="dialog" aria-modal="true" aria-labelledby="start-title" aria-describedby="start-description">
          <div className="welcome-layout">
            <div className="welcome-film"><video id="welcome-video" muted playsInline preload="metadata" poster="/media/senso-intro-poster.jpg" aria-hidden="true"><source src="/media/senso-intro.mp4" type="video/mp4" /></video><span className="film-caption">A quick hello from Senso</span></div>
            <div className="welcome-copy"><p className="panel-kicker">A GOOD PLACE TO BEGIN</p>
              <h1 id="start-title">Practice one handshape.</h1>
              <p id="start-description">Your camera tracks 21 points on your hand, right in your browser. Senso gives one cue when a shape needs a small adjustment.</p>
              <ol className="welcome-steps" aria-label="How practice works"><li><span>01</span>See the handshape</li><li><span>02</span>Follow one clear cue</li><li><span>03</span>Build your round</li></ol>
              <div className="start-actions"><Button id="go-cam" variant="default" size="lg"><Camera size={17} aria-hidden="true" /> Start with camera</Button></div>
              <Button id="go-family2" variant="ghost" size="sm" className="family-start">Start a family I-L-Y drill</Button>
              <div className="start-note" id="start-note" role="status">Learn mode and the handshape guide work without a camera.</div>
            </div>
          </div>
          <div className="diag" id="diag" hidden>
            <b id="diag-title">Camera did not start</b><p id="diag-hint" />
            <div className="start-actions"><Button id="retry-cam" size="sm">Try camera again</Button><label className="btn small" id="pick-model-wrap" hidden>Select hand_landmarker.task<input id="model-file" type="file" accept=".task,application/octet-stream" hidden /></label><a id="model-link" className="btn small" href="https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task" target="_blank" rel="noopener" hidden>Download model</a></div>
          </div>
        </section>
      </div>
      <div id="mastery-modal" className="overlay" hidden><section className="start-card wide" role="dialog" aria-modal="true" aria-labelledby="mastery-title"><p className="panel-kicker">YOUR PRACTICE</p><h2 id="mastery-title">Letter progress</h2><p>Clean successes per letter, saved in this browser only.</p><div id="mastery-grid" className="mastery-grid" /><Button id="mastery-close" variant="default">Close progress</Button></section></div>
      <div id="report-modal" className="overlay" hidden><section className="start-card wide" role="dialog" aria-modal="true" aria-labelledby="report-title"><p className="panel-kicker">SESSION RECAP</p><h2 id="report-title">Nice session</h2><div id="report-body" className="report-body" /><div className="start-actions"><Button id="report-share" variant="default">Copy practice summary</Button><Button id="report-close">Keep practicing</Button></div></section></div>
      <div id="help" className="overlay" hidden><section className="start-card help-card" role="dialog" aria-modal="true" aria-labelledby="help-title"><p className="panel-kicker">QUICK HELP</p><h2 id="help-title">Move through a round</h2><p><kbd>←</kbd><kbd>→</kbd> change letter · <kbd>1</kbd> letters · <kbd>2</kbd> word · <kbd>H</kbd> flip hand · <kbd>M</kbd> mute · <kbd>G</kbd> inspector · <kbd>Esc</kbd> close</p><p className="start-note">Today’s goal is 10 clean letters. Fingerspelling is one small part of ASL; learn the language from Deaf teachers.</p><Button id="help-close" variant="default">Back to practice</Button></section></div>
      <div id="intro" className="intro" hidden aria-label="Loading SignSense">
        <div className="intro-mascot" aria-hidden="true">
          <img src="/mascot/wave.png" alt="" />
          <img src="/mascot/pointing.png" alt="" />
          <img src="/mascot/excited.png" alt="" />
        </div>
        <div className="intro-composition">
          <div className="intro-copy">
            <p className="intro-brandline">SIGNSENSE <span>·</span> PRACTICE STUDIO</p>
            <KineticText id="intro-status" text="Getting your practice ready" />
            <div className="intro-capabilities" aria-label="What SignSense can do">
              <div className="intro-capabilities-window" aria-hidden="true">
                <div className="intro-capabilities-track">
                  <span>SignSense can track your hand</span>
                  <span>SignSense can give one clear cue</span>
                  <span>SignSense can help you practice letters</span>
                </div>
              </div>
            </div>
            <p className="intro-subline">One clear cue is on its way.</p>
            <p className="sr-only" role="status" aria-live="polite">Getting your practice ready. SignSense tracks your hand on-device, offers one clear cue at a time, and helps you practice letter by letter.</p>
            <div className="intro-progress" aria-hidden="true"><span /></div>
          </div>
        </div>
        <Button id="intro-skip" size="sm" variant="ghost">Skip loading</Button>
      </div>
    </>
  );
}

export default function App() {
  return <div id="app" className="app-v2"><a className="skip-link" href="#main-content">Skip to practice</a><Header /><main id="main-content" className="workspace"><Stage /><Side /></main><Overlays /></div>;
}
