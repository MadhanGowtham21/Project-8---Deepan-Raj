import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChannelConfig,
  LiveMetrics,
  AnomalyOutput,
  RecoveryState,
  RecoveryActionType,
  AnomalyEventRecord,
} from './types/simulator';
import { IsolationForestSimulator } from './utils/isolationForest';
import { computeLiveRfMetrics } from './utils/rfPhysics';
import { Header } from './components/Header';
import { SimulationControls } from './components/SimulationControls';
import { FeatureExtractionVisuals } from './components/FeatureExtractionVisuals';
import { AnomalyDetectionPanel } from './components/AnomalyDetectionPanel';
import { AdaptiveRecoveryPanel } from './components/AdaptiveRecoveryPanel';
import { EventLogTable } from './components/EventLogTable';
import { TheoryModal } from './components/TheoryModal';

const DEFAULT_CONFIG: ChannelConfig = {
  txPowerDbm: 18,
  distanceMeters: 14,
  currentChannel: 6,
  bandwidthMhz: 20,
  awgnNoiseDbm: -102,
  jammingRatioDb: -25,
  jammingType: 'none',
  injectedPacketLossPct: 0,
  currentMcs: 7, // 64-QAM 5/6
  fecRate: '5/6',
  harqRetries: 1,
  autoRecoveryEnabled: true,
};

export default function App() {
  const [config, setConfig] = useState<ChannelConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [activePreset, setActivePreset] = useState<string>('clean');
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);

  // Initialize Isolation Forest engine once
  const iForestRef = useRef<IsolationForestSimulator>(new IsolationForestSimulator(40, 64, 0.60));

  // Current live telemetry metrics
  const [currentMetrics, setCurrentMetrics] = useState<LiveMetrics>(() =>
    computeLiveRfMetrics(DEFAULT_CONFIG, 0, false)
  );

  // Telemetry sliding window history (last 35 data points)
  const [history, setHistory] = useState<LiveMetrics[]>(() => {
    const initialArr: LiveMetrics[] = [];
    for (let i = 0; i < 20; i++) {
      initialArr.push(computeLiveRfMetrics(DEFAULT_CONFIG, i * 0.5, false));
    }
    return initialArr;
  });

  // Anomaly output state
  const [anomalyOutput, setAnomalyOutput] = useState<AnomalyOutput>(() =>
    iForestRef.current.detect(computeLiveRfMetrics(DEFAULT_CONFIG, 0, false))
  );

  // Adaptive Recovery State Machine
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    currentAction: 'none',
    recommendedAction: 'none',
    linkState: 'nominal',
    recoveryStartTime: null,
    recoveryElapsedTimeMs: 0,
    lastRecoveredDurationMs: null,
    stepMessage: 'Link operating in nominal steady state. Unsupervised iForest monitoring all vectors.',
  });

  // Recorded audit events
  const [events, setEvents] = useState<AnomalyEventRecord[]>([]);

  // Internal clock ticks
  const tickCountRef = useRef<number>(20);
  const recoveryTimerIntervalRef = useRef<number | null>(null);

  // Handle configuration changes
  const handleConfigChange = useCallback((newConfig: Partial<ChannelConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
    setActivePreset('custom');
  }, []);

  // Presets
  const handleApplyPreset = (presetId: string) => {
    setActivePreset(presetId);
    switch (presetId) {
      case 'clean':
        setConfig({
          ...DEFAULT_CONFIG,
          autoRecoveryEnabled: config.autoRecoveryEnabled,
        });
        setRecoveryState((prev) => ({
          ...prev,
          currentAction: 'none',
          linkState: 'nominal',
          stepMessage: 'Nominal baseline loaded. AWGN thermal floor only.',
        }));
        break;
      case 'microwave':
        setConfig((prev) => ({
          ...prev,
          jammingType: 'microwave_pulse',
          jammingRatioDb: 12,
          injectedPacketLossPct: 18,
          awgnNoiseDbm: -95,
          currentChannel: 6,
        }));
        break;
      case 'chirp':
        setConfig((prev) => ({
          ...prev,
          jammingType: 'broadband_chirp',
          jammingRatioDb: 16,
          injectedPacketLossPct: 25,
          awgnNoiseDbm: -92,
          currentChannel: 6,
        }));
        break;
      case 'multipath':
        setConfig((prev) => ({
          ...prev,
          jammingType: 'multipath_fade',
          jammingRatioDb: -5,
          injectedPacketLossPct: 35,
          awgnNoiseDbm: -98,
          currentChannel: 6,
        }));
        break;
      case 'hostile':
        setConfig((prev) => ({
          ...prev,
          jammingType: 'broadband_chirp',
          jammingRatioDb: 22,
          injectedPacketLossPct: 45,
          awgnNoiseDbm: -85,
          currentChannel: 6,
        }));
        break;
    }
  };

  // Manual Trigger of Recovery Action
  const handleTriggerManualAction = (action: RecoveryActionType) => {
    executeRecoveryAction(action);
  };

  // Core execution of a recovery mitigation action
  const executeRecoveryAction = (action: RecoveryActionType) => {
    const actionStartTime = Date.now();

    setRecoveryState((prev) => ({
      ...prev,
      currentAction: action,
      linkState: 'recovering',
      stepMessage: `Executing ${action.replace('_', ' ')} policy...`,
    }));

    if (action === 'channel_switching') {
      // Hop to orthogonal channel 1 or 5GHz 36
      const targetChannel = config.currentChannel === 6 ? 1 : config.currentChannel === 1 ? 11 : 36;
      setTimeout(() => {
        setConfig((prev) => ({
          ...prev,
          currentChannel: targetChannel,
        }));
        finishRecovery('channel_switching', 95 + Math.floor(Math.random() * 25));
      }, 120);
    } else if (action === 'rate_adaptation') {
      // Downshift MCS to QPSK (MCS 2) or BPSK (MCS 0)
      setTimeout(() => {
        setConfig((prev) => ({
          ...prev,
          currentMcs: 2,
          fecRate: '3/4',
        }));
        finishRecovery('rate_adaptation', 32 + Math.floor(Math.random() * 15));
      }, 60);
    } else if (action === 'packet_retransmission') {
      // Boost HARQ retries and FEC
      setTimeout(() => {
        setConfig((prev) => ({
          ...prev,
          harqRetries: 4,
          injectedPacketLossPct: Math.max(0, prev.injectedPacketLossPct - 25),
        }));
        finishRecovery('packet_retransmission', 55 + Math.floor(Math.random() * 20));
      }, 80);
    }
  };

  // Wrap up recovery and record audit log
  const finishRecovery = (action: RecoveryActionType, simulatedDurationMs: number) => {
    setRecoveryState((prev) => ({
      ...prev,
      linkState: 'stabilized',
      lastRecoveredDurationMs: simulatedDurationMs,
      recoveryElapsedTimeMs: simulatedDurationMs,
      stepMessage: `Link successfully stabilized via ${action.replace('_', ' ')} in ${simulatedDurationMs} ms.`,
    }));

    // Add entry to Event Log
    const newRecord: AnomalyEventRecord = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
      anomalyScore: anomalyOutput.anomalyScore,
      dominantFeature: anomalyOutput.dominantFeature,
      injectedInterference:
        config.jammingType !== 'none'
          ? `${config.jammingType.replace('_', ' ')} (${config.jammingRatioDb > 0 ? '+' : ''}${config.jammingRatioDb}dB)`
          : `Excess AWGN (${config.awgnNoiseDbm}dBm)`,
      actionTaken: action,
      recoveryDurationMs: simulatedDurationMs,
      postRecoveryPdr: 98.4,
      status: 'Recovered',
    };

    setEvents((prev) => [newRecord, ...prev.slice(0, 49)]);

    // Reset back to nominal monitoring after 4 seconds
    setTimeout(() => {
      setRecoveryState((prev) => ({
        ...prev,
        linkState: 'nominal',
        currentAction: 'none',
        stepMessage: 'Closed-loop link restored. Continuous unsupervised monitoring active.',
      }));
    }, 4000);
  };

  // Single step of the simulation clock
  const runSimulationTick = useCallback(() => {
    tickCountRef.current += 1;
    const elapsedSec = tickCountRef.current * 0.5;

    // Is the link currently benefiting from a recovery action?
    const isRecovered =
      recoveryState.currentAction === 'channel_switching' && config.currentChannel !== 6;

    // 1. Calculate live physical metrics
    const metrics = computeLiveRfMetrics(config, elapsedSec, isRecovered);
    setCurrentMetrics(metrics);

    // 2. Append to streaming history
    setHistory((prev) => {
      const next = [...prev.slice(1), metrics];
      return next;
    });

    // 3. Run unsupervised Isolation Forest anomaly detection
    const output = iForestRef.current.detect(metrics);
    setAnomalyOutput(output);

    // 4. Closed-loop Anomaly to Recovery Transition
    if (output.isAnomaly) {
      // Determine optimal recovery action based on dominant feature signature
      let recommended: RecoveryActionType = 'channel_switching';
      if (output.dominantFeature === 'rssi' || config.jammingType !== 'none') {
        recommended = 'channel_switching';
      } else if (output.dominantFeature === 'snr' || config.awgnNoiseDbm > -90) {
        recommended = 'rate_adaptation';
      } else if (output.dominantFeature === 'pdr' || config.injectedPacketLossPct > 20) {
        recommended = 'packet_retransmission';
      }

      setRecoveryState((prev) => {
        if (prev.linkState === 'nominal') {
          return {
            ...prev,
            linkState: 'anomaly_detected',
            recommendedAction: recommended,
            recoveryStartTime: Date.now(),
            recoveryElapsedTimeMs: 15,
            stepMessage: `Anomaly detected (Score: ${output.anomalyScore.toFixed(3)}). Dominant: ${
              output.dominantFeature.toUpperCase()
            }. Autonomous mitigation triggered.`,
          };
        }
        return prev;
      });

      // If autonomous mode is enabled, immediately trigger the mitigation action
      if (
        config.autoRecoveryEnabled &&
        recoveryState.linkState === 'anomaly_detected' &&
        recoveryState.currentAction === 'none'
      ) {
        executeRecoveryAction(recommended);
      }
    } else {
      // Normal state
      if (recoveryState.linkState === 'nominal' && recoveryState.currentAction === 'none') {
        setRecoveryState((prev) => ({
          ...prev,
          recommendedAction: 'none',
          stepMessage: 'Unsupervised iForest verifying normal multi-dimensional telemetry cluster.',
        }));
      }
    }
  }, [config, recoveryState.linkState, recoveryState.currentAction]);

  // Main simulation interval
  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = Math.max(100, Math.floor(500 / simSpeed));
    const timer = setInterval(() => {
      runSimulationTick();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, simSpeed, runSimulationTick]);

  // Active recovery time counter effect
  useEffect(() => {
    if (
      (recoveryState.linkState === 'anomaly_detected' ||
        recoveryState.linkState === 'recovering') &&
      recoveryState.recoveryStartTime
    ) {
      const timer = setInterval(() => {
        setRecoveryState((prev) => {
          if (!prev.recoveryStartTime) return prev;
          const elapsed = Date.now() - prev.recoveryStartTime;
          return {
            ...prev,
            recoveryElapsedTimeMs: elapsed,
          };
        });
      }, 25);
      return () => clearInterval(timer);
    }
  }, [recoveryState.linkState, recoveryState.recoveryStartTime]);

  // Reset to Baseline
  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setActivePreset('clean');
    iForestRef.current.setThreshold(0.60);
    setRecoveryState({
      currentAction: 'none',
      recommendedAction: 'none',
      linkState: 'nominal',
      recoveryStartTime: null,
      recoveryElapsedTimeMs: 0,
      lastRecoveredDurationMs: null,
      stepMessage: 'System reset to nominal baseline operating conditions.',
    });
  };

  // Export CSV
  const handleExportCsv = () => {
    if (events.length === 0) {
      alert('No anomaly events recorded in this session yet.');
      return;
    }

    const headers = [
      'EventID',
      'Timestamp',
      'AnomalyScore',
      'DominantFeature',
      'InterferenceSignature',
      'ActionTaken',
      'RecoveryDurationMs',
      'PostRecoveryPdrPct',
      'Status',
    ];

    const rows = events.map((ev) => [
      ev.id,
      `"${ev.timestamp}"`,
      ev.anomalyScore,
      `"${ev.dominantFeature}"`,
      `"${ev.injectedInterference}"`,
      `"${ev.actionTaken}"`,
      ev.recoveryDurationMs,
      ev.postRecoveryPdr,
      `"${ev.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `wireless_anomaly_telemetry_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Bar Header */}
      <Header
        onReset={handleReset}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onExportCsv={handleExportCsv}
        isRunning={isRunning}
        onToggleRun={() => setIsRunning(!isRunning)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Project Intro / Engineering Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
              <span>ME Research Engineering Simulator</span>
              <span aria-hidden="true">·</span>
              <span>Wireless RF & Machine Learning</span>
              <span aria-hidden="true">·</span>
              <span>802.11 / Sub-GHz ISM Bands</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Unsupervised AI-Based Wireless Interference Detection and Adaptive Link Recovery
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Real-time closed-loop simulation platform coupling cross-layer RF feature extraction (RSSI, SNR, PDR, Latency),
              randomized Isolation Forest outlier scoring, and autonomous mitigation policies (DFS Channel Switching, Rate Adaptation, and HARQ).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsTheoryOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors whitespace-nowrap"
            >
              Formulations & Equations
            </button>
          </div>
        </div>

        {/* 1. Simulation Controls (Data Generation) */}
        <SimulationControls
          config={config}
          onChangeConfig={handleConfigChange}
          isRunning={isRunning}
          onToggleRun={() => setIsRunning(!isRunning)}
          onStepOnce={runSimulationTick}
          simSpeed={simSpeed}
          onChangeSimSpeed={setSimSpeed}
          onApplyPreset={handleApplyPreset}
          activePreset={activePreset}
        />

        {/* 2. Feature Extraction Visuals (Live Chart.js & Spectrum) */}
        <FeatureExtractionVisuals
          currentMetrics={currentMetrics}
          history={history}
          config={config}
          isAnomaly={anomalyOutput.isAnomaly}
        />

        {/* 3. Unsupervised Anomaly Detection (Isolation Forest Model) */}
        <AnomalyDetectionPanel
          anomalyOutput={anomalyOutput}
          onThresholdChange={(newTh) => {
            iForestRef.current.setThreshold(newTh);
            setAnomalyOutput((prev) => ({
              ...prev,
              threshold: newTh,
              isAnomaly: prev.anomalyScore >= newTh,
            }));
          }}
        />

        {/* 4. Adaptive Link Recovery Strategy Panel */}
        <AdaptiveRecoveryPanel
          recoveryState={recoveryState}
          config={config}
          onTriggerManualAction={handleTriggerManualAction}
          isAnomaly={anomalyOutput.isAnomaly}
        />

        {/* 5. Telemetry & Anomaly Event Log Table */}
        <EventLogTable
          events={events}
          onClearLogs={() => setEvents([])}
          onExportCsv={handleExportCsv}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Wireless Interference Detection & Adaptive Recovery Simulator · Master of Engineering Research
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Ensemble: 40 iTrees · Subsample: 64 · Bandwidth: 20 MHz
          </span>
        </div>
      </footer>

      {/* Theory & Mathematical Formulations Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
}
