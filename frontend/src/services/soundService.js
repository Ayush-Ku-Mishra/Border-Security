// ─────────────────────────────────────────
// SOUND SERVICE
// Plays alarm.mp3 for high threats
// Stops when high threat is removed
// ─────────────────────────────────────────

let alarmAudio = null;
let isPlaying = false;

// ─────────────────────────────────────────
// START ALARM
// Loops until stopped
// ─────────────────────────────────────────
export const startAlarm = () => {
  if (isPlaying) return;

  try {
    alarmAudio = new Audio("/alarm.mp3");
    alarmAudio.loop = true;
    alarmAudio.volume = 0.7;
    alarmAudio
      .play()
      .then(() => {
        isPlaying = true;
      })
      .catch((err) => {
        console.log("Audio play failed:", err);
      });
  } catch (err) {
    console.log("Audio error:", err);
  }
};

// ─────────────────────────────────────────
// STOP ALARM
// Called when high threat is removed
// ─────────────────────────────────────────
export const stopAlarm = () => {
  if (alarmAudio && isPlaying) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    isPlaying = false;
    alarmAudio = null;
  }
};

// ─────────────────────────────────────────
// PLAY ONCE - for low/medium alerts
// ─────────────────────────────────────────
export const playBeep = (threatLevel) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = threatLevel >= 2 ? 660 : 330;
    osc.type = "sine";

    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0.2, now + 0.01);
    gain.gain.setValueAtTime(0, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (err) {
    console.log("Beep error:", err);
  }
};
