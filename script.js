/**
 * THE LAST DECISION — CHENNAI 2047 // THIRUKKURAL 461
 * An interactive story & playable browser game exploring ancient wisdom.
 * Vanilla JavaScript • Zero dependencies.
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // ==========================================================================
  // 1. CENTRAL GAME STATE
  // ==========================================================================
  const gameState = {
    scene: "INTRO", // INTRO, CITY, DIALOGUE, DEVICE, EXPLORE, ALLOCATION, ENDING
    player: {
      x: 460,
      y: 270,
      speed: 4.2,
      isMoving: false
    },
    keys: {
      up: false,
      down: false,
      left: false,
      right: false
    },
    bounds: {
      minX: 50,
      maxX: 950,
      minY: 170,
      maxY: 460
    },
    activeInteractable: null,
    firstChoice: null, // "HOSPITAL" or "METRO"
    blackoutTriggered: false,
    dialogueCount: 0,
    visited: {
      teaShop: false,
      student: false,
      hospital: false,
      powerStation: false
    },
    finalAllocation: {
      hospital: 35,
      grid: 35,
      metro: 30
    },
    ending: null, // "SAVIOR", "SURVIVOR", "THINKER"
    audioEnabled: true,
    audioCtx: null,

    // Dialogue playback
    dialogueQueue: [],
    dialogueIndex: 0,
    isTyping: false,
    typewriterTimer: null,
    onDialogueEnd: null
  };

  // ==========================================================================
  // 2. PROCEDURAL SOUND SYNTHESIZER (Web Audio API, Zero External Assets)
  // ==========================================================================
  function initAudio() {
    if (!gameState.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        gameState.audioCtx = new AudioCtxClass();
      }
    }
    if (gameState.audioCtx && gameState.audioCtx.state === "suspended") {
      gameState.audioCtx.resume();
    }
  }

  function playTone(freq, type = "sine", duration = 0.08, vol = 0.05) {
    if (!gameState.audioEnabled) return;
    try {
      initAudio();
      if (!gameState.audioCtx) return;

      const osc = gameState.audioCtx.createOscillator();
      const gain = gameState.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, gameState.audioCtx.currentTime);

      gain.gain.setValueAtTime(vol, gameState.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, gameState.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(gameState.audioCtx.destination);

      osc.start();
      osc.stop(gameState.audioCtx.currentTime + duration);
    } catch {
      // Audio fallback without interrupting game
    }
  }

  const sfx = {
    step: () => playTone(140, "sine", 0.04, 0.02),
    blip: () => playTone(780, "triangle", 0.03, 0.025),
    interact: () => {
      playTone(520, "sine", 0.08, 0.05);
      setTimeout(() => playTone(780, "sine", 0.1, 0.05), 60);
    },
    blackout: () => {
      playTone(180, "sawtooth", 0.35, 0.08);
      setTimeout(() => playTone(90, "sawtooth", 0.5, 0.1), 120);
    },
    choice: () => {
      playTone(440, "triangle", 0.12, 0.06);
      setTimeout(() => playTone(660, "triangle", 0.16, 0.06), 80);
    },
    success: () => {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        setTimeout(() => playTone(freq, "sine", 0.22, 0.06), idx * 110);
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

    // Scenes
    sceneIntro: document.getElementById("sceneIntro"),
    sceneCity: document.getElementById("sceneCity"),
    sceneEnding: document.getElementById("sceneEnding"),

    // Intro
    btnStartGame: document.getElementById("btnStartGame"),

    // City Elements
    objectivePill: document.getElementById("objectivePill"),
    objectiveText: document.getElementById("objectiveText"),
    playerActor: document.getElementById("playerActor"),
    contextBubble: document.getElementById("contextBubble"),
    contextLabel: document.getElementById("contextLabel"),
    worldBanner: document.getElementById("worldBanner"),
    bannerIcon: document.getElementById("bannerIcon"),
    bannerText: document.getElementById("bannerText"),
    fallenDevice: document.getElementById("fallenDevice"),

    // Buildings & Signals
    metroStatusPill: document.getElementById("metroStatusPill"),
    hospStatusPill: document.getElementById("hospStatusPill"),
    powerStatusPill: document.getElementById("powerStatusPill"),
    hospCross: document.getElementById("hospCross"),
    hw1: document.getElementById("hw1"),
    hw2: document.getElementById("hw2"),
    hw3: document.getElementById("hw3"),
    metroGateLight: document.getElementById("metroGateLight"),

    // Lamps
    pool1: document.getElementById("pool1"),
    pool2: document.getElementById("pool2"),
    pool3: document.getElementById("pool3"),
    pool4: document.getElementById("pool4"),

    // Cables
    cableSubToMetro: document.getElementById("cableSubToMetro"),
    cableSubToHosp: document.getElementById("cableSubToHosp"),
    cableSubToTea: document.getElementById("cableSubToTea"),

    // Dialogue Tray
    dialogueTray: document.getElementById("dialogueTray"),
    dialogueAvatar: document.getElementById("dialogueAvatar"),
    dialogueName: document.getElementById("dialogueName"),
    dialogueTitle: document.getElementById("dialogueTitle"),
    dialogueContent: document.getElementById("dialogueContent"),
    btnDialogueNext: document.getElementById("btnDialogueNext"),

    // Device Minigame Modal (Scene 2)
    modalDevice: document.getElementById("modalDevice"),
    btnChooseHosp: document.getElementById("btnChooseHosp"),
    btnChooseMetro: document.getElementById("btnChooseMetro"),

    // Final Allocation Modal (Scene 5)
    modalAllocation: document.getElementById("modalAllocation"),
    allocTotalDisplay: document.getElementById("allocTotalDisplay"),
    segHosp: document.getElementById("segHosp"),
    segGrid: document.getElementById("segGrid"),
    segMetro: document.getElementById("segMetro"),
    sliderHosp: document.getElementById("sliderHosp"),
    sliderGrid: document.getElementById("sliderGrid"),
    sliderMetro: document.getElementById("sliderMetro"),
    valHospDisplay: document.getElementById("valHospDisplay"),
    valGridDisplay: document.getElementById("valGridDisplay"),
    valMetroDisplay: document.getElementById("valMetroDisplay"),
    noteHosp: document.getElementById("noteHosp"),
    noteGrid: document.getElementById("noteGrid"),
    noteMetro: document.getElementById("noteMetro"),
    btnCommitAllocation: document.getElementById("btnCommitAllocation"),

    // Ending Scene & Kural
    verdictBanner: document.getElementById("verdictBanner"),
    verdictCategory: document.getElementById("verdictCategory"),
    verdictHeadline: document.getElementById("verdictHeadline"),
    verdictNarr1: document.getElementById("verdictNarr1"),
    verdictNarr2: document.getElementById("verdictNarr2"),
    verdictHighlight: document.getElementById("verdictHighlight"),
    recapGrid: document.getElementById("recapGrid"),

    kLine1: document.getElementById("kLine1"),
    kLine2: document.getElementById("kLine2"),
    kLine3: document.getElementById("kLine3"),
    kLine4: document.getElementById("kLine4"),
    btnReplay: document.getElementById("btnReplay"),

    // Mobile D-Pad
    dpadUp: document.getElementById("dpadUp"),
    dpadDown: document.getElementById("dpadDown"),
    dpadLeft: document.getElementById("dpadLeft"),
    dpadRight: document.getElementById("dpadRight"),
    mobileInteractBtn: document.getElementById("mobileInteractBtn")
  };

  // ==========================================================================
  // 4. SCENE SWITCHING
  // ==========================================================================
  function switchScene(sceneName) {
    gameState.scene = sceneName;

    els.sceneIntro.classList.remove("active");
    els.sceneCity.classList.remove("active");
    els.sceneEnding.classList.remove("active");

    if (sceneName === "INTRO") {
      els.sceneIntro.classList.add("active");
    } else if (sceneName === "ENDING") {
      els.sceneEnding.classList.add("active");
    } else {
      els.sceneCity.classList.add("active");
    }
  }

  // ==========================================================================
  // 5. PLAYER MOVEMENT & GAME LOOP
  // ==========================================================================
  let lastFootstep = 0;

  function updatePlayerMovement() {
    if (
      gameState.scene === "INTRO" ||
      gameState.scene === "DIALOGUE" ||
      gameState.scene === "DEVICE" ||
      gameState.scene === "ALLOCATION" ||
      gameState.scene === "ENDING"
    ) {
      return;
    }

    let dx = 0;
    let dy = 0;

    if (gameState.keys.up) dy -= 1;
    if (gameState.keys.down) dy += 1;
    if (gameState.keys.left) dx -= 1;
    if (gameState.keys.right) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    if (dx !== 0 || dy !== 0) {
      gameState.player.x += dx * gameState.player.speed;
      gameState.player.y += dy * gameState.player.speed;

      // Keep within walkable road bounds
      gameState.player.x = Math.max(gameState.bounds.minX, Math.min(gameState.bounds.maxX, gameState.player.x));
      gameState.player.y = Math.max(gameState.bounds.minY, Math.min(gameState.bounds.maxY, gameState.player.y));

      els.playerActor.style.left = `${gameState.player.x}px`;
      els.playerActor.style.top = `${gameState.player.y}px`;

      const now = performance.now();
      if (now - lastFootstep > 280) {
        sfx.step();
        lastFootstep = now;
      }
    }

    checkInteractiveProximity();
  }

  function gameLoop() {
    updatePlayerMovement();
    requestAnimationFrame(gameLoop);
  }

  // ==========================================================================
  // 6. PROXIMITY DETECTION & CONTEXT BUBBLE
  // ==========================================================================
  const interactables = [
    { id: "teaOwner", x: 330, y: 215, label: "TALK", radius: 75 },
    { id: "student", x: 170, y: 225, label: "TALK", radius: 75 },
    { id: "doctor", x: 770, y: 225, label: "TALK", radius: 80 },
    { id: "engineer", x: 550, y: 410, label: "TALK", radius: 80 },
    { id: "device", x: 460, y: 310, label: "INVESTIGATE", radius: 65 }
  ];

  function checkInteractiveProximity() {
    const px = gameState.player.x;
    const py = gameState.player.y;

    let nearest = null;
    let minD = Infinity;

    for (const item of interactables) {
      if (item.id === "device" && !gameState.blackoutTriggered) continue;

      const d = Math.hypot(px - item.x, py - item.y);
      if (d < item.radius && d < minD) {
        minD = d;
        nearest = item;
      }
    }

    if (nearest) {
      gameState.activeInteractable = nearest.id;
      els.contextLabel.textContent = nearest.label;
      els.contextBubble.style.left = `${nearest.x}px`;
      els.contextBubble.style.top = `${nearest.y - 10}px`;
      els.contextBubble.classList.remove("hidden");
    } else {
      gameState.activeInteractable = null;
      els.contextBubble.classList.add("hidden");
    }
  }

  function handleInteraction() {
    if (gameState.scene === "DIALOGUE") {
      advanceDialogue();
      return;
    }

    if (!gameState.activeInteractable) return;

    sfx.interact();
    const id = gameState.activeInteractable;

    // SCENE 1: BEFORE BLACKOUT
    if (!gameState.blackoutTriggered) {
      if (id === "teaOwner") {
        gameState.visited.teaShop = true;
        gameState.dialogueCount++;
        startDialogue("☕", "MUTHU", "TEA SHOP OWNER", [
          "Power cut again?",
          "Third time tonight.",
          "City says emergency power will only last until midnight."
        ], () => checkTriggerBlackout());
      } else if (id === "student") {
        gameState.visited.student = true;
        gameState.dialogueCount++;
        startDialogue("🎒", "KARTHIK", "COLLEGE STUDENT", [
          "Anna! The metro stopped twice on the bridge earlier.",
          "Thousands of people are stuck waiting at Central station."
        ], () => checkTriggerBlackout());
      } else if (id === "doctor") {
        gameState.visited.hospital = true;
        gameState.dialogueCount++;
        startDialogue("🩺", "DR. PRIYA", "ICU PHYSICIAN", [
          "Emergency power is running low.",
          "Our surgical suites are drawing maximum juice from local batteries."
        ], () => checkTriggerBlackout());
      } else if (id === "engineer") {
        gameState.visited.powerStation = true;
        startDialogue("⚡", "KAVITHA", "GRID CHIEF", [
          "Load frequency is fluctuating dangerously across the corridor.",
          "If one more substation trips, we lose automated balancing."
        ], () => checkTriggerBlackout());
      }
      return;
    }

    // SCENE 2: STRANGE FALLEN DEVICE INTERACTION
    if (id === "device") {
      if (!gameState.firstChoice) {
        // Open Device Minigame
        openDeviceModal();
      } else {
        // Check if explored enough to open final allocation
        openFinalAllocationModal();
      }
      return;
    }

    // SCENE 3 & 4: EXPLORATION & DISCOVERING THE TRUTH (WORLD MEMORY)
    if (id === "doctor") {
      gameState.visited.hospital = true;
      if (gameState.firstChoice === "HOSPITAL") {
        startDialogue("🩺", "DR. PRIYA", "ICU PHYSICIAN", [
          "Thank god... the surgical monitors stayed online.",
          "Listen to me carefully: We don't need the whole grid.",
          "We only need enough power for critical care—around 30 to 35 units is sufficient!"
        ], () => checkExplorationProgress());
      } else {
        startDialogue("🩺", "DR. PRIYA", "ICU PHYSICIAN", [
          "We're on battery reserves! 14 minutes left!",
          "If you ever re-route the feeder: We don't need the whole grid.",
          "We only need enough power for critical care—around 30 to 35 units!"
        ], () => checkExplorationProgress());
      }
    } else if (id === "student") {
      gameState.visited.metro = true;
      if (gameState.firstChoice === "METRO") {
        startDialogue("🎒", "KARTHIK", "COLLEGE STUDENT", [
          "Anna! The trains are moving! We can get home!",
          "The operator announced over the intercom:",
          "They can run reduced service with just 30 units of power to keep air flowing!"
        ], () => checkExplorationProgress());
      } else {
        startDialogue("🎒", "KARTHIK", "COLLEGE STUDENT", [
          "The trains are still dead... we're stuck here in the tunnel fumes.",
          "The transit technician said we don't need full speed—",
          "The metro can run safe reduced service with just 30 units!"
        ], () => checkExplorationProgress());
      }
    } else if (id === "engineer") {
      gameState.visited.powerStation = true;
      startDialogue("⚡", "KAVITHA", "GRID CHIEF", [
        "Coordinator, look at the telemetry telemetry board.",
        "The grid isn't failing on its own.",
        "The problem is the allocation.",
        "Every time you redirect power... another sector loses its reserve.",
        "The central grid requires at least 35 units of reserve buffer, or the entire city drops together!"
      ], () => checkExplorationProgress());
    } else if (id === "teaOwner") {
      gameState.visited.teaShop = true;
      if (gameState.firstChoice === "HOSPITAL") {
        startDialogue("☕", "MUTHU", "TEA SHOP OWNER", [
          "You helped the hospital...",
          "But the metro... hundreds of people are locked outside the gate.",
          "Every action takes something away, doesn't it?"
        ]);
      } else {
        startDialogue("☕", "MUTHU", "TEA SHOP OWNER", [
          "The commuters made it through...",
          "But look at the hospital across the street—emergency beacons are flashing red.",
          "One problem fixed, another problem born."
        ]);
      }
    }
  }

  // ==========================================================================
  // 7. DIALOGUE SYSTEM (Typewriter & Fast Skip)
  // ==========================================================================
  function startDialogue(avatar, name, title, lines, onEnd = null) {
    gameState.scene = "DIALOGUE";
    gameState.dialogueQueue = lines;
    gameState.dialogueIndex = 0;
    gameState.onDialogueEnd = onEnd;

    els.dialogueAvatar.textContent = avatar;
    els.dialogueName.textContent = name;
    els.dialogueTitle.textContent = title;

    els.dialogueTray.classList.remove("hidden");
    typeCurrentLine();
  }

  function typeCurrentLine() {
    if (gameState.typewriterTimer) clearInterval(gameState.typewriterTimer);

    const text = gameState.dialogueQueue[gameState.dialogueIndex];
    els.dialogueContent.textContent = "";
    gameState.isTyping = true;

    let i = 0;
    gameState.typewriterTimer = setInterval(() => {
      if (i < text.length) {
        els.dialogueContent.textContent += text[i];
        if (i % 3 === 0) sfx.blip();
        i++;
      } else {
        clearInterval(gameState.typewriterTimer);
        gameState.isTyping = false;
      }
    }, 16);
  }

  function advanceDialogue() {
    if (gameState.isTyping) {
      // Instant skip
      clearInterval(gameState.typewriterTimer);
      els.dialogueContent.textContent = gameState.dialogueQueue[gameState.dialogueIndex];
      gameState.isTyping = false;
      return;
    }

    sfx.blip();
    gameState.dialogueIndex++;

    if (gameState.dialogueIndex < gameState.dialogueQueue.length) {
      typeCurrentLine();
    } else {
      // Finish dialogue
      els.dialogueTray.classList.add("hidden");
      gameState.scene = "CITY";
      if (gameState.onDialogueEnd) {
        const cb = gameState.onDialogueEnd;
        gameState.onDialogueEnd = null;
        cb();
      }
    }
  }

  // ==========================================================================
  // 8. THE BLACKOUT EVENT
  // ==========================================================================
  function checkTriggerBlackout() {
    if (gameState.blackoutTriggered) return;

    if (gameState.dialogueCount >= 2) {
      triggerBlackout();
    }
  }

  function triggerBlackout() {
    gameState.blackoutTriggered = true;
    sfx.blackout();

    // Flickering street effect
    [els.pool1, els.pool2, els.pool3, els.pool4].forEach((pool) => pool.classList.add("darkened"));

    // Metro stops
    els.metroStatusPill.textContent = "HALTED !";
    els.metroStatusPill.style.backgroundColor = "var(--c-red-tint)";
    els.metroStatusPill.style.color = "var(--c-red)";
    els.metroGateLight.style.backgroundColor = "var(--c-red)";

    // Hospital alarms
    els.hospStatusPill.textContent = "BATTERY 14m";
    els.hospStatusPill.style.backgroundColor = "var(--c-red-tint)";
    els.hospStatusPill.style.color = "var(--c-red)";
    els.hospCross.classList.add("beacon-flashing");

    // Cables turn strained
    els.cableSubToMetro.setAttribute("class", "cable-line cable-dead");
    els.cableSubToHosp.setAttribute("class", "cable-line cable-dead");

    // Reveal the fallen mysterious device
    els.fallenDevice.classList.remove("hidden");

    showWorldBanner("⚠ SUDDEN POWER CASCADE", "Central feeder tripped! A glowing node crashed onto the road.");
    updateObjective("A strange device crashed in the middle of the street. Investigate it.");
  }

  function showWorldBanner(title, text) {
    els.bannerIcon.textContent = "⚡";
    els.bannerText.innerHTML = `<strong>${title}:</strong> ${text}`;
    els.worldBanner.classList.remove("hidden");

    setTimeout(() => {
      els.worldBanner.classList.add("hidden");
    }, 4500);
  }

  function updateObjective(text) {
    els.objectiveText.textContent = text;
  }

  // ==========================================================================
  // 9. SCENE 2: STRANGE DEVICE MINIGAME
  // ==========================================================================
  function openDeviceModal() {
    gameState.scene = "DEVICE";
    sfx.interact();
    els.modalDevice.classList.remove("hidden");
  }

  function selectFirstChoice(choice) {
    sfx.choice();
    gameState.firstChoice = choice;
    els.modalDevice.classList.add("hidden");
    gameState.scene = "CITY";

    if (choice === "HOSPITAL") {
      // Hospital gets power
      els.hospStatusPill.textContent = "STABLE ✓";
      els.hospStatusPill.style.backgroundColor = "var(--c-green-tint)";
      els.hospStatusPill.style.color = "var(--c-green)";
      els.hospCross.classList.remove("beacon-flashing");
      [els.hw1, els.hw2, els.hw3].forEach((w) => w.classList.remove("dark"));

      // Metro stays dark
      els.metroStatusPill.textContent = "DARK / STRANDED";
      els.cableSubToHosp.setAttribute("class", "cable-line cable-powered");
      els.cableSubToMetro.setAttribute("class", "cable-line cable-dead");

      showWorldBanner(
        "HOSPITAL POWERED",
        "Hospital emergency systems stay online. But the metro network begins losing power."
      );
    } else {
      // Metro gets power
      els.metroStatusPill.textContent = "ACTIVE ✓";
      els.metroStatusPill.style.backgroundColor = "var(--c-green-tint)";
      els.metroStatusPill.style.color = "var(--c-green)";
      els.metroGateLight.style.backgroundColor = "var(--c-cyan)";

      // Hospital critical
      els.hospStatusPill.textContent = "BATTERY CRITICAL";
      [els.hw1, els.hw2].forEach((w) => w.classList.add("dark"));

      els.cableSubToMetro.setAttribute("class", "cable-line cable-powered");
      els.cableSubToHosp.setAttribute("class", "cable-line cable-dead");

      showWorldBanner(
        "METRO POWERED",
        "Commuters safely evacuated. But hospital trauma units switch to 14-minute emergency battery."
      );
    }

    updateObjective("Find out why the city's reserve is failing. Visit the Hospital, Metro, and Power Station.");
  }

  // ==========================================================================
  // 10. SCENE 3 & 4: DISCOVERING THE TRUTH
  // ==========================================================================
  function checkExplorationProgress() {
    const visitedCount =
      (gameState.visited.hospital ? 1 : 0) +
      (gameState.visited.metro ? 1 : 0) +
      (gameState.visited.powerStation ? 1 : 0);

    if (visitedCount >= 3) {
      updateObjective("You have gathered all sector telemetry. Return to City Node 07 for the Final Decision!");
      showWorldBanner("SYSTEM PATTERN DISCOVERED", "You now understand how every sector interconnects.");
    } else {
      updateObjective(`Investigate remaining sectors (${visitedCount}/3 discovered).`);
    }
  }

  // ==========================================================================
  // 11. SCENE 5: THE LAST DECISION — ENERGY ALLOCATION
  // ==========================================================================
  function openFinalAllocationModal() {
    gameState.scene = "ALLOCATION";
    sfx.interact();
    syncAllocationUI();
    els.modalAllocation.classList.remove("hidden");
  }

  function handleSliderChange(changedSector) {
    let h = parseInt(els.sliderHosp.value, 10);
    let g = parseInt(els.sliderGrid.value, 10);
    let m = parseInt(els.sliderMetro.value, 10);

    let total = h + g + m;

    // Rebalance dynamically so total stays exactly 100
    if (total !== 100) {
      const diff = 100 - total;
      if (changedSector === "hosp") {
        g = Math.max(10, Math.min(70, g + Math.round(diff / 2)));
        m = Math.max(10, Math.min(70, 100 - h - g));
      } else if (changedSector === "grid") {
        h = Math.max(10, Math.min(70, h + Math.round(diff / 2)));
        m = Math.max(10, Math.min(70, 100 - h - g));
      } else {
        h = Math.max(10, Math.min(70, h + Math.round(diff / 2)));
        g = Math.max(10, Math.min(70, 100 - h - m));
      }
    }

    els.sliderHosp.value = h;
    els.sliderGrid.value = g;
    els.sliderMetro.value = m;

    gameState.finalAllocation.hospital = h;
    gameState.finalAllocation.grid = g;
    gameState.finalAllocation.metro = m;

    syncAllocationUI();
  }

  function syncAllocationUI() {
    const h = gameState.finalAllocation.hospital;
    const g = gameState.finalAllocation.grid;
    const m = gameState.finalAllocation.metro;

    els.valHospDisplay.textContent = `${h}%`;
    els.valGridDisplay.textContent = `${g}%`;
    els.valMetroDisplay.textContent = `${m}%`;

    els.segHosp.style.width = `${h}%`;
    els.segGrid.style.width = `${g}%`;
    els.segMetro.style.width = `${m}%`;

    els.allocTotalDisplay.textContent = `${h + g + m} / 100 UNITS`;

    // Real-time environmental feedback notes
    if (h < 25) {
      els.noteHosp.innerHTML = "<strong style='color:var(--c-red)'>CRITICAL FAILURE:</strong> Ventilators trip. Patients perish.";
    } else if (h <= 40) {
      els.noteHosp.innerHTML = "<span style='color:var(--c-green)'>OPTIMAL:</span> ICU & surgical life-support sustained.";
    } else {
      els.noteHosp.innerHTML = "<span style='color:var(--c-yellow)'>EXCESS DRAW:</span> Wastes energy on non-vital air conditioning.";
    }

    if (g < 25) {
      els.noteGrid.innerHTML = "<strong style='color:var(--c-red)'>NO BUFFER:</strong> Grid collapses instantly upon secondary shock.";
    } else if (g <= 45) {
      els.noteGrid.innerHTML = "<span style='color:var(--c-green)'>BALANCED:</span> Adequate buffer prevents cascading metropolitan trip.";
    } else {
      els.noteGrid.innerHTML = "<span style='color:var(--c-yellow)'>HOARDING:</span> Power sitting idle while civic sectors strain.";
    }

    if (m < 25) {
      els.noteMetro.innerHTML = "<strong style='color:var(--c-red)'>HALTED:</strong> Thousands stranded in underground dark.";
    } else if (m <= 35) {
      els.noteMetro.innerHTML = "<span style='color:var(--c-green)'>REDUCED SERVICE:</span> Safe evacuation transit maintained.";
    } else {
      els.noteMetro.innerHTML = "<span style='color:var(--c-yellow)'>HIGH SPEED:</span> High traction current drains the central grid.";
    }
  }

  function commitFinalAllocation() {
    sfx.choice();
    els.modalAllocation.classList.add("hidden");

    const h = gameState.finalAllocation.hospital;
    const g = gameState.finalAllocation.grid;
    const m = gameState.finalAllocation.metro;

    const visitedAll =
      gameState.visited.hospital && gameState.visited.metro && gameState.visited.powerStation;

    // EVALUATE ENDING:
    // Ending 1: THE SAVIOR (One sector heavily over-allocated > 50% or another starved < 20%)
    // Ending 2: THE SURVIVOR (Balanced numbers, but player did NOT explore the 3 locations)
    // Ending 3: THE THINKER (Explored all locations AND balanced between: Hosp 25-40, Grid 25-45, Metro 25-35)
    if (h > 50 || g > 50 || m > 50 || h < 20 || g < 20 || m < 20) {
      gameState.ending = "SAVIOR";
    } else if (!visitedAll) {
      gameState.ending = "SURVIVOR";
    } else {
      gameState.ending = "THINKER";
    }

    triggerEndingSequence();
  }

  // ==========================================================================
  // 12. ENDINGS & THIRUKKURAL 461 REVEAL
  // ==========================================================================
  function triggerEndingSequence() {
    switchScene("ENDING");

    if (gameState.ending === "THINKER") {
      sfx.success();
      els.verdictBanner.className = "verdict-banner";
      els.verdictCategory.textContent = "ENDING: THE THINKER (OPTIMAL OUTCOME)";
      els.verdictHeadline.textContent = "THE CITY SURVIVED.";
      els.verdictNarr1.textContent = "You didn't choose what mattered most.";
      els.verdictNarr2.textContent = "You understood what each choice would cost.";
      els.verdictHighlight.textContent =
        "THE CITY SURVIVED BECAUSE YOU THOUGHT BEYOND THE FIRST MOVE.";
    } else if (gameState.ending === "SURVIVOR") {
      sfx.interact();
      els.verdictBanner.className = "verdict-banner survivor";
      els.verdictCategory.textContent = "ENDING: THE SURVIVOR";
      els.verdictHeadline.textContent = "THE CITY SURVIVED UNDER STRAIN.";
      els.verdictNarr1.textContent = "Nothing collapsed.";
      els.verdictNarr2.textContent = "But nothing was free.";
      els.verdictHighlight.textContent =
        "You balanced the meters by instinct, but missed key intelligence from the sectors.";
    } else {
      sfx.blackout();
      els.verdictBanner.className = "verdict-banner savior";
      els.verdictCategory.textContent = "ENDING: THE SAVIOR";
      els.verdictHeadline.textContent = "ONE SYSTEM SURVIVED.";
      els.verdictNarr1.textContent = "You saved one problem.";
      els.verdictNarr2.textContent = "You created another.";
      els.verdictHighlight.textContent =
        "Over-prioritizing the visible emergency caused a catastrophic failure elsewhere.";
    }

    // Populate Journey Recap
    els.recapGrid.innerHTML = `
      <div class="recap-card">
        <span class="r-step">STEP 1 // IMMEDIATE REACTION</span>
        <span class="r-choice">Chose: ${gameState.firstChoice}</span>
        <p class="r-desc">${
          gameState.firstChoice === "HOSPITAL"
            ? "Protected patients, but stranded thousands underground."
            : "Evacuated commuters, but hospital ICUs were put on emergency countdown."
        }</p>
      </div>
      <div class="recap-card">
        <span class="r-step">STEP 2 // EXPLORATION & CLUES</span>
        <span class="r-choice">Sectors Discovered: ${
          (gameState.visited.hospital ? 1 : 0) +
          (gameState.visited.metro ? 1 : 0) +
          (gameState.visited.powerStation ? 1 : 0)
        } / 3</span>
        <p class="r-desc">Hospital (35%), Metro (30%), Grid Buffer (35%).</p>
      </div>
      <div class="recap-card">
        <span class="r-step">STEP 3 // FINAL ALLOCATION</span>
        <span class="r-choice">H: ${gameState.finalAllocation.hospital}% | G: ${gameState.finalAllocation.grid}% | M: ${gameState.finalAllocation.metro}%</span>
        <p class="r-desc">Outcome: ${gameState.ending}</p>
      </div>
    `;

    // Line-by-line Kural Reveal
    setTimeout(() => els.kLine1.classList.add("revealed"), 400);
    setTimeout(() => els.kLine2.classList.add("revealed"), 1100);
    setTimeout(() => els.kLine3.classList.add("revealed"), 1800);
    setTimeout(() => els.kLine4.classList.add("revealed"), 2500);
  }

  // ==========================================================================
  // 13. RESET & REPLAY
  // ==========================================================================
  function resetGame() {
    sfx.interact();

    gameState.scene = "INTRO";
    gameState.player.x = 460;
    gameState.player.y = 270;
    gameState.firstChoice = null;
    gameState.blackoutTriggered = false;
    gameState.dialogueCount = 0;
    gameState.visited = { teaShop: false, student: false, hospital: false, powerStation: false };
    gameState.finalAllocation = { hospital: 35, grid: 35, metro: 30 };
    gameState.ending = null;

    // Reset Elements
    els.playerActor.style.left = `${gameState.player.x}px`;
    els.playerActor.style.top = `${gameState.player.y}px`;

    els.fallenDevice.classList.add("hidden");
    els.worldBanner.classList.add("hidden");
    els.dialogueTray.classList.add("hidden");
    els.modalDevice.classList.add("hidden");
    els.modalAllocation.classList.add("hidden");

    // Reset Street Lights & Signals
    [els.pool1, els.pool2, els.pool3, els.pool4].forEach((pool) => pool.classList.remove("darkened"));
    els.metroStatusPill.textContent = "ONLINE";
    els.metroStatusPill.style.backgroundColor = "";
    els.metroStatusPill.style.color = "";
    els.metroGateLight.style.backgroundColor = "var(--c-cyan)";

    els.hospStatusPill.textContent = "ONLINE";
    els.hospStatusPill.style.backgroundColor = "";
    els.hospStatusPill.style.color = "";
    els.hospCross.classList.remove("beacon-flashing");
    [els.hw1, els.hw2, els.hw3].forEach((w) => w.classList.remove("dark"));

    els.cableSubToMetro.setAttribute("class", "cable-line cable-live");
    els.cableSubToHosp.setAttribute("class", "cable-line cable-live");

    [els.kLine1, els.kLine2, els.kLine3, els.kLine4].forEach((k) => k.classList.remove("revealed"));

    updateObjective("Explore the street. Talk to the locals.");
    switchScene("INTRO");
  }

  // ==========================================================================
  // 14. EVENT LISTENERS & KEYBOARD / TOUCH CONTROLS
  // ==========================================================================
  // Sound Toggle
  els.soundToggle.addEventListener("click", () => {
    gameState.audioEnabled = !gameState.audioEnabled;
    if (gameState.audioEnabled) {
      els.soundIcon.textContent = "🔊";
      els.soundText.textContent = "AUDIO ON";
      els.soundToggle.classList.remove("muted");
      initAudio();
      sfx.blip();
    } else {
      els.soundIcon.textContent = "🔇";
      els.soundText.textContent = "AUDIO OFF";
      els.soundToggle.classList.add("muted");
    }
  });

  // Intro Button
  els.btnStartGame.addEventListener("click", () => {
    initAudio();
    sfx.interact();
    switchScene("CITY");
  });

  // Dialogue Controls
  els.btnDialogueNext.addEventListener("click", advanceDialogue);
  els.dialogueTray.addEventListener("click", advanceDialogue);

  // Device Modal Selection
  els.btnChooseHosp.addEventListener("click", () => selectFirstChoice("HOSPITAL"));
  els.btnChooseMetro.addEventListener("click", () => selectFirstChoice("METRO"));

  // Sliders
  els.sliderHosp.addEventListener("input", () => handleSliderChange("hosp"));
  els.sliderGrid.addEventListener("input", () => handleSliderChange("grid"));
  els.sliderMetro.addEventListener("input", () => handleSliderChange("metro"));

  // Final Commit
  els.btnCommitAllocation.addEventListener("click", commitFinalAllocation);

  // Replay
  els.btnReplay.addEventListener("click", resetGame);

  // Keyboard Movement & Actions
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();

    if (k === "w" || k === "arrowup") gameState.keys.up = true;
    if (k === "s" || k === "arrowdown") gameState.keys.down = true;
    if (k === "a" || k === "arrowleft") gameState.keys.left = true;
    if (k === "d" || k === "arrowright") gameState.keys.right = true;

    if (k === "e") handleInteraction();

    if (e.key === " " || k === "enter") {
      if (gameState.scene === "DIALOGUE") {
        e.preventDefault();
        advanceDialogue();
      } else if (gameState.scene === "INTRO") {
        els.btnStartGame.click();
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (k === "w" || k === "arrowup") gameState.keys.up = false;
    if (k === "s" || k === "arrowdown") gameState.keys.down = false;
    if (k === "a" || k === "arrowleft") gameState.keys.left = false;
    if (k === "d" || k === "arrowright") gameState.keys.right = false;
  });

  // Mobile D-Pad Virtual Buttons
  const bindDpad = (btn, dir) => {
    const press = (e) => {
      e.preventDefault();
      gameState.keys[dir] = true;
    };
    const release = (e) => {
      e.preventDefault();
      gameState.keys[dir] = false;
    };
    btn.addEventListener("touchstart", press, { passive: false });
    btn.addEventListener("touchend", release, { passive: false });
    btn.addEventListener("mousedown", press);
    btn.addEventListener("mouseup", release);
    btn.addEventListener("mouseleave", release);
  };

  bindDpad(els.dpadUp, "up");
  bindDpad(els.dpadDown, "down");
  bindDpad(els.dpadLeft, "left");
  bindDpad(els.dpadRight, "right");

  els.mobileInteractBtn.addEventListener("click", handleInteraction);
  els.mobileInteractBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleInteraction();
  }, { passive: false });

  // Start Game Loop
  requestAnimationFrame(gameLoop);
});
