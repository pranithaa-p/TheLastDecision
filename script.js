/**
 * THE LAST DECISION — CHENNAI 2047 // THIRUKKURAL 461
 * A 3-minute playable narrative experience combining exploration, dialogue,
 * in-world consequences, and ancient philosophy.
 * Vanilla JavaScript • Zero dependencies.
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // ==========================================================================
  // 1. GAME STATE
  // ==========================================================================
  const state = {
    phase: "INTRO", // INTRO, EXPLORE_1, DIALOGUE, DECISION, EXPLORE_2, EXPLORE_3, CLIMAX, REVEAL
    player: {
      x: 470,
      y: 290,
      speed: 4.2,
      isMoving: false
    },
    keys: {
      up: false,
      down: false,
      left: false,
      right: false
    },
    worldBounds: {
      minX: 40,
      maxX: 960,
      minY: 40,
      maxY: 600
    },
    activeNpc: null,
    storyStep: 1, // 1: Metro crisis, 2: Substation reserve, 3: Final cascade
    decisionsHistory: [],
    audioEnabled: true,
    audioCtx: null,
    typewriterTimer: null,
    isTyping: false,
    dialogueQueue: [],
    currentDialogueIndex: 0,
    onDialogueComplete: null
  };

  // ==========================================================================
  // 2. AUDIO SYNTHESIZER (Web Audio API, Zero External Assets)
  // ==========================================================================
  function initAudio() {
    if (!state.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        state.audioCtx = new AudioCtxClass();
      }
    }
    if (state.audioCtx && state.audioCtx.state === "suspended") {
      state.audioCtx.resume();
    }
  }

  function playTone(freq, type = "sine", duration = 0.08, gainVol = 0.06) {
    if (!state.audioEnabled) return;
    try {
      initAudio();
      if (!state.audioCtx) return;

      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime);

      gain.gain.setValueAtTime(gainVol, state.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(state.audioCtx.destination);

      osc.start();
      osc.stop(state.audioCtx.currentTime + duration);
    } catch {
      // Audio fallback without throwing errors
    }
  }

  const sfx = {
    blip: () => playTone(820, "triangle", 0.04, 0.03),
    step: () => playTone(160, "sine", 0.05, 0.02),
    interact: () => {
      playTone(480, "sine", 0.08, 0.06);
      setTimeout(() => playTone(720, "sine", 0.1, 0.06), 60);
    },
    choice: () => {
      playTone(400, "triangle", 0.1, 0.08);
      setTimeout(() => playTone(600, "triangle", 0.15, 0.08), 80);
    },
    alarm: () => {
      playTone(280, "sawtooth", 0.18, 0.07);
      setTimeout(() => playTone(220, "sawtooth", 0.22, 0.07), 100);
    },
    triumph: () => {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        setTimeout(() => playTone(freq, "sine", 0.25, 0.07), idx * 100);
      });
    }
  };

  // ==========================================================================
  // 3. DOM ELEMENT REFERENCES
  // ==========================================================================
  const els = {
    soundToggle: document.getElementById("soundToggle"),
    soundIcon: document.getElementById("soundIcon"),
    soundText: document.getElementById("soundText"),

    // Intro
    introOverlay: document.getElementById("introOverlay"),
    introLine1: document.getElementById("introLine1"),
    introLine2: document.getElementById("introLine2"),
    introLine3: document.getElementById("introLine3"),
    introSkyline: document.getElementById("introSkyline"),
    introLineAlert: document.getElementById("introLineAlert"),
    introLineRole: document.getElementById("introLineRole"),
    btnStartStory: document.getElementById("btnStartStory"),

    // In-Game HUD
    hudObjective: document.getElementById("hudObjective"),
    stateHospital: document.getElementById("stateHospital"),
    stateMetro: document.getElementById("stateMetro"),
    stateGrid: document.getElementById("stateGrid"),

    // World Elements
    player: document.getElementById("playerCharacter"),
    npcArun: document.getElementById("npcArun"),
    bubbleArun: document.getElementById("bubbleArun"),
    npcKavitha: document.getElementById("npcKavitha"),
    bubbleKavitha: document.getElementById("bubbleKavitha"),
    consequenceBanner: document.getElementById("consequenceBanner"),
    bannerTitle: document.getElementById("bannerTitle"),
    bannerBody: document.getElementById("bannerBody"),

    // Buildings & Districts
    zoneMetro: document.getElementById("zoneMetro"),
    zoneHospital: document.getElementById("zoneHospital"),
    zonePower: document.getElementById("zonePower"),
    hospBeacon: document.getElementById("hospBeacon"),
    metroSignStatus: document.getElementById("metroSignStatus"),
    hospSignStatus: document.getElementById("hospSignStatus"),
    gridSignStatus: document.getElementById("gridSignStatus"),
    reserveMeter: document.getElementById("reserveMeter"),

    // Cables
    cableGridMetro: document.getElementById("cableGridMetro"),
    cableGridHospital: document.getElementById("cableGridHospital"),
    cableMetroHospital: document.getElementById("cableMetroHospital"),

    // Dialogue Box
    dialogueContainer: document.getElementById("dialogueContainer"),
    dialogueAvatar: document.getElementById("dialogueAvatar"),
    dialogueName: document.getElementById("dialogueName"),
    dialogueRole: document.getElementById("dialogueRole"),
    dialogueText: document.getElementById("dialogueText"),
    btnAdvanceDialogue: document.getElementById("btnAdvanceDialogue"),

    // Decision Modal
    decisionModal: document.getElementById("decisionModal"),
    decisionTag: document.getElementById("decisionTag"),
    decisionPromptTitle: document.getElementById("decisionPromptTitle"),
    decisionPromptSub: document.getElementById("decisionPromptSub"),

    c1Icon: document.getElementById("c1Icon"),
    c1Title: document.getElementById("c1Title"),
    c1Stakes: document.getElementById("c1Stakes"),
    c1Downside: document.getElementById("c1Downside"),
    btnSelectChoice1: document.getElementById("btnSelectChoice1"),

    c2Icon: document.getElementById("c2Icon"),
    c2Title: document.getElementById("c2Title"),
    c2Stakes: document.getElementById("c2Stakes"),
    c2Downside: document.getElementById("c2Downside"),
    btnSelectChoice2: document.getElementById("btnSelectChoice2"),

    // Reveal Screen
    revealOverlay: document.getElementById("revealOverlay"),
    outcomeBanner: document.getElementById("outcomeBanner"),
    verdictTitle: document.getElementById("verdictTitle"),
    verdictDesc: document.getElementById("verdictDesc"),
    timelineSteps: document.getElementById("timelineSteps"),
    btnPlayAgain: document.getElementById("btnPlayAgain"),

    // Mobile D-Pad
    dpadUp: document.getElementById("dpadUp"),
    dpadDown: document.getElementById("dpadDown"),
    dpadLeft: document.getElementById("dpadLeft"),
    dpadRight: document.getElementById("dpadRight"),
    mobileInteractBtn: document.getElementById("mobileInteractBtn")
  };

  // ==========================================================================
  // 4. CINEMATIC INTRO SEQUENCE
  // ==========================================================================
  function runIntroSequence() {
    setTimeout(() => els.introLine1.classList.add("show"), 300);
    setTimeout(() => els.introLine2.classList.add("show"), 900);
    setTimeout(() => els.introLine3.classList.add("show"), 1600);
    setTimeout(() => els.introSkyline.classList.add("show"), 2300);
    setTimeout(() => {
      sfx.alarm();
      els.introLineAlert.classList.add("show");
    }, 3100);
    setTimeout(() => els.introLineRole.classList.add("show"), 3800);
    setTimeout(() => els.btnStartStory.classList.add("show"), 4400);
  }

  function startExplorePhase() {
    initAudio();
    sfx.interact();
    els.introOverlay.classList.remove("active");
    state.phase = "EXPLORE_1";
    updateObjective("Head northwest to the Metro entrance and speak with Arun.");
    els.hospBeacon.classList.add("beacon-alert");
  }

  // ==========================================================================
  // 5. PLAYER MOVEMENT & GAME LOOP
  // ==========================================================================
  let lastStepSoundTime = 0;

  function updatePlayerPosition() {
    if (state.phase === "DIALOGUE" || state.phase === "DECISION" || state.phase === "REVEAL") {
      return;
    }

    let dx = 0;
    let dy = 0;

    if (state.keys.up) dy -= 1;
    if (state.keys.down) dy += 1;
    if (state.keys.left) dx -= 1;
    if (state.keys.right) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    if (dx !== 0 || dy !== 0) {
      state.player.x += dx * state.player.speed;
      state.player.y += dy * state.player.speed;

      // Keep inside world bounds
      state.player.x = Math.max(state.worldBounds.minX, Math.min(state.worldBounds.maxX, state.player.x));
      state.player.y = Math.max(state.worldBounds.minY, Math.min(state.worldBounds.maxY, state.player.y));

      // Visual DOM update
      els.player.style.left = `${state.player.x}px`;
      els.player.style.top = `${state.player.y}px`;

      // Subtle step audio
      const now = performance.now();
      if (now - lastStepSoundTime > 260) {
        sfx.step();
        lastStepSoundTime = now;
      }
    }

    checkProximityInteractions();
  }

  function gameLoop() {
    updatePlayerPosition();
    requestAnimationFrame(gameLoop);
  }

  // ==========================================================================
  // 6. PROXIMITY DETECTION & INTERACTION BUBBLE
  // ==========================================================================
  function checkProximityInteractions() {
    const px = state.player.x;
    const py = state.player.y;

    // Distances
    const distArun = Math.hypot(px - 240, py - 250);
    const distKavitha = Math.hypot(px - 480, py - 430);

    const threshold = 75;

    // Arun at Metro
    if (distArun < threshold && state.storyStep === 1) {
      els.bubbleArun.classList.add("visible");
      state.activeNpc = "arun";
    } else {
      els.bubbleArun.classList.remove("visible");
      if (state.activeNpc === "arun") state.activeNpc = null;
    }

    // Kavitha at Substation
    if (distKavitha < threshold && (state.storyStep === 2 || state.storyStep === 3)) {
      els.bubbleKavitha.classList.add("visible");
      state.activeNpc = "kavitha";
    } else {
      els.bubbleKavitha.classList.remove("visible");
      if (state.activeNpc === "kavitha") state.activeNpc = null;
    }
  }

  function triggerInteraction() {
    if (state.phase === "DIALOGUE") {
      advanceDialogue();
      return;
    }

    if (!state.activeNpc) return;

    sfx.interact();

    if (state.activeNpc === "arun" && state.storyStep === 1) {
      startDialogue(
        "A",
        "ARUN — METRO OPERATOR",
        "CHENNAI CENTRAL METRO",
        [
          "The metro line just lost traction power.",
          "Over 2,400 passengers are trapped in the underground tunnels right now.",
          "The ventilation fans are down. Oxygen is going to drop fast.",
          "Wait... the regional hospital's ICU is pleading for emergency feed on the same wire.",
          "We only have reserve capacity for ONE sector. Coordinator, who gets the power?"
        ],
        () => {
          showDecision1();
        }
      );
    } else if (state.activeNpc === "kavitha" && state.storyStep === 2) {
      startDialogue(
        "K",
        "KAVITHA — CHIEF POWER ENGINEER",
        "SUBSTATION 04 // TNEB",
        [
          "Coordinator, you saw what happened at the metro and hospital.",
          "The electrical grid isn't failing by accident. It's an allocation loop.",
          "Every time you divert power to save one sector, another sector's safety buffer vanishes.",
          "We found one strategic emergency diesel generator staged in Reserve.",
          "Do we ignite it now to relieve the current strain, or preserve it for a larger catastrophe?"
        ],
        () => {
          showDecision2();
        }
      );
    } else if (state.activeNpc === "kavitha" && state.storyStep === 3) {
      startDialogue(
        "K",
        "KAVITHA — CHIEF POWER ENGINEER",
        "SUBSTATION 04 // TNEB",
        [
          "ALERT: Total systemic resonance cascade imminent across metropolitan Chennai!",
          "If the remaining grid drops, the Hospital, Metro, and Residential networks collapse together.",
          "This is your LAST decision, Coordinator.",
          "Do you chase the single loudest emergency right now — or force a balanced ration across the whole city?"
        ],
        () => {
          showDecision3();
        }
      );
    }
  }

  // ==========================================================================
  // 7. DIALOGUE SYSTEM (Typewriter & Multi-Line)
  // ==========================================================================
  function startDialogue(avatar, name, role, lines, onComplete) {
    state.phase = "DIALOGUE";
    state.dialogueQueue = lines;
    state.currentDialogueIndex = 0;
    state.onDialogueComplete = onComplete;

    els.dialogueAvatar.textContent = avatar;
    els.dialogueName.textContent = name;
    els.dialogueRole.textContent = role;

    els.dialogueContainer.classList.remove("hidden");
    renderCurrentDialogueLine();
  }

  function renderCurrentDialogueLine() {
    if (state.typewriterTimer) clearInterval(state.typewriterTimer);

    const fullText = state.dialogueQueue[state.currentDialogueIndex];
    els.dialogueText.textContent = "";
    state.isTyping = true;

    let charIdx = 0;
    state.typewriterTimer = setInterval(() => {
      if (charIdx < fullText.length) {
        els.dialogueText.textContent += fullText[charIdx];
        if (charIdx % 3 === 0) sfx.blip();
        charIdx++;
      } else {
        clearInterval(state.typewriterTimer);
        state.isTyping = false;
      }
    }, 18);
  }

  function advanceDialogue() {
    if (state.isTyping) {
      // Instant skip typewriter
      clearInterval(state.typewriterTimer);
      els.dialogueText.textContent = state.dialogueQueue[state.currentDialogueIndex];
      state.isTyping = false;
      return;
    }

    sfx.blip();
    state.currentDialogueIndex++;
    if (state.currentDialogueIndex < state.dialogueQueue.length) {
      renderCurrentDialogueLine();
    } else {
      // Finished all lines
      els.dialogueContainer.classList.add("hidden");
      if (state.onDialogueComplete) {
        const callback = state.onDialogueComplete;
        state.onDialogueComplete = null;
        callback();
      } else {
        state.phase = "EXPLORE_1";
      }
    }
  }

  // ==========================================================================
  // 8. DECISION 1: HOSPITAL VS METRO
  // ==========================================================================
  function showDecision1() {
    state.phase = "DECISION";
    els.decisionTag.textContent = "CRITICAL ALLOCATION // 01";
    els.decisionPromptTitle.textContent = "Only one sector can receive emergency power.";
    els.decisionPromptSub.textContent = "Weigh human life against civic transit paralysis.";

    // Option 1
    els.c1Icon.textContent = "+";
    els.c1Title.textContent = "HELP THE HOSPITAL";
    els.c1Stakes.innerHTML = `
      <span class="stake-line"><strong>43 patients</strong> on ICU life support</span>
      <span class="stake-line">Emergency trauma surgical units energized</span>
    `;
    els.c1Downside.innerHTML = "<strong>Consequence:</strong> Metro network drops completely. 2,400 passengers trapped in tunnels.";
    els.btnSelectChoice1.textContent = "ROUTE POWER TO HOSPITAL [1]";

    // Option 2
    els.c2Icon.textContent = "M";
    els.c2Title.textContent = "SAVE THE METRO";
    els.c2Stakes.innerHTML = `
      <span class="stake-line"><strong>2,400 passengers</strong> in subterranean lines</span>
      <span class="stake-line">Tunnel air circulation restored; avoids asphyxiation</span>
    `;
    els.c2Downside.innerHTML = "<strong>Consequence:</strong> Hospital forced onto auxiliary battery with 14 minutes left.";
    els.btnSelectChoice2.textContent = "ROUTE POWER TO METRO [2]";

    els.decisionModal.classList.remove("hidden");
  }

  function handleDecision1Choice(choice) {
    sfx.choice();
    els.decisionModal.classList.add("hidden");

    if (choice === 1) {
      // Hospital chosen
      state.decisionsHistory.push({
        step: 1,
        title: "HELP THE HOSPITAL",
        direct: "Hospital ICU and trauma wards fully powered.",
        ripple: "Metro was shut down; passengers stranded in dark tunnels."
      });

      // World Updates
      els.zoneHospital.classList.add("state-active");
      els.hospSignStatus.textContent = "STABLE ✓";
      els.hospSignStatus.style.backgroundColor = "var(--c-green-tint)";
      els.hospSignStatus.style.color = "var(--c-green)";
      els.hospBeacon.classList.remove("beacon-alert");

      els.metroSignStatus.textContent = "BLACKOUT !";
      els.stateHospital.textContent = "STABLE";
      els.stateHospital.className = "chip-state stable";
      els.stateMetro.textContent = "OFFLINE";
      els.stateMetro.className = "chip-state critical";

      els.cableGridHospital.setAttribute("class", "cable-path cable-active");
      els.cableGridMetro.setAttribute("class", "cable-path cable-severed");

      showConsequenceBanner(
        "HOSPITAL ENERGIZED // METRO OFFLINE",
        "You protected critical patients. But thousands remain stranded underground in the dark."
      );
    } else {
      // Metro chosen
      state.decisionsHistory.push({
        step: 1,
        title: "SAVE THE METRO",
        direct: "Metro network kept running; passengers evacuated safely.",
        ripple: "Hospital life support forced onto emergency 14-min battery."
      });

      // World Updates
      els.zoneMetro.classList.add("state-active");
      els.metroSignStatus.textContent = "STABLE ✓";
      els.metroSignStatus.style.backgroundColor = "var(--c-green-tint)";
      els.metroSignStatus.style.color = "var(--c-green)";

      els.hospSignStatus.textContent = "BATTERY 14m";
      els.hospSignStatus.style.backgroundColor = "var(--c-red-tint)";
      els.hospSignStatus.style.color = "var(--c-red)";

      els.stateMetro.textContent = "STABLE";
      els.stateMetro.className = "chip-state stable";
      els.stateHospital.textContent = "BATTERY";
      els.stateHospital.className = "chip-state critical";

      els.cableGridMetro.setAttribute("class", "cable-path cable-active");
      els.cableGridHospital.setAttribute("class", "cable-path cable-severed");

      showConsequenceBanner(
        "METRO POWERED // HOSPITAL AT RISK",
        "You prevented a panic disaster in the tunnels. But the hospital is now on borrowed time."
      );
    }

    // Advance to Step 2
    state.storyStep = 2;
    state.phase = "EXPLORE_2";
    updateObjective("The crisis is cascading. Walk south to Substation 04 and inspect the generator.");
  }

  // ==========================================================================
  // 9. DECISION 2: USE GENERATOR VS SAVE RESERVE
  // ==========================================================================
  function showDecision2() {
    state.phase = "DECISION";
    els.decisionTag.textContent = "TACTICAL BUFFER // 02";
    els.decisionPromptTitle.textContent = "The first choice triggered a second crisis.";
    els.decisionPromptSub.textContent = "Only one emergency generator remains in reserve.";

    // Option 1
    els.c1Icon.textContent = "⚡";
    els.c1Title.textContent = "USE GENERATOR NOW";
    els.c1Stakes.innerHTML = `
      <span class="stake-line">Instantly fixes the current unpowered sector</span>
      <span class="stake-line">Immediate relief for civic complaints</span>
    `;
    els.c1Downside.innerHTML = "<strong>Consequence:</strong> Reserve drops to 0%. Any future shock causes total city collapse.";
    els.btnSelectChoice1.textContent = "DEPLOY GENERATOR NOW [1]";

    // Option 2
    els.c2Icon.textContent = "🛡";
    els.c2Title.textContent = "SAVE THE RESERVE";
    els.c2Stakes.innerHTML = `
      <span class="stake-line">Preserves critical buffer for the greater system</span>
      <span class="stake-line">Grid remains resilient against incoming surge</span>
    `;
    els.c2Downside.innerHTML = "<strong>Consequence:</strong> Managed brownout continues; temporary public friction.";
    els.btnSelectChoice2.textContent = "HOLD IN RESERVE [2]";

    els.decisionModal.classList.remove("hidden");
  }

  function handleDecision2Choice(choice) {
    sfx.choice();
    els.decisionModal.classList.add("hidden");

    if (choice === 1) {
      // Used generator
      state.decisionsHistory.push({
        step: 2,
        title: "USE GENERATOR NOW",
        direct: "Current sector received temporary power injection.",
        ripple: "Strategic reserve completely depleted to 0%. Buffer lost."
      });

      els.stateGrid.textContent = "0% ZERO";
      els.stateGrid.className = "chip-state critical";
      els.reserveMeter.textContent = "DEPLETED (0%)";
      els.reserveMeter.style.color = "var(--c-red)";

      showConsequenceBanner(
        "BUFFER EXHAUSTED",
        "Short-term relief achieved. But Chennai now has ZERO margin for error."
      );
    } else {
      // Saved reserve
      state.decisionsHistory.push({
        step: 2,
        title: "SAVE THE RESERVE",
        direct: "Strategic reserve preserved for catastrophic surge.",
        ripple: "Managed brownouts endured; systemic integrity survived."
      });

      els.stateGrid.textContent = "45% READY";
      els.stateGrid.className = "chip-state stable";
      els.reserveMeter.textContent = "PRIMED (45%)";
      els.reserveMeter.style.color = "var(--c-green)";

      showConsequenceBanner(
        "RESERVE HELD SECURE",
        "Managed discomfort endured. The central strategic buffer remains intact."
      );
    }

    // Advance to Step 3
    state.storyStep = 3;
    state.phase = "EXPLORE_3";
    updateObjective("EMERGENCY CASCADE! Talk to Kavitha immediately for the final decision.");
  }

  // ==========================================================================
  // 10. DECISION 3: ACT IMMEDIATELY VS BALANCE SYSTEM
  // ==========================================================================
  function showDecision3() {
    state.phase = "DECISION";
    els.decisionTag.textContent = "FINAL CALL // 03";
    els.decisionPromptTitle.textContent = "A city-wide failure is now imminent.";
    els.decisionPromptSub.textContent = "Do you solve the visible problem — or balance the whole system?";

    // Option 1
    els.c1Icon.textContent = "⚡";
    els.c1Title.textContent = "ACT IMMEDIATELY";
    els.c1Stakes.innerHTML = `
      <span class="stake-line">Divert remaining energy to the single loudest crisis</span>
      <span class="stake-line">React directly to visible pressure</span>
    `;
    els.c1Downside.innerHTML = "<strong>Fatal Flaw:</strong> Ignored secondary consequences; triggers cascading grid destruction.";
    els.btnSelectChoice1.textContent = "ACT IMMEDIATELY [1]";

    // Option 2
    els.c2Icon.textContent = "⚖";
    els.c2Title.textContent = "BALANCE THE SYSTEM";
    els.c2Stakes.innerHTML = `
      <span class="stake-line">Evenly distribute rationed load across all three sectors</span>
      <span class="stake-line">Accept managed smaller losses to protect total city integrity</span>
    `;
    els.c2Downside.innerHTML = "<strong>The Kural Way:</strong> Foresight and equilibrium save the entire metropolitan grid.";
    els.btnSelectChoice2.textContent = "BALANCE THE SYSTEM [2]";

    els.decisionModal.classList.remove("hidden");
  }

  function handleDecision3Choice(choice) {
    sfx.choice();
    els.decisionModal.classList.add("hidden");

    if (choice === 1) {
      // Acted immediately
      state.decisionsHistory.push({
        step: 3,
        title: "ACT IMMEDIATELY",
        direct: "Single problem prioritized without systemic forethought.",
        ripple: "Cascading overload snapped remaining substations. Grid collapsed."
      });
      triggerClimax(false);
    } else {
      // Balanced the system
      state.decisionsHistory.push({
        step: 3,
        title: "BALANCE THE SYSTEM",
        direct: "Power rationed across Hospital, Metro, and Residential networks.",
        ripple: "Equilibrium restored. Chennai survived the cascading blackout."
      });
      triggerClimax(true);
    }
  }

  // ==========================================================================
  // 11. WORLD CONSEQUENCE BANNER & NOTIFICATION
  // ==========================================================================
  function showConsequenceBanner(title, body) {
    els.bannerTitle.textContent = title;
    els.bannerBody.textContent = body;
    els.consequenceBanner.classList.add("visible");

    setTimeout(() => {
      els.consequenceBanner.classList.remove("visible");
    }, 4000);
  }

  function updateObjective(text) {
    els.hudObjective.textContent = text;
  }

  // ==========================================================================
  // 12. CLIMAX & THIRUKKURAL 461 REVEAL SCREEN
  // ==========================================================================
  function triggerClimax(isSuccess) {
    state.phase = "CLIMAX";

    if (isSuccess) {
      sfx.triumph();
      // Animate world recovery
      els.cableGridMetro.setAttribute("class", "cable-path cable-active");
      els.cableGridHospital.setAttribute("class", "cable-path cable-active");
      els.cableMetroHospital.setAttribute("class", "cable-path cable-active");

      els.zoneHospital.classList.add("state-active");
      els.zoneMetro.classList.add("state-active");
      els.hospSignStatus.textContent = "SECURED ✓";
      els.metroSignStatus.textContent = "ONLINE ✓";
      els.gridSignStatus.textContent = "EQUILIBRIUM";

      showConsequenceBanner(
        "EQUILIBRIUM ESTABLISHED",
        "Power flowing in harmony. All three sectors stabilize."
      );
    } else {
      sfx.alarm();
      // Animate world collapse
      els.cableGridMetro.setAttribute("class", "cable-path cable-severed");
      els.cableGridHospital.setAttribute("class", "cable-path cable-severed");
      els.cableMetroHospital.setAttribute("class", "cable-path cable-severed");

      els.zoneHospital.classList.remove("state-active");
      els.zoneMetro.classList.remove("state-active");
      els.hospSignStatus.textContent = "COLLAPSED !";
      els.metroSignStatus.textContent = "STRANDED !";
      els.gridSignStatus.textContent = "TOTAL BLACKOUT";

      showConsequenceBanner(
        "CASCADING FAILURE",
        "The grid collapsed under unbalanced strain."
      );
    }

    setTimeout(() => {
      renderRevealScreen(isSuccess);
    }, 2800);
  }

  function renderRevealScreen(isSuccess) {
    state.phase = "REVEAL";
    els.revealOverlay.classList.remove("hidden");

    if (isSuccess) {
      els.outcomeBanner.className = "outcome-story-banner";
      els.verdictTitle.textContent = "THE CITY SURVIVED.";
      els.verdictDesc.textContent =
        "You didn't choose the fastest solution. You chose the solution whose consequences you understood.";
    } else {
      els.outcomeBanner.className = "outcome-story-banner failed";
      els.verdictTitle.textContent = "THE CITY PAID THE PRICE.";
      els.verdictDesc.textContent =
        "Each decision solved an immediate problem, but their consequences accumulated into catastrophe.";
    }

    // Populate timeline audit
    els.timelineSteps.innerHTML = "";
    state.decisionsHistory.forEach((item) => {
      const card = document.createElement("div");
      card.className = "timeline-card";
      card.innerHTML = `
        <span class="t-step">CHOICE 0${item.step}</span>
        <span class="t-choice">${item.title}</span>
        <p class="t-desc"><strong>Action:</strong> ${item.direct}</p>
        <p class="t-desc"><strong>Ripple:</strong> ${item.ripple}</p>
      `;
      els.timelineSteps.appendChild(card);
    });
  }

  // ==========================================================================
  // 13. RESET & RESTART
  // ==========================================================================
  function resetGame() {
    sfx.interact();

    state.phase = "INTRO";
    state.player.x = 470;
    state.player.y = 290;
    state.storyStep = 1;
    state.decisionsHistory = [];
    state.activeNpc = null;

    // Reset Player DOM
    els.player.style.left = `${state.player.x}px`;
    els.player.style.top = `${state.player.y}px`;

    // Reset World Zones
    els.zoneMetro.classList.remove("state-active");
    els.zoneHospital.classList.remove("state-active");
    els.hospBeacon.classList.remove("beacon-alert");

    els.metroSignStatus.textContent = "OFFLINE";
    els.metroSignStatus.style.backgroundColor = "";
    els.metroSignStatus.style.color = "";

    els.hospSignStatus.textContent = "ON BATTERY";
    els.hospSignStatus.style.backgroundColor = "";
    els.hospSignStatus.style.color = "";

    els.gridSignStatus.textContent = "CRITICAL LOAD";
    els.reserveMeter.textContent = "AUX-01 ONLINE";
    els.reserveMeter.style.color = "";

    els.stateHospital.textContent = "CRITICAL";
    els.stateHospital.className = "chip-state critical";
    els.stateMetro.textContent = "OFFLINE";
    els.stateMetro.className = "chip-state critical";
    els.stateGrid.textContent = "35%";
    els.stateGrid.className = "chip-state warning";

    els.cableGridMetro.setAttribute("class", "cable-path cable-strained");
    els.cableGridHospital.setAttribute("class", "cable-path cable-strained");
    els.cableMetroHospital.setAttribute("class", "cable-path cable-dormant");

    els.bubbleArun.classList.remove("visible");
    els.bubbleKavitha.classList.remove("visible");
    els.consequenceBanner.classList.remove("visible");
    els.dialogueContainer.classList.add("hidden");
    els.decisionModal.classList.add("hidden");
    els.revealOverlay.classList.add("hidden");

    els.introOverlay.classList.add("active");
  }

  // ==========================================================================
  // 14. EVENT LISTENERS & CONTROLS
  // ==========================================================================
  // Audio Toggle
  els.soundToggle.addEventListener("click", () => {
    state.audioEnabled = !state.audioEnabled;
    if (state.audioEnabled) {
      els.soundIcon.textContent = "🔊";
      els.soundText.textContent = "AUDIO";
      els.soundToggle.classList.remove("muted");
      initAudio();
      sfx.blip();
    } else {
      els.soundIcon.textContent = "🔇";
      els.soundText.textContent = "MUTED";
      els.soundToggle.classList.add("muted");
    }
  });

  // Intro Start Button
  els.btnStartStory.addEventListener("click", startExplorePhase);

  // Dialogue Advance
  els.btnAdvanceDialogue.addEventListener("click", advanceDialogue);
  els.dialogueContainer.addEventListener("click", advanceDialogue);

  // Decision Choice Buttons
  els.btnSelectChoice1.addEventListener("click", () => {
    if (state.storyStep === 1) handleDecision1Choice(1);
    else if (state.storyStep === 2) handleDecision2Choice(1);
    else if (state.storyStep === 3) handleDecision3Choice(1);
  });

  els.btnSelectChoice2.addEventListener("click", () => {
    if (state.storyStep === 1) handleDecision1Choice(2);
    else if (state.storyStep === 2) handleDecision2Choice(2);
    else if (state.storyStep === 3) handleDecision3Choice(2);
  });

  // Play Again Button
  els.btnPlayAgain.addEventListener("click", resetGame);

  // Keyboard Navigation
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();

    // Movement keys
    if (k === "w" || k === "arrowup") state.keys.up = true;
    if (k === "s" || k === "arrowdown") state.keys.down = true;
    if (k === "a" || k === "arrowleft") state.keys.left = true;
    if (k === "d" || k === "arrowright") state.keys.right = true;

    // Interact [E]
    if (k === "e") triggerInteraction();

    // Advance dialogue [Space or Enter]
    if (e.key === " " || k === "enter") {
      if (state.phase === "DIALOGUE") {
        e.preventDefault();
        advanceDialogue();
      } else if (state.phase === "INTRO" && els.btnStartStory.classList.contains("show")) {
        startExplorePhase();
      }
    }

    // Choice shortcuts [1] and [2]
    if (!els.decisionModal.classList.contains("hidden")) {
      if (k === "1") els.btnSelectChoice1.click();
      if (k === "2") els.btnSelectChoice2.click();
    }
  });

  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (k === "w" || k === "arrowup") state.keys.up = false;
    if (k === "s" || k === "arrowdown") state.keys.down = false;
    if (k === "a" || k === "arrowleft") state.keys.left = false;
    if (k === "d" || k === "arrowright") state.keys.right = false;
  });

  // Mobile D-Pad Virtual Buttons
  const setupDpadButton = (btn, dir) => {
    const press = (e) => {
      e.preventDefault();
      state.keys[dir] = true;
    };
    const release = (e) => {
      e.preventDefault();
      state.keys[dir] = false;
    };
    btn.addEventListener("touchstart", press, { passive: false });
    btn.addEventListener("touchend", release, { passive: false });
    btn.addEventListener("mousedown", press);
    btn.addEventListener("mouseup", release);
    btn.addEventListener("mouseleave", release);
  };

  setupDpadButton(els.dpadUp, "up");
  setupDpadButton(els.dpadDown, "down");
  setupDpadButton(els.dpadLeft, "left");
  setupDpadButton(els.dpadRight, "right");

  els.mobileInteractBtn.addEventListener("click", triggerInteraction);
  els.mobileInteractBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    triggerInteraction();
  }, { passive: false });

  // Start Intro Sequence & Game Loop
  runIntroSequence();
  requestAnimationFrame(gameLoop);
});
