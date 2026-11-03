import React from 'react';
import { RecoveryState, RecoveryActionType, ChannelConfig } from '../types/simulator';
import { Radio, RefreshCw, BarChart2, Clock, Check, ArrowRight, ShieldCheck } from 'lucide-react';

interface AdaptiveRecoveryPanelProps {
  recoveryState: RecoveryState;
  config: ChannelConfig;
  onTriggerManualAction: (action: RecoveryActionType) => void;
  isAnomaly: boolean;
}

export const AdaptiveRecoveryPanel: React.FC<AdaptiveRecoveryPanelProps> = ({
  recoveryState,
  config,
  onTriggerManualAction,
  isAnomaly,
}) => {
  const {
    currentAction,
    recommendedAction,
    linkState,
    recoveryElapsedTimeMs,
    lastRecoveredDurationMs,
    stepMessage,
  } = recoveryState;

  const actions = [
    {
      id: 'channel_switching' as RecoveryActionType,
      title: 'Channel Switching (DFS)',
      shortDesc: 'Dynamic Frequency Selection',
      detail:
        'Hops transceiver to clean orthogonal carrier (Ch 1, 11, or 5GHz Ch 36) avoiding localized RF jammer band.',
      icon: Radio,
      activeColor: 'border-indigo-500 bg-indigo-50/80 text-indigo-900',
      badgeColor: 'bg-indigo-600 text-white',
      triggerLatency: '~85-120 ms',
    },
    {
      id: 'rate_adaptation' as RecoveryActionType,
      title: 'Traffic Rate Adaptation',
      shortDesc: 'MCS Constellation Downshift',
      detail:
        'Downshifts modulation from 64-QAM to robust QPSK/BPSK (MCS 2 or 0) to maintain frame reception at low SNR.',
      icon: BarChart2,
      activeColor: 'border-sky-500 bg-sky-50/80 text-sky-900',
      badgeColor: 'bg-sky-600 text-white',
      triggerLatency: '~25-45 ms',
    },
    {
      id: 'packet_retransmission' as RecoveryActionType,
      title: 'Packet Retransmission / HARQ',
      shortDesc: 'Hybrid ARQ Redundancy Boost',
      detail:
        'Increases Chase combining retry window & Reed-Solomon FEC parity to overcome transient burst packet losses.',
      icon: RefreshCw,
      activeColor: 'border-amber-500 bg-amber-50/80 text-amber-900',
      badgeColor: 'bg-amber-600 text-white',
      triggerLatency: '~45-75 ms',
    },
  ];

  // Helper for Link State indicator
  const stateLabels: Record<string, { label: string; color: string }> = {
    nominal: { label: 'Nominal Monitoring', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    anomaly_detected: { label: 'Anomaly Flagged', color: 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse' },
    diagnosing: { label: 'Diagnosing Root Signature', color: 'text-amber-700 bg-amber-50 border-amber-300' },
    recovering: { label: 'Mitigation Executing', color: 'text-indigo-700 bg-indigo-50 border-indigo-300' },
    stabilized: { label: 'Link Stabilized & Restored', color: 'text-emerald-800 bg-emerald-50 border-emerald-300' },
  };

  return (
    <section id="adaptive-recovery" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      {/* Header and Recovery Clock */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Adaptive Link Recovery Engine
            </h2>
            <div
              className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
                stateLabels[linkState]?.color || 'text-slate-700 bg-slate-100 border-slate-200'
              }`}
            >
              {stateLabels[linkState]?.label || linkState}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Autonomous closed-loop mitigation triggered immediately upon unsupervised anomaly detection.
          </p>
        </div>

        {/* Real-time Recovery Time Counter HUD */}
        <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200/90 shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Active Recovery Timer (T_rec)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                  {recoveryElapsedTimeMs}
                </span>
                <span className="text-xs font-mono text-slate-500">ms</span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Last Recovery Latency
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-mono font-bold text-emerald-700 tabular-nums">
                {lastRecoveredDurationMs !== null ? `${lastRecoveredDurationMs} ms` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Status / Diagnostics Banner */}
      <div className="my-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong className="text-slate-900 font-semibold">Adaptive Policy: </strong>
            {stepMessage}
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500 shrink-0">
          Mode: {config.autoRecoveryEnabled ? 'Autonomous Auto-Execution' : 'Manual Trigger Enabled'}
        </span>
      </div>

      {/* 3 Dynamic Action Cards (Automatically Highlighted) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          const isTriggered = currentAction === act.id;
          const isRecommended = recommendedAction === act.id && isAnomaly;

          return (
            <div
              key={act.id}
              className={`rounded-xl border p-4 transition-all duration-300 relative flex flex-col justify-between ${
                isTriggered
                  ? `${act.activeColor} ring-2 ring-indigo-400 shadow-md`
                  : isRecommended
                  ? 'border-indigo-400 bg-indigo-50/40'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isTriggered ? act.badgeColor : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Triggered Badge or Recommended Badge */}
                  {isTriggered ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-600 text-white uppercase tracking-wider animate-pulse">
                      Active Mitigation
                    </span>
                  ) : isRecommended ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                      Optimal Candidate
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400">
                      {act.triggerLatency}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900">{act.title}</h3>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">
                  {act.shortDesc}
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {act.detail}
                </p>
              </div>

              {/* Action Control Button */}
              <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {act.id === 'channel_switching'
                    ? `Current: Ch ${config.currentChannel}`
                    : act.id === 'rate_adaptation'
                    ? `MCS ${config.currentMcs}`
                    : `HARQ ${config.harqRetries}x`}
                </span>

                <button
                  onClick={() => onTriggerManualAction(act.id)}
                  disabled={isTriggered}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    isTriggered
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {isTriggered ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3" /> Deployed
                    </span>
                  ) : (
                    'Deploy Action'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
