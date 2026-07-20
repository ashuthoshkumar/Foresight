// A utility to play synthesized sounds using the Web Audio API
// This avoids needing to load heavy MP3 files and allows dynamic sound generation

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    
    // Play a sparkling, attractive rising arpeggio (C major 7th chord)
    // C5, E5, G5, B5, C6
    playTone(ctx, 523.25, 'sine', 0.0, 0.2, 0.2); // C5
    playTone(ctx, 659.25, 'sine', 0.1, 0.2, 0.2); // E5
    playTone(ctx, 783.99, 'sine', 0.2, 0.2, 0.2); // G5
    playTone(ctx, 987.77, 'sine', 0.3, 0.2, 0.15); // B5
    playTone(ctx, 1046.50, 'triangle', 0.4, 0.6, 0.3); // C6 (rings out)
  } catch (err) {
    console.warn("Audio not supported or blocked", err);
  }
}

export function playWarningTone() {
  try {
    const ctx = getAudioContext();
    const duration = 3.0; // 3 seconds total

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Use sawtooth for a harsh, buzzing siren texture
    osc.type = 'sawtooth';

    // Start at a mid-low frequency
    osc.frequency.setValueAtTime(400, ctx.currentTime);

    // Create a sweeping siren effect (up and down)
    for (let i = 0; i < 3; i++) {
      const time = ctx.currentTime + (i * 1.0);
      osc.frequency.linearRampToValueAtTime(1200, time + 0.5); // Sweep up
      osc.frequency.linearRampToValueAtTime(400, time + 1.0);  // Sweep down
    }

    // Volume envelope to avoid clicks and fade out at the end
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime + duration - 0.5);
    gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);

  } catch (err) {
    console.warn("Audio not supported or blocked", err);
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType,
  startTimeOffset: number,
  duration: number,
  volume: number
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTimeOffset);

  // Envelope to avoid clicking
  gainNode.gain.setValueAtTime(0, ctx.currentTime + startTimeOffset);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTimeOffset + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTimeOffset + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(ctx.currentTime + startTimeOffset);
  osc.stop(ctx.currentTime + startTimeOffset + duration);
}
