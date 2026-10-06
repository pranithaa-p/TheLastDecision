const screens = {
  intro: document.getElementById("introScreen"),
  game: document.getElementById("gameScreen"),
  ending: document.getElementById("endingScreen")
};

const roundNumber = document.getElementById("roundNumber");
const eventNumber = document.getElementById("eventNumber");
const eventTag = document.getElementById("eventTag");
const eventTitle = document.getElementById("eventTitle");
const eventText = document.getElementById("eventText");
const choices = document.getElementById("choices");

const resultBox = document.getElementById("resultBox");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");

const powerStat = document.getElementById("powerStat");
const safetyStat = document.getElementById("safetyStat");
const trustStat = document.getElementById("trustStat");

let round = 0;

const state = {
  power: 60,
  safety: 50,
  trust: 50
};

const events = [
  {
    tag: "DECISION 01 // POWER FAILURE",
    title: "Only one sector can receive emergency power.",
    text: "The hospital needs power for critical patients. The metro needs power to prevent a city-wide shutdown.",
    choices: [
      {
        title: "POWER THE HOSPITAL",
        desc: "Protect patients first.",
        effect: { power: -15, safety: +20, trust: +5 },
        result: "Hospital emergency systems stay online.",
        consequence: "But the metro network begins losing power."
      },
      {
        title: "POWER THE METRO",
        desc: "Keep the city moving.",
        effect: { power: -10, safety: +5, trust: +10 },
        result: "The metro network remains operational.",
        consequence: "But the hospital is forced onto backup power."
      }
    ]
  },
  {
    tag: "DECISION 02 // CASCADE",
    title: "The first decision has created a second problem.",
    text: "The city has one emergency generator left. You can use it now — or save it for a larger failure.",
    choices: [
      {
        title: "USE IT NOW",
        desc: "Fix the immediate problem.",
        effect: { power: -20, safety: +10, trust: +5 },
        result: "The immediate crisis is contained.",
        consequence: "The city will have almost no reserve."
      },
      {
        title: "SAVE THE RESERVE",
        desc: "Prepare for what might happen next.",
        effect: { power: -5, safety: -5, trust: +15 },
        result: "Emergency reserve remains available.",
        consequence: "The current disruption continues for longer."
      }
    ]
  },
  {
    tag: "DECISION 03 // FINAL CALL",
    title: "A city-wide failure is now possible.",
    text: "You have enough information to make one final allocation. Do you act immediately, or balance the consequences across all three systems?",
    choices: [
      {
        title: "ACT IMMEDIATELY",
        desc: "Solve the biggest visible problem.",
        effect: { power: -20, safety: +5, trust: -10 },
        result: "One sector is stabilized.",
        consequence: "Another sector begins to fail."
      },
      {
        title: "BALANCE THE SYSTEM",
        desc: "Accept smaller losses to protect the whole city.",
        effect: { power: -10, safety: +20, trust: +20 },
        result: "Resources are distributed across the hospital, metro and grid.",
        consequence: "No single sector gets everything — but the city remains stable."
      }
    ]
  }
];

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function updateStats() {
  powerStat.textContent = Math.max(0, state.power);
  safetyStat.textContent = Math.max(0, state.safety);
  trustStat.textContent = Math.max(0, state.trust);
}

function loadRound() {
  const event = events[round];

  roundNumber.textContent = `${round + 1} / ${events.length}`;
  eventNumber.textContent = String(round + 1).padStart(2, "0");
  eventTag.textContent = event.tag;
  eventTitle.textContent = event.title;
  eventText.textContent = event.text;

  choices.innerHTML = "";
  resultBox.classList.add("hidden");

  event.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.innerHTML = `
      <strong>${choice.title}</strong>
      <span>${choice.desc}</span>
    `;
    button.addEventListener("click", () => makeDecision(index));
    choices.appendChild(button);
  });
}

function makeDecision(index) {
  const choice = events[round].choices[index];

  state.power += choice.effect.power;
  state.safety += choice.effect.safety;
  state.trust += choice.effect.trust;

  updateStats();

  [...choices.children].forEach(button => {
    button.disabled = true;
    button.style.opacity = ".45";
    button.style.cursor = "default";
  });

  resultTitle.textContent = choice.result;
  resultText.textContent = choice.consequence;
  resultBox.classList.remove("hidden");

  document.getElementById("nextBtn").textContent =
    round === events.length - 1 ? "SEE THE OUTCOME →" : "NEXT DECISION →";
}

document.getElementById("startBtn").addEventListener("click", () => {
  round = 0;
  state.power = 60;
  state.safety = 50;
  state.trust = 50;
  updateStats();
  loadRound();
  showScreen("game");
});

document.getElementById("nextBtn").addEventListener("click", () => {
  if (round < events.length - 1) {
    round++;
    loadRound();
  } else {
    finishGame();
  }
});

function finishGame() {
  const successful = state.safety >= 70 && state.trust >= 65;

  document.getElementById("endingTitle").textContent =
    successful ? "THE CITY SURVIVED." : "THE CITY PAID THE PRICE.";

  document.getElementById("endingText").textContent =
    successful
      ? "You didn't protect one system at the expense of everything else. You considered what each decision would cause."
      : "You solved immediate problems, but the consequences accumulated. The city needed more than a quick answer.";

  document.getElementById("finalPower").textContent = Math.max(0, state.power);
  document.getElementById("finalSafety").textContent = Math.max(0, state.safety);
  document.getElementById("finalTrust").textContent = Math.max(0, state.trust);

  showScreen("ending");
}

document.getElementById("restartBtn").addEventListener("click", () => {
  round = 0;
  state.power = 60;
  state.safety = 50;
  state.trust = 50;
  updateStats();
  showScreen("intro");
});
