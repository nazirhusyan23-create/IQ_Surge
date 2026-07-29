/* =========================================================================
   ADMOB INTEGRATION (Capacitor Native AdMob Support)
   ========================================================================= */
const AdManager = (function() {
  const BANNER_ID = 'ca-app-pub-9502060049942116/2608546109';
  const INTERSTITIAL_ID = 'ca-app-pub-9502060049942116/6814430138';

  let ready = false;

  function getAdMobPlugin() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
      return window.Capacitor.Plugins.AdMob;
    }
    return null;
  }

  async function initialize() {
    const AdMob = getAdMobPlugin();
    if (!AdMob) {
      console.log('[AdMob] Native Capacitor AdMob plugin not detected.');
      return;
    }
    try {
      await AdMob.initialize();
      ready = true;
      console.log('[AdMob] Initialized.');
      await showBanner();
      await prepareInterstitial();
    } catch (err) {
      console.warn('[AdMob] Initialize failed:', err);
    }
  }

  async function showBanner() {
    const AdMob = getAdMobPlugin();
    if (!AdMob || !ready) return;
    try {
      await AdMob.showBanner({
        adId: BANNER_ID,
        adSize: 'BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: false
      });
      console.log('[AdMob] Banner shown.');
    } catch (err) {
      console.warn('[AdMob] Banner show failed:', err);
    }
  }

  async function hideBanner() {
    const AdMob = getAdMobPlugin();
    if (!AdMob || !ready) return;
    try {
      await AdMob.hideBanner();
    } catch (err) {
      console.warn('[AdMob] Banner hide failed:', err);
    }
  }

  async function prepareInterstitial() {
    const AdMob = getAdMobPlugin();
    if (!AdMob || !ready) return;
    try {
      await AdMob.prepareInterstitial({
        adId: INTERSTITIAL_ID,
        isTesting: false
      });
      console.log('[AdMob] Interstitial prepared.');
    } catch (err) {
      console.warn('[AdMob] Interstitial prepare failed:', err);
    }
  }

  async function showInterstitial() {
    const AdMob = getAdMobPlugin();
    if (!AdMob || !ready) return;
    try {
      await AdMob.showInterstitial();
      console.log('[AdMob] Interstitial shown.');
    } catch (err) {
      console.warn('[AdMob] Interstitial show failed:', err);
    } finally {
      prepareInterstitial(); // Next ad ready rakhein
    }
  }

  return { initialize, showBanner, hideBanner, prepareInterstitial, showInterstitial };
})();

(function() {
  /* ---------------- UTILITIES ---------------- */
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = arr => arr[rand(0, arr.length - 1)];
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  function buildNumericOptions(correct) {
    const opts = new Set([correct]);
    while (opts.size < 4) {
      const delta = pick([-1, 1]) * rand(1, Math.max(3, Math.abs(correct) * 0.3 || 3));
      const candidate = Math.round(correct + delta);
      if (candidate !== correct) opts.add(candidate);
    }
    const arr = shuffle([...opts]);
    return { options: arr.map(String), correct: arr.indexOf(correct) };
  }

  /* ---------------- QUESTION GENERATORS ---------------- */

  // ---- MATH PUZZLES ----
  function genMathEquation(level) {
    const range = 5 + level * 2;
    const a = rand(1, range), b = rand(1, range), c = rand(1, range);
    const opsPool = level < 4 ? ['+', '-'] : ['+', '-', '*'];
    const op1 = pick(opsPool), op2 = pick(opsPool);
    const applyOps = (a, op1, b, op2, c) => {
      const doOp = (x, op, y) => op === '+' ? x + y : op === '-' ? x - y : op === '*' ? x * y : x / y;
      if (op2 === '*') return doOp(a, op1, doOp(b, op2, c));
      if (op1 === '*') return doOp(doOp(a, op1, b), op2, c);
      return doOp(doOp(a, op1, b), op2, c);
    };
    const result = applyOps(a, op1, b, op2, c);
    const { options, correct } = buildNumericOptions(result);
    return { tag: 'Math Puzzle', question: `Solve: ${a} ${op1} ${b} ${op2} ${c} = ?`, options, correct };
  }

  function genMissingOperator(level) {
    const range = 4 + level * 2;
    const ops = ['+', '-', '*'];
    const op = pick(ops);
    let a = rand(2, range), b = rand(2, range), result;
    if (op === '+') result = a + b;
    else if (op === '-') { if (a < b) [a, b] = [b, a]; result = a - b; }
    else result = a * b;
    const finalOps = shuffle(['+', '-', '*']);
    const correctIdx = finalOps.indexOf(op);
    return {
      tag: 'Math Puzzle',
      question: `Which operator completes the equation? ${a} ? ${b} = ${result}`,
      options: finalOps, correct: correctIdx
    };
  }

  function genBalanceEquation(level) {
    const range = 6 + level * 3;
    const a = rand(1, range);
    const missing = rand(1, range);
    const type = pick(['add', 'sub', 'mul']);
    let question, result;
    if (type === 'add') { result = a + missing; question = `${a} + ? = ${result}`; }
    else if (type === 'sub') { result = a - missing; question = `${a} - ? = ${result}`; }
    else { result = a * missing; question = `${a} × ? = ${result}`; }
    const { options, correct } = buildNumericOptions(missing);
    return { tag: 'Math Puzzle', question: `Balance the equation: ${question}`, options, correct };
  }

  function generateMathQuestion(level) {
    const gens = [genMathEquation, genMissingOperator, genBalanceEquation];
    return pick(gens)(level);
  }

  // ---- NUMBER SERIES ----
  function genLinearSeries(level) {
    const start = rand(1, 5 + level * 2);
    const diff = rand(2, 4 + level);
    const seq = [start];
    for (let i = 1; i < 5; i++) seq.push(seq[i - 1] + diff);
    const next = seq[4] + diff;
    const { options, correct } = buildNumericOptions(next);
    return { tag: 'Number Series', question: `What comes next? ${seq.join(', ')}, ?`, options, correct };
  }

  function genGeometricSeries(level) {
    const start = rand(1, 3 + Math.floor(level / 2));
    const ratio = rand(2, level < 5 ? 3 : 4);
    const seq = [start];
    for (let i = 1; i < 4; i++) seq.push(seq[i - 1] * ratio);
    const next = seq[3] * ratio;
    const { options, correct } = buildNumericOptions(next);
    return { tag: 'Number Series', question: `What comes next? ${seq.join(', ')}, ?`, options, correct };
  }

  function genFibonacciSeries(level) {
    let a = rand(1, 3 + level), b = rand(1, 3 + level);
    const seq = [a, b];
    for (let i = 0; i < 4; i++) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
    const next = seq[seq.length - 1] + seq[seq.length - 2];
    const { options, correct } = buildNumericOptions(next);
    return { tag: 'Number Series', question: `Find the next number: ${seq.join(', ')}, ?`, options, correct };
  }

  function genQuadraticSeries(level) {
    const start = rand(1, 5 + level);
    const d0 = rand(1, 3 + Math.floor(level / 2));
    const step = rand(1, 2 + Math.floor(level / 3));
    const seq = [start];
    let diff = d0;
    for (let i = 1; i < 5; i++) { seq.push(seq[i - 1] + diff); diff += step; }
    const next = seq[4] + diff;
    const { options, correct } = buildNumericOptions(next);
    return { tag: 'Number Series', question: `What comes next? ${seq.join(', ')}, ?`, options, correct };
  }

  function generateSeriesQuestion(level) {
    const gens = level < 3
      ? [genLinearSeries, genGeometricSeries]
      : [genLinearSeries, genGeometricSeries, genFibonacciSeries, genQuadraticSeries];
    return pick(gens)(level);
  }

  // ---- LOGICAL DEDUCTION ----
  const NAME_POOL = ['Alex', 'Maya', 'Jordan', 'Sam', 'Priya', 'Leo', 'Nadia', 'Omar', 'Zoe', 'Kai'];
  const TRAITS = [
    { unit: 'height', comp: 'taller', sup: 'tallest', inf: 'shortest' },
    { unit: 'age', comp: 'older', sup: 'oldest', inf: 'youngest' },
    { unit: 'speed', comp: 'faster', sup: 'fastest', inf: 'slowest' },
    { unit: 'score', comp: 'scored higher than', sup: 'highest scorer', inf: 'lowest scorer' }
  ];

  function genChainLogic(level) {
    const count = Math.min(3 + Math.floor(level / 3), 5);
    const names = shuffle(NAME_POOL).slice(0, count);
    const trait = pick(TRAITS);
    const statements = [];
    for (let i = 0; i < names.length - 1; i++) {
      statements.push(`${names[i]} is ${trait.comp} ${names[i + 1]}.`);
    }
    const shuffledStatements = shuffle(statements);
    const askSup = Math.random() < 0.5;
    const correctName = askSup ? names[0] : names[names.length - 1];
    const optionNames = shuffle(names).slice(0, Math.min(4, names.length));
    if (!optionNames.includes(correctName)) optionNames[rand(0, optionNames.length - 1)] = correctName;
    const options = shuffle([...new Set(optionNames)]).slice(0, 4);
    while (options.length < 4) options.push(pick(NAME_POOL.filter(n => !options.includes(n))));
    const correct = options.indexOf(correctName);
    return {
      tag: 'Logical Deduction',
      question: `${shuffledStatements.join(' ')} Who is the ${askSup ? trait.sup : trait.inf}?`,
      options, correct
    };
  }

  function genUncertainLogic(level) {
    const trait = pick(TRAITS);
    const names = shuffle(NAME_POOL).slice(0, 3);
    const statement1 = `${names[0]} is ${trait.comp} ${names[1]}.`;
    const statement2 = `${names[1]} is ${trait.comp} ${names[2]}.`;
    const question = `${statement1} ${statement2} Is it certain that ${names[0]} is ${trait.comp} ${names[2]}?`;
    const options = ['Yes, definitely', 'No', 'Cannot be determined'];
    const correct = 0;
    return { tag: 'Logical Deduction', question, options, correct };
  }

  function genComparisonLogic(level) {
    const trait = pick(TRAITS);
    const names = shuffle(NAME_POOL).slice(0, 4);
    const statement1 = `${names[0]} is ${trait.comp} ${names[1]}.`;
    const statement2 = `${names[2]} is ${trait.comp} ${names[3]}.`;
    const question = `${statement1} ${statement2} Based on this alone, is ${names[0]} ${trait.comp} ${names[3]}?`;
    const options = ['Yes, definitely', 'No', 'Cannot be determined'];
    const correct = 2;
    return { tag: 'Logical Deduction', question, options, correct };
  }

  function generateLogicQuestion(level) {
    const gens = level < 3
      ? [genChainLogic]
      : [genChainLogic, genUncertainLogic, genComparisonLogic];
    return pick(gens)(level);
  }

  // ---- MASTER GENERATOR ----
  function generateQuestion(level) {
    const category = pick(['math', 'series', 'logic']);
    let q;
    if (category === 'math') q = generateMathQuestion(level);
    else if (category === 'series') q = generateSeriesQuestion(level);
    else q = generateLogicQuestion(level);
    q.timeLimit = Math.max(6, 20 - Math.floor(level / 2));
    return q;
  }

  /* ---------------- GAME STATE ---------------- */
  const MAX_LIVES = 3;
  let level, lives, streak, bestStreak, totalCorrect, totalAnswered;
  let currentQuestion, timer, timeLeft, questionStartTime;
  let responseTimes = [];
  let levelsCompletedSinceAd = 0;

  const startScreen = document.getElementById('start-screen');
  const quizScreen = document.getElementById('quiz-screen');
  const resultScreen = document.getElementById('result-screen');
  const startBtn = document.getElementById('start-btn');
  const retryBtn = document.getElementById('retry-btn');
  const levelBadge = document.getElementById('level-badge');
  const livesEl = document.getElementById('lives');
  const streakBadge = document.getElementById('streak-badge');
  const timerEl = document.getElementById('timer');
  const progressFill = document.getElementById('progress-fill');
  const liveTier = document.getElementById('live-tier');
  const questionTag = document.getElementById('question-tag');
  const questionText = document.getElementById('question-text');
  const optionsContainer = document.getElementById('options-container');

  function showScreen(screen) {
    [startScreen, quizScreen, resultScreen].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
  }

  function renderLives() {
    livesEl.innerHTML = '';
    for (let i = 0; i < MAX_LIVES; i++) {
      const span = document.createElement('span');
      span.textContent = '❤️';
      if (i >= lives) span.classList.add('lost');
      livesEl.appendChild(span);
    }
  }

  /* ---------------- IQ ENGINE ---------------- */
  function computeIQ() {
    const accuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;
    const avgRatio = responseTimes.length
      ? responseTimes.reduce((s, r) => s + r, 0) / responseTimes.length
      : 0.6;
    const speedFactor = (1 - avgRatio) * 20;
    const levelFactor = Math.min(level, 40) * 1.1;
    const streakFactor = Math.min(bestStreak, 15) * 1.3;
    const base = 70 + accuracy * 40;
    let iq = base + levelFactor + speedFactor * 0.6 + streakFactor * 0.6;
    return Math.round(Math.max(65, Math.min(170, iq)));
  }

  function tierFor(iq) {
    if (iq >= 145) return { tier: 'Genius', desc: 'Extraordinary reasoning speed and depth — top 0.1% territory. You solved rapidly-escalating puzzles with elite precision.' };
    if (iq >= 130) return { tier: 'Gifted', desc: 'Exceptional analytical ability, well into the top few percent. Complex series and multi-step logic gave you little trouble.' };
    if (iq >= 120) return { tier: 'Superior', desc: 'Well above average reasoning skills, with strong accuracy under time pressure.' };
    if (iq >= 110) return { tier: 'Above Average', desc: 'Solid analytical thinking with a good grasp of logical and numerical patterns.' };
    if (iq >= 90) return { tier: 'Average', desc: 'A balanced, typical performance. More practice on series and deduction could push your score higher.' };
    return { tier: 'Developing', desc: 'There is room to grow — regular practice with logic puzzles and number series will sharpen your reasoning speed.' };
  }

  function updateLiveTier() {
    const iq = computeIQ();
    const { tier } = tierFor(iq);
    liveTier.innerHTML = `Estimated IQ: <b>${iq}</b> · ${tier}`;
  }

  /* ---------------- GAME LOOP ---------------- */
  function startTest() {
    level = 1; lives = MAX_LIVES; streak = 0; bestStreak = 0;
    totalCorrect = 0; totalAnswered = 0; responseTimes = [];
    levelsCompletedSinceAd = 0;
    showScreen(quizScreen);
    renderLives();
    updateLiveTier();
    loadQuestion();
  }

  function loadQuestion() {
    clearInterval(timer);
    currentQuestion = generateQuestion(level);
    timeLeft = currentQuestion.timeLimit;
    questionStartTime = Date.now();

    levelBadge.textContent = `Level ${level}`;
    streakBadge.textContent = `🔥 ${streak}`;
    questionTag.textContent = currentQuestion.tag;
    questionText.textContent = currentQuestion.question;
    progressFill.style.width = '100%';

    optionsContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    currentQuestion.options.forEach((opt, i) => {
      const div = document.createElement('div');
      div.className = 'option';
      div.innerHTML = `<span class="letter">${letters[i]}</span><span>${opt}</span>`;
      div.addEventListener('click', () => selectAnswer(i));
      optionsContainer.appendChild(div);
    });

    updateTimerDisplay();
    const tickMs = 100;
    let elapsed = 0;
    timer = setInterval(() => {
      elapsed += tickMs / 1000;
      timeLeft = currentQuestion.timeLimit - elapsed;
      updateTimerDisplay();
      progressFill.style.width = `${Math.max(0, (timeLeft / currentQuestion.timeLimit) * 100)}%`;
      if (timeLeft <= 0) {
        clearInterval(timer);
        timeLeft = 0;
        selectAnswer(-1);
      }
    }, tickMs);
  }

  function updateTimerDisplay() {
    timerEl.textContent = `⏱ ${Math.max(0, Math.ceil(timeLeft))}s`;
    timerEl.classList.toggle('warn', timeLeft <= currentQuestion.timeLimit * 0.25);
  }

  function selectAnswer(selectedIndex) {
    clearInterval(timer);
    const timeTaken = Math.min(currentQuestion.timeLimit, (Date.now() - questionStartTime) / 1000);
    const isCorrect = selectedIndex === currentQuestion.correct;
    totalAnswered++;

    const optionEls = optionsContainer.querySelectorAll('.option');
    optionEls.forEach((el, i) => {
      el.classList.add('disabled');
      if (i === currentQuestion.correct) el.classList.add('correct');
      else if (i === selectedIndex && !isCorrect) el.classList.add('wrong');
    });

    if (isCorrect) {
      totalCorrect++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
      responseTimes.push(timeTaken / currentQuestion.timeLimit);
      level++;
      levelsCompletedSinceAd++;

      // Interstitial ad every 3 level completions
      if (levelsCompletedSinceAd >= 3) {
        levelsCompletedSinceAd = 0;
        AdManager.showInterstitial();
      }
    } else {
      streak = 0;
      lives--;
      renderLives();
    }

    updateLiveTier();

    setTimeout(() => {
      if (lives <= 0) {
        endGame();
      } else {
        loadQuestion();
      }
    }, 900);
  }

  function endGame() {
    const iq = computeIQ();
    const { tier, desc } = tierFor(iq);
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    document.getElementById('iq-score').textContent = iq;
    document.getElementById('result-tier').textContent = tier;
    document.getElementById('result-desc').textContent = desc;
    document.getElementById('stat-level').textContent = level;
    document.getElementById('stat-streak').textContent = bestStreak;
    document.getElementById('stat-accuracy').textContent = `${accuracy}%`;

    showScreen(resultScreen);

    // Game Over Interstitial Ad
    AdManager.showInterstitial();
  }

  startBtn.addEventListener('click', startTest);
  retryBtn.addEventListener('click', () => showScreen(startScreen));
  document.querySelectorAll('.cat-card').forEach(card => card.addEventListener('click', startTest));

  // Initialize AdMob
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(AdManager.initialize, 500);
  });
})();
