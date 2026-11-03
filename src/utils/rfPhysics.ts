import { ChannelConfig, LiveMetrics } from '../types/simulator';

// Standard 802.11 / Wireless Channel Center Frequencies in 2.4 GHz
export const WIFI_CHANNELS = [
  { ch: 1, freq: 2412, isDfs: false },
  { ch: 6, freq: 2437, isDfs: false },
  { ch: 11, freq: 2462, isDfs: false },
  { ch: 36, freq: 5180, isDfs: false },
  { ch: 40, freq: 5200, isDfs: false },
];

// MCS Table (Modulation and Coding Scheme)
export const MCS_PROFILES = [
  { mcs: 0, mod: 'BPSK', rate: '1/2', minSnr: 4, maxThroughputMbps: 7.2 },
  { mcs: 1, mod: 'QPSK', rate: '1/2', minSnr: 8, maxThroughputMbps: 14.4 },
  { mcs: 2, mod: 'QPSK', rate: '3/4', minSnr: 11, maxThroughputMbps: 21.7 },
  { mcs: 3, mod: '16-QAM', rate: '1/2', minSnr: 15, maxThroughputMbps: 28.9 },
  { mcs: 4, mod: '16-QAM', rate: '3/4', minSnr: 18, maxThroughputMbps: 43.3 },
  { mcs: 5, mod: '64-QAM', rate: '2/3', minSnr: 22, maxThroughputMbps: 57.8 },
  { mcs: 6, mod: '64-QAM', rate: '3/4', minSnr: 25, maxThroughputMbps: 65.0 },
  { mcs: 7, mod: '64-QAM', rate: '5/6', minSnr: 28, maxThroughputMbps: 72.2 },
];

/**
 * Log-distance Path Loss model with shadow fading
 * PL(d) = PL(d0) + 10 * gamma * log10(d / d0) + X_sigma
 */
function calculatePathLoss(distanceM: number, freqMhz: number = 2412): number {
  const d0 = 1.0;
  // Free space path loss at 1m: 20*log10(freq) + 20*log10(1) - 27.55
  const pl0 = 20 * Math.log10(freqMhz) - 27.55;
  const pathLossExponent = 2.8; // Indoor office / dynamic multipath environment
  const pl = pl0 + 10 * pathLossExponent * Math.log10(Math.max(1, distanceM) / d0);
  return pl;
}

/**
 * Calculate instantaneous RF metrics based on channel parameters, interference, and recovery state
 */
export function computeLiveRfMetrics(
  config: ChannelConfig,
  elapsedSec: number,
  isRecoveredMode: boolean
): LiveMetrics {
  const {
    txPowerDbm,
    distanceMeters,
    awgnNoiseDbm,
    jammingRatioDb,
    jammingType,
    injectedPacketLossPct,
    currentMcs,
  } = config;

  // 1. Calculate Received Signal Power P_rx
  const pathLoss = calculatePathLoss(distanceMeters, 2412);
  const multipathFade = Math.sin(elapsedSec * 2.5) * 1.8 + Math.cos(elapsedSec * 0.8) * 1.2;
  const signalPowerDbm = txPowerDbm - pathLoss + multipathFade; // typically -50 to -65 dBm

  // 2. Calculate Thermal Noise + AWGN
  // Base thermal noise floor for 20MHz bandwidth with 5dB receiver noise figure: ~ -96 dBm
  const thermalNoiseDbm = -96.0;
  const totalNoiseLinear = Math.pow(10, thermalNoiseDbm / 10) + Math.pow(10, awgnNoiseDbm / 10);
  const totalNoiseFloorDbm = 10 * Math.log10(totalNoiseLinear);

  // 3. Calculate Jamming / Interference Power
  let effectiveJammingPowerDbm = -120; // default negligible

  if (jammingType !== 'none') {
    // J/S ratio: Jamming Power = Signal Power + JammingRatioDb
    let rawJammingDbm = signalPowerDbm + jammingRatioDb;

    // Apply specific interference profile behaviors
    switch (jammingType) {
      case 'broadband_chirp': {
        // Continuous high power swept across subcarriers
        const chirpSway = Math.sin(elapsedSec * 8) * 2;
        effectiveJammingPowerDbm = rawJammingDbm + chirpSway;
        break;
      }
      case 'microwave_pulse': {
        // Periodic pulsed jamming (e.g. 50Hz/60Hz AC burst: bursts every ~0.8s)
        const pulseCycle = (elapsedSec * 3) % 1.0;
        const isSpike = pulseCycle > 0.6;
        effectiveJammingPowerDbm = isSpike ? rawJammingDbm + 6 : -115;
        break;
      }
      case 'narrowband_tone': {
        // Intense single tone saturating ADC and carrier tracking
        effectiveJammingPowerDbm = rawJammingDbm + 3;
        break;
      }
      case 'multipath_fade': {
        // Deep constructive/destructive notches with high phase jitter
        const deepNotch = Math.sin(elapsedSec * 4) > 0.4 ? -18 : 0;
        effectiveJammingPowerDbm = -105 + Math.abs(deepNotch);
        break;
      }
    }
  }

  // If link has successfully performed Channel Switching to an orthogonal channel,
  // the in-band jamming drops by adjacent-channel rejection (>38 dB)
  if (isRecoveredMode && config.currentChannel !== 6 && jammingType !== 'none') {
    effectiveJammingPowerDbm = Math.max(-120, effectiveJammingPowerDbm - 38);
  }

  // 4. Compute Total Received Energy RSSI
  // RSSI = 10 * log10(P_sig + P_jam + P_noise)
  const sigLinear = Math.pow(10, signalPowerDbm / 10);
  const jamLinear = Math.pow(10, effectiveJammingPowerDbm / 10);
  const totalRxLinear = sigLinear + jamLinear + totalNoiseLinear;
  const rssiDbm = 10 * Math.log10(totalRxLinear);

  // 5. Compute SINR (Signal to Interference + Noise Ratio)
  const interferencePlusNoiseLinear = jamLinear + totalNoiseLinear;
  const sinrDb = signalPowerDbm - 10 * Math.log10(interferencePlusNoiseLinear);
  const snrDb = signalPowerDbm - totalNoiseFloorDbm;

  // 6. Compute Bit Error Rate (BER) & Packet Delivery Ratio (PDR)
  const mcsProfile = MCS_PROFILES[Math.min(MCS_PROFILES.length - 1, Math.max(0, currentMcs))];
  const snrMargin = sinrDb - mcsProfile.minSnr;

  // Logistic approximation of Packet Error Rate (PER) based on SNR margin to MCS threshold
  // If snrMargin >= 6 dB -> PER near 0 (PDR 99-100%)
  // If snrMargin < 0 dB -> PER explodes to 80-100%
  let rawPer = 1 / (1 + Math.exp(snrMargin * 0.85));

  // Factor in injected packet loss and HARQ retries
  const injectedLossFactor = injectedPacketLossPct / 100;
  let combinedPer = 1 - (1 - rawPer) * (1 - injectedLossFactor);

  // HARQ retry benefit: if HARQ retries active, PER is reduced exponentially: PER_eff = combinedPer^(retries)
  if (config.harqRetries > 1) {
    combinedPer = Math.pow(combinedPer, Math.min(3, 1 + (config.harqRetries - 1) * 0.45));
  }

  // Clamped PDR percentage
  let pdr = Math.max(0, Math.min(100, (1 - combinedPer) * 100));

  // Small random micro-fluctuation to mirror real RF transceivers
  const noiseJitter = (Math.random() - 0.5) * 1.2;
  pdr = Math.max(0, Math.min(100, pdr + noiseJitter));

  // 7. Compute Round-Trip Latency (ms)
  // Base propagation + processing: 10 ms
  // When packets drop, MAC layer retransmits (exponential backoff) adds 25-150 ms
  let latencyMs = 11.5 + (Math.random() - 0.5) * 2;
  if (pdr < 95) {
    const lossDeficit = 95 - pdr;
    latencyMs += Math.pow(lossDeficit * 0.45, 1.4);
  }
  if (jammingType === 'microwave_pulse' && effectiveJammingPowerDbm > -80) {
    latencyMs += 35 + Math.random() * 25;
  }
  if (jammingType === 'broadband_chirp') {
    latencyMs += 45 + Math.random() * 30;
  }
  latencyMs = Math.max(6, Math.min(350, latencyMs));

  // Jitter is variance in latency
  const jitterMs = Math.max(0.5, Math.abs(latencyMs - 12.0) * 0.35 + Math.random() * 2);

  // 8. Effective Throughput (Mbps) via Shannon Capacity Bound & MCS
  // Shannon capacity: C = B * log2(1 + SINR_lin)
  const sinrLinear = Math.pow(10, Math.max(-10, sinrDb) / 10);
  const shannonCapacityMbps = 20 * Math.log2(1 + sinrLinear);
  const effectiveThroughputMbps = Math.min(
    mcsProfile.maxThroughputMbps,
    shannonCapacityMbps * (pdr / 100) * 0.8
  );

  return {
    timestamp: Date.now(),
    rssi: Number(rssiDbm.toFixed(1)),
    snr: Number(Math.max(-15, Math.min(45, sinrDb)).toFixed(1)), // using SINR as effective operational SNR
    pdr: Number(pdr.toFixed(1)),
    latency: Number(latencyMs.toFixed(1)),
    sinr: Number(sinrDb.toFixed(1)),
    jitter: Number(jitterMs.toFixed(1)),
    throughputMbps: Number(Math.max(0, effectiveThroughputMbps).toFixed(2)),
    rawNoiseFloorDbm: Number(totalNoiseFloorDbm.toFixed(1)),
  };
}
