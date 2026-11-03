export type JammingType = 'none' | 'broadband_chirp' | 'microwave_pulse' | 'narrowband_tone' | 'multipath_fade';

export type RecoveryActionType = 'none' | 'channel_switching' | 'packet_retransmission' | 'rate_adaptation';

export type LinkState = 'nominal' | 'anomaly_detected' | 'diagnosing' | 'recovering' | 'stabilized';

export interface ChannelConfig {
  txPowerDbm: number; // e.g. 18 dBm
  distanceMeters: number; // e.g. 15 m
  currentChannel: number; // e.g. 1, 6, 11
  bandwidthMhz: number; // 20 MHz
  awgnNoiseDbm: number; // -105 to -60 dBm
  jammingRatioDb: number; // -30 to +25 dB (J/S)
  jammingType: JammingType;
  injectedPacketLossPct: number; // 0 to 100%
  currentMcs: number; // 0 to 7 (BPSK to 64-QAM)
  fecRate: string; // e.g., '1/2', '3/4', '5/6'
  harqRetries: number; // 1 to 7
  autoRecoveryEnabled: boolean;
}

export interface LiveMetrics {
  timestamp: number;
  rssi: number; // dBm (-90 to -30)
  snr: number; // dB (0 to 35)
  pdr: number; // % (0 to 100)
  latency: number; // ms (5 to 300)
  sinr: number; // dB
  jitter: number; // ms
  throughputMbps: number; // Mbps
  rawNoiseFloorDbm: number;
}

export interface AnomalyOutput {
  isAnomaly: boolean;
  anomalyScore: number; // 0 to 1.0 (s >= 0.60 is anomaly)
  threshold: number; // default 0.60
  averageDepth: number; // e.g., 3.2 vs normal 8.4
  expectedDepthNormal: number; // c(n)
  featureContributions: {
    rssi: number;
    snr: number;
    pdr: number;
    latency: number;
  };
  dominantFeature: 'rssi' | 'snr' | 'pdr' | 'latency';
}

export interface RecoveryState {
  currentAction: RecoveryActionType;
  recommendedAction: RecoveryActionType;
  linkState: LinkState;
  recoveryStartTime: number | null;
  recoveryElapsedTimeMs: number;
  lastRecoveredDurationMs: number | null;
  stepMessage: string;
}

export interface AnomalyEventRecord {
  id: string;
  timestamp: string;
  anomalyScore: number;
  dominantFeature: string;
  injectedInterference: string;
  actionTaken: RecoveryActionType;
  recoveryDurationMs: number;
  postRecoveryPdr: number;
  status: 'Recovered' | 'Manual Required' | 'Stabilized';
}
