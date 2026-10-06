/**
 * THE LAST DECISION — CHENNAI 2047
 * THIRUKKURAL 461
 *
 * Interactive Tamil story game
 * Vanilla JavaScript — zero dependencies
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // ============================================================
  // 1. GAME STATE
  // ============================================================

  const GS = {
    scene: "INTRO",

    player: {
      x: 460,
      y: 265,
      speed: 4.4
    },

    scenic: {
      x: 0,
      y: 0,
      speed: 4.8
    },

    keys: {
      up: false,
      down: false,
      left: false,
      right: false
    },

    cityBounds: {
      minX: 52,
      maxX: 940,
      minY: 172,
      maxY: 450
    },

    scenicBounds: {
      minX: 45,
      maxX: 900,
      minY: 180,
      maxY: 430
    },

    blackout: false,
    firstChoice: null,

    talkCount: 0,

    visited: {
      muthu: false,
      karthik: false,
      priya: false,
      kavitha: false
    },

    post: {
      priya: false,
      karthik: false,
      kavitha: false
    },

    finalAlloc: {
      h: 35,
      g: 35,
      m: 30
    },

    ending: null,

    relics: {
      leaf: false,
      light: false,
      tree: false,
      horizon: false
    },

    activeNPC: null,
    activeRelic: null,

    // Dialogue
    dlgQueue: [],
    dlgIdx: 0,
    dlgTyping: false,
    dlgTimer: null,
    dlgOnEnd: null,
    dlgScene: "city",

    // Audio
    audioOn: true,
    ctx: null
  };


  // ============================================================
  // 2. AUDIO
  // ============================================================

  function initAudio() {
    if (!GS.ctx) {
      const AudioCtx =
        window.AudioContext ||
        window.webkitAudioContext;

      if (AudioCtx) {
        GS.ctx = new AudioCtx();
      }
    }

    if (
      GS.ctx &&
      GS.ctx.state === "suspended"
    ) {
      GS.ctx.resume();
    }
  }


  function tone(
    freq,
    type = "sine",
    dur = 0.09,
    vol = 0.05
  ) {
    if (!GS.audioOn) return;

    try {
      initAudio();

      if (!GS.ctx) return;

      const osc = GS.ctx.createOscillator();
      const gain = GS.ctx.createGain();

      osc.type = type;

      osc.frequency.setValueAtTime(
        freq,
        GS.ctx.currentTime
      );

      gain.gain.setValueAtTime(
        vol,
        GS.ctx.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        GS.ctx.currentTime + dur
      );

      osc.connect(gain);
      gain.connect(GS.ctx.destination);

      osc.start();
      osc.stop(
        GS.ctx.currentTime + dur
      );
    } catch (err) {
      // Audio is optional.
    }
  }


  const sfx = {

    step: () =>
      tone(140, "sine", 0.04, 0.018),

    blip: () =>
      tone(780, "triangle", 0.03, 0.022),

    interact: () => {
      tone(520, "sine", 0.08, 0.045);

      setTimeout(() => {
        tone(780, "sine", 0.1, 0.045);
      }, 60);
    },

    relic: () => {
      tone(587, "sine", 0.12, 0.06);

      setTimeout(() => {
        tone(880, "sine", 0.18, 0.07);
      }, 90);
    },

    blackout: () => {
      tone(180, "sawtooth", 0.35, 0.08);

      setTimeout(() => {
        tone(90, "sawtooth", 0.5, 0.1);
      }, 120);
    },

    choice: () => {
      tone(440, "triangle", 0.12, 0.06);

      setTimeout(() => {
        tone(660, "triangle", 0.16, 0.06);
      }, 80);
    },

    triumph: () => {
      [
        523.25,
        659.25,
        783.99,
        1046.5
      ].forEach((freq, index) => {
        setTimeout(() => {
          tone(freq, "sine", 0.25, 0.07);
        }, index * 110);
      })
    }
  };


  // ============================================================
  // 3. ELEMENT REFERENCES
  // ============================================================

  const $ = id =>
    document.getElementById(id);


  const el = {

    // Sound
    soundToggle: $("soundToggle"),
    soundIcon: $("soundIcon"),
    soundText: $("soundText"),

    // Scenes
    sceneIntro: $("sceneIntro"),
    sceneCity: $("sceneCity"),
    sceneEnding: $("sceneEnding"),

    // Intro
    btnStartGame: $("btnStartGame"),

    // City HUD
    objectiveText: $("objectiveText"),
    worldBanner: $("worldBanner"),
    bannerIcon: $("bannerIcon"),
    bannerText: $("bannerText"),

    // Player
    playerActor: $("playerActor"),

    // Context bubble
    contextBubble: $("contextBubble"),
    contextLabel: $("contextLabel"),

    // Buildings
    metroStatusPill: $("metroStatusPill"),
    hospStatusPill: $("hospStatusPill"),
    metroGateLight: $("metroGateLight"),
    hospCross: $("hospCross"),

    hw1: $("hw1"),
    hw2: $("hw2"),
    hw3: $("hw3"),

    // Cables
    cableSubToMetro: $("cableSubToMetro"),
    cableSubToHosp: $("cableSubToHosp"),

    // Pools
    pool1: $("pool1"),
    pool2: $("pool2"),
    pool3: $("pool3"),
    pool4: $("pool4"),

    // Fallen device
    fallenDevice: $("fallenDevice"),

    // Celebration
    celebRays: $("celebRays"),

    // City dialogue
    dialogueTray: $("dialogueTray"),
    dialogueAvatar: $("dialogueAvatar"),
    dialogueName: $("dialogueName"),
    dialogueTitle: $("dialogueTitle"),
    dialogueContent: $("dialogueContent"),
    btnDialogueNext: $("btnDialogueNext"),

    // Ending dialogue
    dialogueTrayShared: $("dialogueTrayShared"),
    dialogueAvatarS: $("dialogueAvatarS"),
    dialogueNameS: $("dialogueNameS"),
    dialogueTitleS: $("dialogueTitleS"),
    dialogueContentS: $("dialogueContentS"),
    btnDialogueNextS: $("btnDialogueNextS"),

    // Modals
    modalDevice: $("modalDevice"),
    btnChooseHosp: $("btnChooseHosp"),
    btnChooseMetro: $("btnChooseMetro"),

    modalAllocation: $("modalAllocation"),

    allocTotalDisplay:
      $("allocTotalDisplay"),

    segHosp: $("segHosp"),
    segGrid: $("segGrid"),
    segMetro: $("segMetro"),

    sliderHosp: $("sliderHosp"),
    sliderGrid: $("sliderGrid"),
    sliderMetro: $("sliderMetro"),

    valHospDisplay:
      $("valHospDisplay"),

    valGridDisplay:
      $("valGridDisplay"),

    valMetroDisplay:
      $("valMetroDisplay"),

    noteHosp: $("noteHosp"),
    noteGrid: $("noteGrid"),
    noteMetro: $("noteMetro"),

    btnCommitAllocation:
      $("btnCommitAllocation"),

    // Ending
    scenicPlayer: $("scenicPlayer"),
    cityPanorama: $("cityPanorama"),
    scenicGoal: $("scenicGoal"),

    relicBubble: $("relicBubble"),
    relicLabel: $("relicLabel"),

    relicLeaf: $("relicLeaf"),
    tagLeaf: $("tagLeaf"),

    relicLight: $("relicLight"),
    tagLight: $("tagLight"),

    relicTree: $("relicTree"),
    tagTree: $("tagTree"),

    relicHorizon: $("relicHorizon"),
    tagHorizon: $("tagHorizon"),

    kuralCelestial:
      $("kuralCelestial"),

    cWord1: $("cWord1"),
    cWord2: $("cWord2"),

    portalWalkCity:
      $("portalWalkCity"),

    portalReplayNode:
      $("portalReplayNode"),

    // Mobile city controls
    dpadUp: $("dpadUp"),
    dpadDown: $("dpadDown"),
    dpadLeft: $("dpadLeft"),
    dpadRight: $("dpadRight"),

    mobileInteractBtn:
      $("mobileInteractBtn"),

    // Mobile ending controls
    dpadUpE: $("dpadUpE"),
    dpadDownE: $("dpadDownE"),
    dpadLeftE: $("dpadLeftE"),
    dpadRightE: $("dpadRightE"),

    mobileInteractBtnE:
      $("mobileInteractBtnE")
  };


  // ============================================================
  // 4. SCENE SWITCHING
  // ============================================================

  function switchScene(name) {

    GS.scene = name;

    if (el.sceneIntro) {
      el.sceneIntro.classList.remove("active");
    }

    if (el.sceneCity) {
      el.sceneCity.classList.remove("active");
    }

    if (el.sceneEnding) {
      el.sceneEnding.classList.remove("active");
    }

    if (name === "INTRO") {

      el.sceneIntro?.classList.add("active");

    } else if (name === "OVERLOOK") {

      el.sceneEnding?.classList.add("active");

    } else {

      el.sceneCity?.classList.add("active");
    }
  }


  // ============================================================
  // 5. SCENIC COORDINATE SYSTEM
  // ============================================================

  /*
   * IMPORTANT:
   *
   * The old code used:
   *
   *   window.innerWidth
   *   window.innerHeight
   *
   * for relic positions.
   *
   * But the player is positioned inside #sceneEnding.
   *
   * If #sceneEnding is not exactly the viewport,
   * the player and relics end up using different
   * coordinate systems.
   *
   * We now use the actual ending scene dimensions.
   */


  function getEndingSize() {

    if (!el.sceneEnding) {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }

    return {
      width: el.sceneEnding.clientWidth,
      height: el.sceneEnding.clientHeight
    };
  }


  function updateScenicBounds() {

    const {
      width,
      height
    } = getEndingSize();

    /*
     * Keep the character away from the extreme edges.
     */

    GS.scenicBounds.minX = 45;

    GS.scenicBounds.maxX =
      Math.max(
        GS.scenicBounds.minX,
        width - 45
      );

    GS.scenicBounds.minY =
      Math.max(
        175,
        height * 0.28
      );

    GS.scenicBounds.maxY =
      Math.max(
        GS.scenicBounds.minY,
        height - 105
      );
  }


  // ============================================================
  // 6. MOVEMENT
  // ============================================================

  let lastStep = 0;
  let isMoving = false;


  function stopWalkingAnimation() {

    if (!isMoving) return;

    isMoving = false;

    el.playerActor?.classList.remove(
      "walking"
    );

    el.scenicPlayer?.classList.remove(
      "walking"
    );
  }


  function updateMovement() {

    const blockedScenes = [
      "INTRO",
      "DIALOGUE",
      "DEVICE",
      "ALLOCATION"
    ];

    if (
      blockedScenes.includes(
        GS.scene
      )
    ) {
      stopWalkingAnimation();
      return;
    }


    let dx = 0;
    let dy = 0;


    if (GS.keys.up) {
      dy -= 1;
    }

    if (GS.keys.down) {
      dy += 1;
    }

    if (GS.keys.left) {
      dx -= 1;
    }

    if (GS.keys.right) {
      dx += 1;
    }


    // Normalize diagonal movement.
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707106;
      dy *= 0.707106;
    }


    if (dx !== 0 || dy !== 0) {

      // --------------------------------------------------------
      // CITY
      // --------------------------------------------------------

      if (GS.scene === "CITY") {

        GS.player.x =
          Math.max(
            GS.cityBounds.minX,
            Math.min(
              GS.cityBounds.maxX,
              GS.player.x +
                dx * GS.player.speed
            )
          );

        GS.player.y =
          Math.max(
            GS.cityBounds.minY,
            Math.min(
              GS.cityBounds.maxY,
              GS.player.y +
                dy * GS.player.speed
            )
          );


        if (el.playerActor) {

          el.playerActor.style.left =
            `${GS.player.x}px`;

          el.playerActor.style.top =
            `${GS.player.y}px`;
        }
      }


      // --------------------------------------------------------
      // ENDING / OVERLOOK
      // --------------------------------------------------------

      else if (GS.scene === "OVERLOOK") {

        updateScenicBounds();


        GS.scenic.x =
          Math.max(
            GS.scenicBounds.minX,
            Math.min(
              GS.scenicBounds.maxX,
              GS.scenic.x +
                dx * GS.scenic.speed
            )
          );


        GS.scenic.y =
          Math.max(
            GS.scenicBounds.minY,
            Math.min(
              GS.scenicBounds.maxY,
              GS.scenic.y +
                dy * GS.scenic.speed
            )
          );


        if (el.scenicPlayer) {

          el.scenicPlayer.style.left =
            `${GS.scenic.x}px`;

          el.scenicPlayer.style.top =
            `${GS.scenic.y}px`;
        }
      }


      // Footstep sound.
      const now =
        performance.now();

      if (
        now - lastStep > 275
      ) {
        sfx.step();
        lastStep = now;
      }


      // Walking animation.
      if (!isMoving) {

        isMoving = true;

        if (
          GS.scene === "CITY"
        ) {

          el.playerActor?.classList.add(
            "walking"
          );

        } else if (
          GS.scene === "OVERLOOK"
        ) {

          el.scenicPlayer?.classList.add(
            "walking"
          );
        }
      }

    } else {

      stopWalkingAnimation();
    }


    // Proximity detection.
    if (GS.scene === "CITY") {

      checkCityProximity();

    } else if (
      GS.scene === "OVERLOOK"
    ) {

      checkScenicProximity();
    }
  }


  // ============================================================
  // 7. GAME LOOP
  // ============================================================

  function gameLoop() {

    updateMovement();

    requestAnimationFrame(
      gameLoop
    );
  }


  // ============================================================
  // 8. CITY NPCS
  // ============================================================

  const cityNPCs = [

    {
      id: "muthu",
      el: $("npcMuthu"),
      x: 326,
      y: 208,
      label: "TALK",
      r: 80
    },

    {
      id: "karthik",
      el: $("npcKarthik"),
      x: 168,
      y: 218,
      label: "TALK",
      r: 78
    },

    {
      id: "priya",
      el: $("npcPriya"),
      x: 758,
      y: 218,
      label: "TALK",
      r: 80
    },

    {
      id: "kavitha",
      el: $("npcKavitha"),
      x: 536,
      y: 385,
      label: "TALK",
      r: 78
    },

    {
      id: "device",
      el: $("fallenDevice"),
      x: 460,
      y: 310,
      label: "INVESTIGATE",
      r: 68
    }
  ];


  // ============================================================
  // 9. CITY PROXIMITY
  // ============================================================

  function checkCityProximity() {

    const px = GS.player.x;
    const py = GS.player.y;

    let nearest = null;
    let minD = Infinity;


    for (const n of cityNPCs) {

      // Device doesn't exist before blackout.
      if (
        n.id === "device" &&
        !GS.blackout
      ) {
        continue;
      }


      const d =
        Math.hypot(
          px - n.x,
          py - n.y
        );


      if (
        d < n.r &&
        d < minD
      ) {
        minD = d;
        nearest = n;
      }
    }


    if (nearest) {

      GS.activeNPC =
        nearest.id;

      if (el.contextLabel) {
        el.contextLabel.textContent =
          nearest.label;
      }


      if (el.contextBubble) {

        el.contextBubble.style.left =
          `${nearest.x}px`;

        el.contextBubble.style.top =
          `${nearest.y - 12}px`;

        el.contextBubble.classList.remove(
          "hidden"
        );
      }

    } else {

      GS.activeNPC = null;

      el.contextBubble?.classList.add(
        "hidden"
      );
    }
  }


  // ============================================================
  // 10. ENDING RELICS
  // ============================================================

  /*
   * These are percentages INSIDE #sceneEnding.
   *
   * The fourth relic is intentionally far right.
   * Holding D / RIGHT will reach it.
   */

  const scenicRelics = [

    {
      id: "leaf",
      x: 0.18,
      y: 0.45,
      label: "OBSERVE"
    },

    {
      id: "light",
      x: 0.36,
      y: 0.32,
      label: "OBSERVE"
    },

    {
      id: "tree",
      x: 0.60,
      y: 0.32,
      label: "OBSERVE"
    },

    {
      id: "horizon",
      x: 0.78,
      y: 0.45,
      label: "OBSERVE"
    }
  ];


  // ============================================================
  // 11. GET RELIC PIXEL POSITION
  // ============================================================

  function getRelicPx(relic) {

    const {
      width,
      height
    } = getEndingSize();


    return {

      x: relic.x * width,

      y: relic.y * height
    };
  }


  // ============================================================
  // 12. SCENIC PROXIMITY
  // ============================================================

  function checkScenicProximity() {

    const px = GS.scenic.x;
    const py = GS.scenic.y;

    let nearest = null;
    let minD = Infinity;


    for (const relic of scenicRelics) {

      /*
       * IMPORTANT:
       *
       * Already collected relics are ignored.
       */

      if (
        GS.relics[relic.id]
      ) {
        continue;
      }


      const pos =
        getRelicPx(relic);


      const d =
        Math.hypot(
          px - pos.x,
          py - pos.y
        );


      if (
        d < 105 &&
        d < minD
      ) {
        minD = d;
        nearest = relic;
      }
    }


    if (nearest) {

      GS.activeRelic =
        nearest.id;


      if (el.relicLabel) {
        el.relicLabel.textContent =
          nearest.label;
      }


      const pos =
        getRelicPx(nearest);


      if (el.relicBubble) {

        el.relicBubble.style.left =
          `${pos.x}px`;

        el.relicBubble.style.top =
          `${pos.y}px`;

        el.relicBubble.classList.remove(
          "hidden"
        );
      }

    } else {

      GS.activeRelic = null;

      el.relicBubble?.classList.add(
        "hidden"
      );
    }
  }


  // ============================================================
  // 13. INTERACTION
  // ============================================================

  function interact() {

    // ----------------------------------------------------------
    // Dialogue
    // ----------------------------------------------------------

    if (
      GS.scene === "DIALOGUE"
    ) {

      advanceDlg();
      return;
    }


    // ----------------------------------------------------------
    // CITY
    // ----------------------------------------------------------

    if (
      GS.scene === "CITY"
    ) {

      if (!GS.activeNPC) {
        return;
      }


      sfx.interact();

      const id =
        GS.activeNPC;


      // --------------------------------------------------------
      // BEFORE BLACKOUT
      // --------------------------------------------------------

      if (!GS.blackout) {

        if (id === "muthu") {

          GS.visited.muthu = true;
          GS.talkCount++;

          dlg(
            "city",
            "☕",
            "MUTHU",
            "TEA MASTER",
            [
              "Vanakkam, coordinator! Fresh filter coffee for you?",
              "Something strange is happening with the power lines today.",
              "The city feels uneasy. Three outages in the last hour..."
            ],
            checkBlackout
          );

        }

        else if (
          id === "karthik"
        ) {

          GS.visited.karthik = true;
          GS.talkCount++;

          dlg(
            "city",
            "🎒",
            "KARTHIK",
            "COLLEGE STUDENT",
            [
              "Anna! I'm trying to get to my exam! The metro froze twice already.",
              "Thousands of students are stranded at Chennai Central.",
              "Something's wrong with the grid..."
            ],
            checkBlackout
          );

        }

        else if (
          id === "priya"
        ) {

          GS.visited.priya = true;
          GS.talkCount++;

          dlg(
            "city",
            "🩺",
            "DR. PRIYA",
            "ICU PHYSICIAN",
            [
              "Coordinator! I'm glad you're here.",
              "Our ICU has 43 patients on ventilators and surgical monitors.",
              "Emergency battery gives us only 14 minutes if the main line drops."
            ],
            checkBlackout
          );

        }

        else if (
          id === "kavitha"
        ) {

          GS.visited.kavitha = true;
          GS.talkCount++;

          dlg(
            "city",
            "⚡",
            "KAVITHA",
            "GRID CHIEF",
            [
              "Load frequency is fluctuating badly across the corridor.",
              "If even one more substation trips, we lose the automated balancing system.",
              "We need to decide fast — the city is at a tipping point."
            ],
            checkBlackout
          );
        }

        return;
      }


      // --------------------------------------------------------
      // AFTER BLACKOUT
      // --------------------------------------------------------

      if (
        id === "device"
      ) {

        if (!GS.firstChoice) {

          openDecision();

        } else {

          openAllocation();
        }

        return;
      }


      // --------------------------------------------------------
      // PRIYA
      // --------------------------------------------------------

      if (
        id === "priya" &&
        !GS.post.priya
      ) {

        GS.post.priya = true;
        GS.visited.priya = true;


        const lines =
          GS.firstChoice === "HOSPITAL"

            ? [
                "Thank you for keeping us online!",
                "Listen — we don't actually need the whole grid.",
                "Critical care only needs about 30 units of power."
              ]

            : [
                "We're draining battery fast — maybe 14 minutes left!",
                "If you can re-route the feeder...",
                "Critical care only needs 30 units. Please act soon!"
              ];


        dlg(
          "city",
          "🩺",
          "DR. PRIYA",
          "ICU PHYSICIAN",
          lines,
          checkExploreProgress
        );
      }


      // --------------------------------------------------------
      // KARTHIK
      // --------------------------------------------------------

      else if (
        id === "karthik" &&
        !GS.post.karthik
      ) {

        GS.post.karthik = true;
        GS.visited.karthik = true;


        const lines =
          GS.firstChoice === "METRO"

            ? [
                "The trains are moving! We can evacuate!",
                "The transit team confirmed — reduced service only needs 30 units of power!"
              ]

            : [
                "We're still trapped... people are panicking in the tunnels.",
                "The technician says — even slow trains only need 30 units to safely run!"
              ];


        dlg(
          "city",
          "🎒",
          "KARTHIK",
          "COLLEGE STUDENT",
          lines,
          checkExploreProgress
        );
      }


      // --------------------------------------------------------
      // KAVITHA
      // --------------------------------------------------------

      else if (
        id === "kavitha" &&
        !GS.post.kavitha
      ) {

        GS.post.kavitha = true;
        GS.visited.kavitha = true;


        dlg(
          "city",
          "⚡",
          "KAVITHA",
          "GRID CHIEF",
          [
            "Coordinator — look at the telemetry.",
            "Every re-route bleeds the reserve from another sector.",
            "The central buffer needs at least 35 units to prevent a city-wide cascade failure.",
            "Protect the buffer. That's the key to everything."
          ],
          checkExploreProgress
        );
      }


      // --------------------------------------------------------
      // MUTHU AFTER BLACKOUT
      // --------------------------------------------------------

      else if (
        id === "muthu"
      ) {

        const lines =
          GS.firstChoice === "HOSPITAL"

            ? [
                "You saved the hospital — but look at those stranded commuters...",
                "Every choice takes something away, doesn't it?"
              ]

            : [
                "The trains are running — but the hospital emergency beacons are red.",
                "One problem fixed, another problem born."
              ];


        dlg(
          "city",
          "☕",
          "MUTHU",
          "TEA MASTER",
          lines
        );
      }
    }


    // ----------------------------------------------------------
    // OVERLOOK
    // ----------------------------------------------------------

    if (
      GS.scene === "OVERLOOK"
    ) {

      if (!GS.activeRelic) {
        return;
      }


      const id =
        GS.activeRelic;


      /*
       * Prevent interaction with a relic
       * that was already collected.
       */

      if (
        GS.relics[id]
      ) {
        return;
      }


      sfx.relic();


      // --------------------------------------------------------
      // LEAF
      // --------------------------------------------------------

      if (
        id === "leaf"
      ) {

        GS.relics.leaf = true;

        el.tagLeaf.textContent =
          "அழிவதூஉம்";

        el.tagLeaf.classList.add(
          "found"
        );


        GS.activeRelic = null;


        dlg(
          "ending",
          "🌱",
          "ANCIENT SAGE",
          "A FALLEN GOLDEN LEAF",
          [
            "Every choice leaves something behind.",
            "அழிவதூஉம் — What may be lost..."
          ],
          checkRelics
        );
      }


      // --------------------------------------------------------
      // LIGHT
      // --------------------------------------------------------

      else if (
        id === "light"
      ) {

        GS.relics.light = true;

        el.tagLight.textContent =
          "ஆவதூஉம் ஆகி";

        el.tagLight.classList.add(
          "found"
        );


        GS.activeRelic = null;


        dlg(
          "ending",
          "💡",
          "ANCIENT SAGE",
          "CITY LIGHT BEACON",
          [
            "A choice can also create something new.",
            "ஆவதூஉம் ஆகி — What may result..."
          ],
          checkRelics
        );
      }


      // --------------------------------------------------------
      // TREE
      // --------------------------------------------------------

      else if (
        id === "tree"
      ) {

        GS.relics.tree = true;

        el.tagTree.textContent =
          "வழிபயக்கும்";

        el.tagTree.classList.add(
          "found"
        );


        GS.activeRelic = null;


        dlg(
          "ending",
          "🌳",
          "ANCIENT SAGE",
          "ANCIENT BANYAN PATH",
          [
            "But what happens next — that is what matters most.",
            "வழிபயக்கும் — What consequence may follow downstream..."
          ],
          checkRelics
        );
      }


      // --------------------------------------------------------
      // HORIZON — FOURTH RELIC
      // --------------------------------------------------------

      else if (
        id === "horizon"
      ) {

        GS.relics.horizon = true;

        el.tagHorizon.textContent =
          "ஊதியமும் சூழ்ந்து செயல்";

        el.tagHorizon.classList.add(
          "found"
        );


        GS.activeRelic = null;


        dlg(
          "ending",
          "🌅",
          "ANCIENT SAGE",
          "HORIZON OVERLOOK",
          [
            "Think beyond the first result. Deliberate thoroughly.",
            "ஊதியமும் சூழ்ந்து செயல் — Act only after deep consideration."
          ],
          checkRelics
        );
      }
    }
  }


  // ============================================================
  // 14. DIALOGUE SYSTEM
  // ============================================================

  function dlg(
    scene,
    avatar,
    name,
    title,
    lines,
    onEnd = null
  ) {

    GS.scene = "DIALOGUE";

    GS.dlgScene = scene;

    GS.dlgQueue =
      Array.isArray(lines)
        ? lines
        : [String(lines)];

    GS.dlgIdx = 0;

    GS.dlgOnEnd = onEnd;


    if (
      scene === "city"
    ) {

      el.dialogueAvatar.textContent =
        avatar;

      el.dialogueName.textContent =
        name;

      el.dialogueTitle.textContent =
        title;

      el.dialogueTray.classList.remove(
        "hidden"
      );

    } else {

      el.dialogueAvatarS.textContent =
        avatar;

      el.dialogueNameS.textContent =
        name;

      el.dialogueTitleS.textContent =
        title;

      el.dialogueTrayShared.classList.remove(
        "hidden"
      );
    }


    typeCurrentLine();
  }


  function typeCurrentLine() {

    if (
      GS.dlgTimer
    ) {
      clearInterval(
        GS.dlgTimer
      );
    }


    const contentEl =
      GS.dlgScene === "city"
        ? el.dialogueContent
        : el.dialogueContentS;


    const text =
      GS.dlgQueue[
        GS.dlgIdx
      ] ?? "";


    contentEl.textContent = "";

    GS.dlgTyping = true;


    let i = 0;


    GS.dlgTimer =
      setInterval(() => {

        if (
          i < text.length
        ) {

          contentEl.textContent +=
            text[i];

          if (
            i % 3 === 0
          ) {
            sfx.blip();
          }

          i++;

        } else {

          clearInterval(
            GS.dlgTimer
          );

          GS.dlgTimer = null;

          GS.dlgTyping = false;
        }

      }, 17);
  }


  function advanceDlg() {

    const contentEl =
      GS.dlgScene === "city"
        ? el.dialogueContent
        : el.dialogueContentS;


    // If currently typing,
    // first click completes the sentence.

    if (
      GS.dlgTyping
    ) {

      if (
        GS.dlgTimer
      ) {
        clearInterval(
          GS.dlgTimer
        );
      }

      GS.dlgTimer = null;

      contentEl.textContent =
        GS.dlgQueue[
          GS.dlgIdx
        ];

      GS.dlgTyping = false;

      return;
    }


    sfx.blip();


    GS.dlgIdx++;


    if (
      GS.dlgIdx <
      GS.dlgQueue.length
    ) {

      typeCurrentLine();

      return;
    }


    // Dialogue finished.

    el.dialogueTray?.classList.add(
      "hidden"
    );

    el.dialogueTrayShared?.classList.add(
      "hidden"
    );


    GS.scene =
      GS.dlgScene === "city"
        ? "CITY"
        : "OVERLOOK";


    if (
      GS.dlgOnEnd
    ) {

      const callback =
        GS.dlgOnEnd;

      GS.dlgOnEnd = null;

      callback();
    }
  }


  // ============================================================
  // 15. BLACKOUT
  // ============================================================

  function checkBlackout() {

    if (
      !GS.blackout &&
      GS.talkCount >= 2
    ) {

      triggerBlackout();
    }
  }


  function triggerBlackout() {

    GS.blackout = true;

    sfx.blackout();


    [
      el.pool1,
      el.pool2,
      el.pool3,
      el.pool4
    ].forEach(pool => {
      pool?.classList.add(
        "darkened"
      );
    });


    if (el.metroStatusPill) {

      el.metroStatusPill.textContent =
        "HALTED !";

      el.metroStatusPill.style.background =
        "var(--c-red-t)";

      el.metroStatusPill.style.color =
        "var(--c-red)";
    }


    if (el.metroGateLight) {

      el.metroGateLight.style.background =
        "var(--c-red)";
    }


    if (el.hospStatusPill) {

      el.hospStatusPill.textContent =
        "BATTERY 14m";

      el.hospStatusPill.style.background =
        "var(--c-red-t)";

      el.hospStatusPill.style.color =
        "var(--c-red)";
    }


    el.hospCross?.classList.add(
      "beacon-flashing"
    );


    el.cableSubToMetro?.setAttribute(
      "class",
      "cable-line cable-dead"
    );

    el.cableSubToHosp?.setAttribute(
      "class",
      "cable-line cable-dead"
    );


    el.fallenDevice?.classList.remove(
      "hidden"
    );


    showBanner(
      "⚡",
      "⚠ POWER CASCADE! A glowing node crashed on the road. Investigate it!"
    );


    setObjective(
      "A strange energy node fell in the street. Walk over and INVESTIGATE it."
    );
  }


  // ============================================================
  // 16. BANNER / OBJECTIVE
  // ============================================================

  let bannerTimer = null;


  function showBanner(
    icon,
    text
  ) {

    if (!el.worldBanner) {
      return;
    }


    el.bannerIcon.textContent =
      icon;

    el.bannerText.textContent =
      text;


    el.worldBanner.classList.remove(
      "hidden"
    );


    if (bannerTimer) {
      clearTimeout(
        bannerTimer
      );
    }


    bannerTimer =
      setTimeout(() => {

        el.worldBanner.classList.add(
          "hidden"
        );

      }, 5000);
  }


  function setObjective(text) {

    if (
      el.objectiveText
    ) {
      el.objectiveText.textContent =
        text;
    }
  }


  // ============================================================
  // 17. FIRST DECISION
  // ============================================================

  function openDecision() {

    GS.scene = "DEVICE";

    el.modalDevice?.classList.remove(
      "hidden"
    );
  }


  function makeFirstChoice(choice) {

    sfx.choice();

    GS.firstChoice =
      choice;


    el.modalDevice?.classList.add(
      "hidden"
    );


    GS.scene = "CITY";


    // ----------------------------------------------------------
    // HOSPITAL
    // ----------------------------------------------------------

    if (
      choice === "HOSPITAL"
    ) {

      el.hospStatusPill.textContent =
        "STABLE";

      el.hospStatusPill.style.background =
        "var(--c-green-t)";

      el.hospStatusPill.style.color =
        "var(--c-emerald)";


      el.hospCross?.classList.remove(
        "beacon-flashing"
      );


      [
        el.hw1,
        el.hw2,
        el.hw3
      ].forEach(w => {
        w?.classList.remove(
          "dark"
        );
      });


      el.cableSubToHosp?.setAttribute(
        "class",
        "cable-line cable-powered"
      );

      el.cableSubToMetro?.setAttribute(
        "class",
        "cable-line cable-dead"
      );


      showBanner(
        "🏥",
        "Hospital secured. But the metro network begins losing power..."
      );
    }


    // ----------------------------------------------------------
    // METRO
    // ----------------------------------------------------------

    else {

      el.metroStatusPill.textContent =
        "ACTIVE";

      el.metroStatusPill.style.background =
        "var(--c-green-t)";

      el.metroStatusPill.style.color =
        "var(--c-emerald)";


      el.metroGateLight.style.background =
        "var(--c-cyan)";


      el.hospStatusPill.textContent =
        "BATTERY CRITICAL";


      el.hw1?.classList.add(
        "dark"
      );

      el.hw2?.classList.add(
        "dark"
      );


      el.cableSubToMetro?.setAttribute(
        "class",
        "cable-line cable-powered"
      );

      el.cableSubToHosp?.setAttribute(
        "class",
        "cable-line cable-dead"
      );


      showBanner(
        "🚇",
        "Metro powered! But hospital trauma units switch to 14-min emergency battery."
      );
    }


    setObjective(
      "Visit the Hospital, Metro Station, and Power Grid to learn the full picture."
    );
  }


  // ============================================================
  // 18. EXPLORATION TRACKING
  // ============================================================

  function checkExploreProgress() {

    const count =
      (GS.post.priya ? 1 : 0) +
      (GS.post.karthik ? 1 : 0) +
      (GS.post.kavitha ? 1 : 0);


    if (
      count >= 2
    ) {

      setObjective(
        "You know enough. Return to the power node and make THE LAST DECISION."
      );

    } else {

      setObjective(
        `Gather information (${count}/3 sectors investigated).`
      );
    }
  }


  // ============================================================
  // 19. FINAL ALLOCATION
  // ============================================================

  function openAllocation() {

    GS.scene =
      "ALLOCATION";


    syncAllocUI();


    el.modalAllocation?.classList.remove(
      "hidden"
    );
  }


  function handleSlider(changed) {

    let h =
      Number(el.sliderHosp.value);

    let g =
      Number(el.sliderGrid.value);

    let m =
      Number(el.sliderMetro.value);


    let total =
      h + g + m;


    if (
      total !== 100
    ) {

      const diff =
        100 - total;


      if (
        changed === "h"
      ) {

        g = Math.max(
          10,
          Math.min(
            70,
            g + Math.round(diff / 2)
          )
        );

        m =
          Math.max(
            10,
            Math.min(
              70,
              100 - h - g
            )
          );

      }

      else if (
        changed === "g"
      ) {

        h = Math.max(
          10,
          Math.min(
            70,
            h + Math.round(diff / 2)
          )
        );

        m =
          Math.max(
            10,
            Math.min(
              70,
              100 - h - g
            )
          );

      }

      else {

        h = Math.max(
          10,
          Math.min(
            70,
            h + Math.round(diff / 2)
          )
        );

        g =
          Math.max(
            10,
            Math.min(
              70,
              100 - h - m
            )
          );
      }


      el.sliderHosp.value = h;
      el.sliderGrid.value = g;
      el.sliderMetro.value = m;
    }


    GS.finalAlloc = {
      h,
      g,
      m
    };


    syncAllocUI();
  }


  function syncAllocUI() {

    const {
      h,
      g,
      m
    } = GS.finalAlloc;


    if (el.valHospDisplay) {
      el.valHospDisplay.textContent =
        `${h}%`;
    }

    if (el.valGridDisplay) {
      el.valGridDisplay.textContent =
        `${g}%`;
    }

    if (el.valMetroDisplay) {
      el.valMetroDisplay.textContent =
        `${m}%`;
    }


    if (el.segHosp) {
      el.segHosp.style.width =
        `${h}%`;
    }

    if (el.segGrid) {
      el.segGrid.style.width =
        `${g}%`;
    }

    if (el.segMetro) {
      el.segMetro.style.width =
        `${m}%`;
    }


    if (el.allocTotalDisplay) {
      el.allocTotalDisplay.textContent =
        `${h + g + m} / 100 UNITS`;
    }


    if (el.noteHosp) {

      el.noteHosp.innerHTML =
        h < 25

          ? "<strong style='color:var(--c-red)'>CRITICAL:</strong> Ventilators trip. Lives at risk."

          : h <= 42

            ? "<span style='color:var(--c-emerald)'>OPTIMAL:</span> ICU and surgical life-support sustained."

            : "<span style='color:var(--c-yellow)'>EXCESS:</span> Wastes energy on non-vital systems.";
    }


    if (el.noteGrid) {

      el.noteGrid.innerHTML =
        g < 25

          ? "<strong style='color:var(--c-red)'>NO BUFFER:</strong> City-wide cascade failure inevitable."

          : g <= 46

            ? "<span style='color:var(--c-emerald)'>BALANCED:</span> Protects against cascading metro-wide failure."

            : "<span style='color:var(--c-yellow)'>HOARDING:</span> Power idling while sectors strain.";
    }


    if (el.noteMetro) {

      el.noteMetro.innerHTML =
        m < 25

          ? "<strong style='color:var(--c-red)'>HALTED:</strong> Thousands stranded underground."

          : m <= 36

            ? "<span style='color:var(--c-emerald)'>REDUCED SERVICE:</span> Safe, steady evacuation transit."

            : "<span style='color:var(--c-yellow)'>OVERDRIVE:</span> High traction drains the central buffer.";
    }
  }


  function commitAllocation() {

    sfx.choice();

    el.modalAllocation?.classList.add(
      "hidden"
    );


    const {
      h,
      g,
      m
    } = GS.finalAlloc;


    const visitedAll =
      GS.post.priya &&
      GS.post.karthik &&
      GS.post.kavitha;


    /*
     * Three possible endings:
     *
     * SAVIOR   = extreme allocation
     * SURVIVOR = balanced but didn't gather all information
     * THINKER  = gathered information + balanced decision
     */

    if (
      h > 50 ||
      g > 50 ||
      m > 50 ||
      h < 20 ||
      g < 20 ||
      m < 20
    ) {

      GS.ending =
        "SAVIOR";

    }

    else if (
      !visitedAll
    ) {

      GS.ending =
        "SURVIVOR";

    }

    else {

      GS.ending =
        "THINKER";
    }


    openOverlook();
  }


  // ============================================================
  // 20. OPEN SCENIC OVERLOOK
  // ============================================================

  function openOverlook() {

    switchScene(
      "OVERLOOK"
    );


    /*
     * Calculate actual scene dimensions.
     * This fixes the fourth relic problem.
     */

    updateScenicBounds();


    const {
      width,
      height
    } = getEndingSize();


    // Start near the middle.
    GS.scenic.x =
      width * 0.48;

    GS.scenic.y =
      height * 0.58;


    // Clamp starting position.
    GS.scenic.x =
      Math.max(
        GS.scenicBounds.minX,
        Math.min(
          GS.scenicBounds.maxX,
          GS.scenic.x
        )
      );


    GS.scenic.y =
      Math.max(
        GS.scenicBounds.minY,
        Math.min(
          GS.scenicBounds.maxY,
          GS.scenic.y
        )
      );


    if (el.scenicPlayer) {

      el.scenicPlayer.style.left =
        `${GS.scenic.x}px`;

      el.scenicPlayer.style.top =
        `${GS.scenic.y}px`;
    }


    if (
      GS.ending === "THINKER"
    ) {

      el.scenicGoal.textContent =
        "Walk the hilltop. Discover all 4 fragments of ancient wisdom (0/4).";

      el.cityPanorama.style.opacity =
        "1";

    } else {

      el.scenicGoal.textContent =
        "Walk the hilltop. Discover the 4 fragments to understand what happened (0/4).";

      el.cityPanorama.style.opacity =
        "0.45";
    }


    // Immediately calculate nearest relic.
    checkScenicProximity();
  }


  // ============================================================
  // 21. RELIC PROGRESS
  // ============================================================

  let kuralShown = false;


  function checkRelics() {

    const count =
      Object.values(
        GS.relics
      ).filter(Boolean).length;


    if (el.scenicGoal) {

      el.scenicGoal.textContent =
        count < 4

          ? `Fragments discovered: (${count}/4). Explore the hilltop!`

          : "All four fragments discovered.";
    }


    if (
      count === 4 &&
      !kuralShown
    ) {

      kuralShown = true;


      setTimeout(() => {

        sfx.triumph();

        el.kuralCelestial?.classList.remove(
          "hidden"
        );

      }, 700);
    }
  }


  // ============================================================
  // 22. WALK BACK TO CITY
  // ============================================================

  function walkBackToCity() {

    sfx.interact();


    el.kuralCelestial?.classList.add(
      "hidden"
    );


    switchScene(
      "CITY"
    );


    if (
      GS.ending === "THINKER"
    ) {

      el.metroStatusPill.textContent =
        "ONLINE (REDUCED)";

      el.metroStatusPill.style.background =
        "var(--c-green-t)";

      el.metroStatusPill.style.color =
        "var(--c-emerald)";


      el.hospStatusPill.textContent =
        "ICU SECURED";

      el.hospStatusPill.style.background =
        "var(--c-green-t)";

      el.hospStatusPill.style.color =
        "var(--c-emerald)";


      el.cableSubToMetro?.setAttribute(
        "class",
        "cable-line cable-powered"
      );

      el.cableSubToHosp?.setAttribute(
        "class",
        "cable-line cable-powered"
      );


      el.celebRays?.classList.remove(
        "hidden"
      );


      showBanner(
        "🌟",
        "THE CITY SURVIVED — Balanced forethought protected Chennai 2047."
      );


      setObjective(
        "You have saved Chennai. Walk freely among the blooming streets."
      );
    }


    else if (
      GS.ending === "SURVIVOR"
    ) {

      showBanner(
        "⚖️",
        "Strained equilibrium — the city avoided collapse, but barely."
      );


      setObjective(
        "Managed survival. Some areas remain under brownout."
      );
    }


    else {

      showBanner(
        "⚠️",
        "Cascade damage — one sector survived, another collapsed."
      );


      setObjective(
        "The city paid the price for reactive, unbalanced decisions."
      );
    }
  }


  // ============================================================
  // 23. RESET GAME
  // ============================================================

  function resetGame() {

    sfx.interact();


    GS.scene = "INTRO";


    GS.player.x = 460;
    GS.player.y = 265;


    GS.scenic.x = 0;
    GS.scenic.y = 0;


    GS.blackout = false;
    GS.firstChoice = null;


    GS.talkCount = 0;


    GS.visited = {
      muthu: false,
      karthik: false,
      priya: false,
      kavitha: false
    };


    GS.post = {
      priya: false,
      karthik: false,
      kavitha: false
    };


    GS.finalAlloc = {
      h: 35,
      g: 35,
      m: 30
    };


    GS.ending = null;


    GS.relics = {
      leaf: false,
      light: false,
      tree: false,
      horizon: false
    };


    GS.activeNPC = null;
    GS.activeRelic = null;


    GS.dlgQueue = [];
    GS.dlgIdx = 0;
    GS.dlgTyping = false;
    GS.dlgOnEnd = null;


    kuralShown = false;


    if (GS.dlgTimer) {

      clearInterval(
        GS.dlgTimer
      );

      GS.dlgTimer = null;
    }


    // ----------------------------------------------------------
    // Reset player
    // ----------------------------------------------------------

    el.playerActor.style.left =
      `${GS.player.x}px`;

    el.playerActor.style.top =
      `${GS.player.y}px`;


    el.scenicPlayer.style.left =
      "0px";

    el.scenicPlayer.style.top =
      "0px";


    // ----------------------------------------------------------
    // Hide overlays
    // ----------------------------------------------------------

    el.fallenDevice?.classList.add(
      "hidden"
    );

    el.worldBanner?.classList.add(
      "hidden"
    );

    el.dialogueTray?.classList.add(
      "hidden"
    );

    el.dialogueTrayShared?.classList.add(
      "hidden"
    );

    el.modalDevice?.classList.add(
      "hidden"
    );

    el.modalAllocation?.classList.add(
      "hidden"
    );

    el.kuralCelestial?.classList.add(
      "hidden"
    );

    el.celebRays?.classList.add(
      "hidden"
    );

    el.contextBubble?.classList.add(
      "hidden"
    );

    el.relicBubble?.classList.add(
      "hidden"
    );


    // ----------------------------------------------------------
    // Reset relic tags
    // ----------------------------------------------------------

    [
      "tagLeaf",
      "tagLight",
      "tagTree",
      "tagHorizon"
    ].forEach(id => {

      const tag = $(id);

      if (!tag) return;

      tag.textContent =
        "DISCOVER";

      tag.classList.remove(
        "found"
      );
    });


    // ----------------------------------------------------------
    // Reset lights
    // ----------------------------------------------------------

    [
      el.pool1,
      el.pool2,
      el.pool3,
      el.pool4
    ].forEach(pool => {

      pool?.classList.remove(
        "darkened"
      );
    });


    // ----------------------------------------------------------
    // Reset metro
    // ----------------------------------------------------------

    if (el.metroStatusPill) {

      el.metroStatusPill.textContent =
        "ONLINE";

      el.metroStatusPill.style.background =
        "";

      el.metroStatusPill.style.color =
        "";
    }


    if (el.metroGateLight) {

      el.metroGateLight.style.background =
        "var(--c-cyan)";
    }


    // ----------------------------------------------------------
    // Reset hospital
    // ----------------------------------------------------------

    if (el.hospStatusPill) {

      el.hospStatusPill.textContent =
        "NORMAL";

      el.hospStatusPill.style.background =
        "";

      el.hospStatusPill.style.color =
        "";
    }


    el.hospCross?.classList.remove(
      "beacon-flashing"
    );


    [
      el.hw1,
      el.hw2,
      el.hw3
    ].forEach(w => {

      w?.classList.remove(
        "dark"
      );
    });


    // ----------------------------------------------------------
    // Reset cables
    // ----------------------------------------------------------

    el.cableSubToMetro?.setAttribute(
      "class",
      "cable-line cable-live"
    );

    el.cableSubToHosp?.setAttribute(
      "class",
      "cable-line cable-live"
    );


    // ----------------------------------------------------------
    // Reset allocation sliders
    // ----------------------------------------------------------

    if (el.sliderHosp) {
      el.sliderHosp.value = 35;
    }

    if (el.sliderGrid) {
      el.sliderGrid.value = 35;
    }

    if (el.sliderMetro) {
      el.sliderMetro.value = 30;
    }


    syncAllocUI();


    // ----------------------------------------------------------
    // Reset objective
    // ----------------------------------------------------------

    setObjective(
      "Explore the sunny street. Talk to the people around you."
    );


    switchScene(
      "INTRO"
    );
  }


  // ============================================================
  // 24. SOUND BUTTON
  // ============================================================

  if (el.soundToggle) {

    el.soundToggle.addEventListener(
      "click",
      () => {

        GS.audioOn =
          !GS.audioOn;


        if (GS.audioOn) {

          if (el.soundIcon) {
            el.soundIcon.textContent =
              "🔊";
          }

          if (el.soundText) {
            el.soundText.textContent =
              "SOUND";
          }

          el.soundToggle.classList.remove(
            "muted"
          );


          initAudio();
          sfx.blip();

        } else {

          if (el.soundIcon) {
            el.soundIcon.textContent =
              "🔇";
          }

          if (el.soundText) {
            el.soundText.textContent =
              "MUTED";
          }

          el.soundToggle.classList.add(
            "muted"
          );
        }
      }
    );
  }


  // ============================================================
  // 25. START GAME
  // ============================================================

  if (el.btnStartGame) {

    el.btnStartGame.addEventListener(
      "click",
      () => {

        initAudio();

        sfx.interact();

        switchScene(
          "CITY"
        );
      }
    );
  }


  // ============================================================
  // 26. DIALOGUE BUTTONS
  // ============================================================

  el.btnDialogueNext?.addEventListener(
    "click",
    advanceDlg
  );


  el.btnDialogueNextS?.addEventListener(
    "click",
    advanceDlg
  );


  // Clicking dialogue tray advances it.
  el.dialogueTray?.addEventListener(
    "click",
    () => {
      advanceDlg();
    }
  );


  el.dialogueTrayShared?.addEventListener(
    "click",
    () => {
      advanceDlg();
    }
  );


  // ============================================================
  // 27. FIRST DECISION BUTTONS
  // ============================================================

  el.btnChooseHosp?.addEventListener(
    "click",
    () => {
      makeFirstChoice(
        "HOSPITAL"
      );
    }
  );


  el.btnChooseMetro?.addEventListener(
    "click",
    () => {
      makeFirstChoice(
        "METRO"
      );
    }
  );


  // ============================================================
  // 28. ALLOCATION SLIDERS
  // ============================================================

  el.sliderHosp?.addEventListener(
    "input",
    () => {
      handleSlider("h");
    }
  );


  el.sliderGrid?.addEventListener(
    "input",
    () => {
      handleSlider("g");
    }
  );


  el.sliderMetro?.addEventListener(
    "input",
    () => {
      handleSlider("m");
    }
  );


  el.btnCommitAllocation?.addEventListener(
    "click",
    commitAllocation
  );


  // ============================================================
  // 29. ENDING PORTALS
  // ============================================================

  el.portalWalkCity?.addEventListener(
    "click",
    walkBackToCity
  );


  el.portalReplayNode?.addEventListener(
    "click",
    resetGame
  );


  // ============================================================
  // 30. KEYBOARD MOVEMENT
  // ============================================================

  window.addEventListener(
    "keydown",
    event => {

      const key =
        event.key.toLowerCase();


      if (
        key === "w" ||
        key === "arrowup"
      ) {

        event.preventDefault();

        GS.keys.up = true;
      }


      if (
        key === "s" ||
        key === "arrowdown"
      ) {

        event.preventDefault();

        GS.keys.down = true;
      }


      if (
        key === "a" ||
        key === "arrowleft"
      ) {

        event.preventDefault();

        GS.keys.left = true;
      }


      if (
        key === "d" ||
        key === "arrowright"
      ) {

        event.preventDefault();

        GS.keys.right = true;
      }


      // E = interact.
      if (
        key === "e"
      ) {

        event.preventDefault();

        interact();

        return;
      }


      // SPACE / ENTER
      if (
        key === " " ||
        key === "enter"
      ) {

        event.preventDefault();


        if (
          GS.scene === "DIALOGUE"
        ) {

          advanceDlg();

        }

        else if (
          GS.scene === "INTRO"
        ) {

          el.btnStartGame?.click();

        }

        else {

          interact();
        }
      }
    }
  );


  // ============================================================
  // 31. KEYBOARD RELEASE
  // ============================================================

  window.addEventListener(
    "keyup",
    event => {

      const key =
        event.key.toLowerCase();


      if (
        key === "w" ||
        key === "arrowup"
      ) {

        GS.keys.up = false;
      }


      if (
        key === "s" ||
        key === "arrowdown"
      ) {

        GS.keys.down = false;
      }


      if (
        key === "a" ||
        key === "arrowleft"
      ) {

        GS.keys.left = false;
      }


      if (
        key === "d" ||
        key === "arrowright"
      ) {

        GS.keys.right = false;
      }
    }
  );


  // ============================================================
  // 32. MOBILE D-PAD
  // ============================================================

  function bindDpad(
    button,
    direction
  ) {

    if (!button) {
      return;
    }


    const press = event => {

      event.preventDefault();

      GS.keys[direction] = true;
    };


    const release = event => {

      event.preventDefault();

      GS.keys[direction] = false;
    };


    button.addEventListener(
      "touchstart",
      press,
      {
        passive: false
      }
    );


    button.addEventListener(
      "touchend",
      release,
      {
        passive: false
      }
    );


    button.addEventListener(
      "touchcancel",
      release,
      {
        passive: false
      }
    );


    button.addEventListener(
      "mousedown",
      press
    );


    button.addEventListener(
      "mouseup",
      release
    );


    button.addEventListener(
      "mouseleave",
      release
    );
  }


  // City D-pad
  bindDpad(
    el.dpadUp,
    "up"
  );

  bindDpad(
    el.dpadDown,
    "down"
  );

  bindDpad(
    el.dpadLeft,
    "left"
  );

  bindDpad(
    el.dpadRight,
    "right"
  );


  // Ending D-pad
  bindDpad(
    el.dpadUpE,
    "up"
  );

  bindDpad(
    el.dpadDownE,
    "down"
  );

  bindDpad(
    el.dpadLeftE,
    "left"
  );

  bindDpad(
    el.dpadRightE,
    "right"
  );


  // ============================================================
  // 33. MOBILE INTERACT
  // ============================================================

  let mobileInteractLock = false;


  function mobileInteract() {

    if (
      mobileInteractLock
    ) {
      return;
    }


    mobileInteractLock = true;

    interact();


    setTimeout(() => {

      mobileInteractLock =
        false;

    }, 120);
  }


  el.mobileInteractBtn?.addEventListener(
    "click",
    mobileInteract
  );


  el.mobileInteractBtnE?.addEventListener(
    "click",
    mobileInteract
  );


  el.mobileInteractBtn?.addEventListener(
    "touchstart",
    event => {

      event.preventDefault();

      mobileInteract();

    },
    {
      passive: false
    }
  );


  el.mobileInteractBtnE?.addEventListener(
    "touchstart",
    event => {

      event.preventDefault();

      mobileInteract();

    },
    {
      passive: false
    }
  );


  // ============================================================
  // 34. RESIZE
  // ============================================================

  window.addEventListener(
    "resize",
    () => {

      if (
        GS.scene !== "OVERLOOK"
      ) {
        return;
      }


      updateScenicBounds();


      // Keep player inside new bounds.
      GS.scenic.x =
        Math.max(
          GS.scenicBounds.minX,
          Math.min(
            GS.scenicBounds.maxX,
            GS.scenic.x
          )
        );


      GS.scenic.y =
        Math.max(
          GS.scenicBounds.minY,
          Math.min(
            GS.scenicBounds.maxY,
            GS.scenic.y
          )
        );


      if (el.scenicPlayer) {

        el.scenicPlayer.style.left =
          `${GS.scenic.x}px`;

        el.scenicPlayer.style.top =
          `${GS.scenic.y}px`;
      }


      checkScenicProximity();
    }
  );


  // ============================================================
  // 35. INITIALIZE
  // ============================================================

  syncAllocUI();

  switchScene(
    "INTRO"
  );


  // Start game loop.
  requestAnimationFrame(
    gameLoop
  );

});