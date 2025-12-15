let questions = [];
let availableQuestions = [];
let currentIndex = 0;
let quizMode = 'random'; // 'random' or 'sequential'

const container = document.getElementById("square");

async function loadQuestions() {
  if (window.db) {
    try {
      const querySnapshot = await window.db.collection("questions").get();
      questions = [];
      querySnapshot.forEach((doc) => {
        questions.push(doc.data());
      });
    } catch (error) {
      console.log("Firebase error, loading from localStorage:", error);
      questions = JSON.parse(localStorage.getItem("questions") || "[]");
    }
  } else {
    questions = JSON.parse(localStorage.getItem("questions") || "[]");
  }
  availableQuestions = [...questions];
  currentIndex = 0;

  // Read mode (random/sequential) from previous selection if any
  try {
    quizMode = localStorage.getItem('quizMode') || 'random';
  } catch (e) {
    quizMode = 'random';
  }

  // Ensure score storage exists and current score is initialized
  if (!window.scores) {
    window.scores = JSON.parse(localStorage.getItem("scores") || "{}");
  }
  if (typeof window.currentScore !== 'number') {
    window.currentScore = window.scores[window.userName] || 0;
  }
  const scoreEl = document.getElementById("scoreDisplay");
  if (scoreEl) scoreEl.textContent = "Score: " + window.currentScore;

  // Hook up mode selector UI if present
  const modeSelect = document.getElementById('modeSelect');
  if (modeSelect) {
    modeSelect.value = quizMode;
    modeSelect.addEventListener('change', () => {
      quizMode = modeSelect.value;
      try { localStorage.setItem('quizMode', quizMode); } catch (e) {}
      // reset available questions if switching modes
      availableQuestions = [...questions];
      currentIndex = 0;
      updateDebugOverlay();
    });
  }

  // Create debug overlay for testing
  createDebugOverlay();
  if (questions.length === 0) {
    container.innerHTML = "<p>No questions yet. Add some below!</p>";
  } else {
    getRandomQuestion();
  }
}

function nextQuestion() {
  // Choose between random and sequential modes
  if (quizMode === 'sequential') {
    if (currentIndex >= questions.length) {
      container.innerHTML = "<p>All questions answered! Add more or refresh.</p>";
      return;
    }
    const q = questions[currentIndex];
    currentIndex++;
    displayQuestion(q);
  } else {
    // random
    if (!availableQuestions || availableQuestions.length === 0) {
      container.innerHTML = "<p>All questions answered! Add more or refresh.</p>";
      return;
    }
    const randIndex = Math.floor(Math.random() * availableQuestions.length);
    const q = availableQuestions.splice(randIndex, 1)[0];
    displayQuestion(q);
  }
}

function displayQuestion(q) {
    const card = document.createElement("section");
    card.className = "card";

    const p = document.createElement("p");
    p.className = "question";
    p.textContent = q.text;

    const form = document.createElement("form");
    form.autocomplete = "off";

    const choices = document.createElement("div");
    choices.className = "choices";

    q.options.forEach((opt, i) => {
        const label = document.createElement("label");
        label.className = "choice";

        const input = document.createElement("input");
        input.type = "radio";
      // Give the radio group a stable but unique name so choices don't conflict across questions
      input.name = 'choice_' + Math.random().toString(36).slice(2,9);
        input.value = i;

        const span = document.createElement("span");
        span.textContent = opt;

        label.appendChild(input);
        label.appendChild(span);
        choices.appendChild(label);
    });

    const btn = document.createElement("button");
    btn.className = "btn black";
    btn.textContent = "Submit";
    btn.type = "button";

    const result = document.createElement("div");
    result.className = "result";

    // Use click so radio selection updates before the handler runs
    btn.addEventListener("click", () => {
        const ans = form.querySelector("input:checked");

        if (!ans) {
            result.textContent = "Choose an answer!";
            result.className = "result wrong";
            return;
        }

        btn.remove();

        if (parseInt(ans.value) === q.correct) {
            result.textContent = "Correct!";
            result.className = "result correct";
        // Add 5 points for correct answer
        updateScore(5);
        } else {
            result.textContent = "Wrong!";
            result.className = "result wrong";
        // Subtract 5 points for wrong answer
        updateScore(-5);
        }

        // After a delay, show next question
        setTimeout(() => {
          nextQuestion();
        }, 2000);
    });

    form.appendChild(choices);
    form.appendChild(btn);

    card.appendChild(p);
    card.appendChild(form);
    card.appendChild(result);

    container.innerHTML = "";
    container.appendChild(card);
}

  // Update score helper
  function updateScore(delta) {
    if (!window.scores) window.scores = JSON.parse(localStorage.getItem("scores") || "{}");
    if (typeof window.currentScore !== 'number') window.currentScore = window.scores[window.userName] || 0;
    window.currentScore += delta;
    window.scores[window.userName] = window.currentScore;
    localStorage.setItem("scores", JSON.stringify(window.scores));
    const sd = document.getElementById("scoreDisplay"); if (sd) sd.textContent = "Score: " + window.currentScore;
    updateDebugOverlay();
  }

  // Debug overlay to help during development/testing
  function createDebugOverlay() {
    if (document.getElementById('debugOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'debugOverlay';
    overlay.style.position = 'fixed';
    overlay.style.right = '10px';
    overlay.style.bottom = '10px';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.style.color = '#fff';
    overlay.style.padding = '8px';
    overlay.style.fontSize = '12px';
    overlay.style.zIndex = 9999;
    overlay.style.maxWidth = '300px';
    overlay.style.borderRadius = '6px';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const title = document.createElement('strong');
    title.textContent = 'Debug';

    const toggle = document.createElement('button');
    toggle.textContent = 'Hide';
    toggle.style.marginLeft = '8px';
    toggle.style.fontSize = '11px';
    toggle.onclick = () => {
      const content = document.getElementById('debugContent');
      if (!content) return;
      if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = 'Hide';
      } else {
        content.style.display = 'none';
        toggle.textContent = 'Show';
      }
    };

    header.appendChild(title);
    header.appendChild(toggle);

    const content = document.createElement('pre');
    content.id = 'debugContent';
    content.style.whiteSpace = 'pre-wrap';
    content.style.maxHeight = '200px';
    content.style.overflow = 'auto';
    content.style.margin = '6px 0 0 0';

    overlay.appendChild(header);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    updateDebugOverlay();
  }

  function updateDebugOverlay() {
    const content = document.getElementById('debugContent');
    if (!content) return;
    const scores = window.scores || JSON.parse(localStorage.getItem('scores') || '{}');
    const user = window.userName || 'unknown';
    const current = typeof window.currentScore === 'number' ? window.currentScore : (scores[user] || 0);
    content.textContent = `user: ${user}\ncurrentScore: ${current}\nscores: ${JSON.stringify(scores, null, 2)}\navailableQuestions: ${availableQuestions ? availableQuestions.length : 0}\nmode: ${quizMode}`;
  }

(async () => {
  await loadQuestions();
  // start quiz according to selected mode
  nextQuestion();
})();
