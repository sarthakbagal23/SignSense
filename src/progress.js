// Per-letter mastery: clean successes counted across sessions. Safe if storage is blocked.
const KEY = 'signsense:mastery:v1';
let mem = {};
try { mem = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { mem = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* ignore */ } };
export const mastery = {
  get: (l) => mem[l] || 0,
  hit(l) { mem[l] = (mem[l] || 0) + 1; save(); },
  done: (l) => (mem[l] || 0) >= 1,
};

// Coaching cues are counted once per cue change and kept with local mastery data.
const MKEY = 'signsense:misses:v1';
let misses = {};
try { misses = JSON.parse(localStorage.getItem(MKEY) || '{}'); } catch { misses = {}; }
const saveMisses = () => { try { localStorage.setItem(MKEY, JSON.stringify(misses)); } catch { /* ignore */ } };
export const practiceHistory = {
  miss(l) { misses[l] = (misses[l] || 0) + 1; saveMisses(); },
  weakest(letters, limit = 5) {
    const attempted = letters.filter((l) => (misses[l] || 0) + mastery.get(l) > 0);
    const pool = attempted.length ? attempted : letters;
    return [...pool].sort((a, b) => {
      const missA = misses[a] || 0, missB = misses[b] || 0;
      const totalA = missA + mastery.get(a), totalB = missB + mastery.get(b);
      const rateA = totalA ? missA / totalA : 0, rateB = totalB ? missB / totalB : 0;
      return rateB - rateA || missB - missA || mastery.get(a) - mastery.get(b) || a.localeCompare(b);
    }).slice(0, limit);
  },
  hasAttempts(letters) { return letters.some((l) => (misses[l] || 0) + mastery.get(l) > 0); },
};

// Daily goal + day streak (local to this browser).
const DKEY = 'signsense:daily:v1';
const dayId = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
let dmem = { date: '', count: 0, streak: 0, last: '', goal: 10 };
try { dmem = { ...dmem, ...JSON.parse(localStorage.getItem(DKEY) || '{}') }; } catch { /* ignore */ }
const dsave = () => { try { localStorage.setItem(DKEY, JSON.stringify(dmem)); } catch { /* ignore */ } };
function roll() {
  const today = dayId();
  if (dmem.date !== today) { dmem.date = today; dmem.count = 0; }
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (dmem.last && dmem.last !== today && dmem.last !== dayId(y)) dmem.streak = 0; // missed a day
}
export const daily = {
  state() { roll(); return { count: dmem.count, goal: dmem.goal, streak: dmem.streak, hit: dmem.count >= dmem.goal }; },
  // Returns true exactly when this clean letter completes today's goal.
  add() {
    roll(); const was = dmem.count; dmem.count++;
    if (dmem.last !== dmem.date) { dmem.streak = (dmem.streak || 0) + 1; dmem.last = dmem.date; }
    dsave(); return was < dmem.goal && dmem.count >= dmem.goal;
  },
};
