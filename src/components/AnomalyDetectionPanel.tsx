import React from 'react';
import { AnomalyOutput } from '../types/simulator';
import { AlertTriangle, CheckCircle2, Sliders, GitBranch, ShieldAlert } from 'lucide-react';

interface AnomalyDetectionPanelProps {
  anomalyOutput: AnomalyOutput;
  onThresholdChange: (newThreshold: number) => void;
}

export const AnomalyDetectionPanel: React.FC<AnomalyDetectionPanelProps> = ({
  anomalyOutput,
  onThresholdChange,
}) => {
  const {
    isAnomaly,
    anomalyScore,
    threshold,
    averageDepth,
    expectedDepthNormal,
    featureContributions,
    dominantFeature,
  } = anomalyOutput;

  // Format feature labels for display
  const featureNames: Record<string, string> = {
    rssi: 'RSSI Deviation',
    snr: 'SNR / SINR Collapse',
    pdr: 'Packet Loss Drop',
    latency: 'Latency / Jitter Spike',
  };

  return (
    <section
      id="anomaly-detection"
      className={`rounded-xl border transition-all duration-300 p-5 ${
        isAnomaly
          ? 'bg-rose-50/70 border-rose-400 glow-alert'
          : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      {/* Top Banner / Status Alert Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isAnomaly
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-200'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {isAnomaly ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Unsupervised Anomaly Detection · Isolation Forest Engine
              </h2>
              {/* Main Status Badge */}
              <div
                className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${
                  isAnomaly
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isAnomaly ? 'Anomaly Detected' : 'Normal State'}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multidimensional space partitioning via randomized binary isolation trees ($t=40, \psi=64$).
            </p>
          </div>
        </div>

        {/* Real-time Decision Threshold Slider */}
        <div className="flex items-center gap-3 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-500 font-medium">Decision Threshold ($\tau$)</span>
              <span className="font-mono font-bold text-slate-800">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.40"
              max="0.80"
              step="0.02"
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-28 accent-indigo-600 cursor-pointer h-1.5"
            />
          </div>
        </div>
      </div>

      {/* Main AI Model Diagnostics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-4">
        {/* Column 1: Anomaly Score Gauge & Formula */}
        <div className="bg-white/90 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span className="font-bold">Anomaly Score $s(x, n)$</span>
              <span className="font-mono font-bold text-xs text-slate-500">
                Score Range: [0.0 - 1.0]
              </span>
            </div>

            {/* Big Score Readout */}
            <div className="flex items-baseline gap-2 my-2">
              <span
                className={`text-3xl font-extrabold font-mono tabular-nums ${
                  isAnomaly ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {anomalyScore.toFixed(3)}
              </span>
              <span className="text-xs font-mono text-slate-400">
                / 1.000 ({anomalyScore >= threshold ? 'Anomaly' : 'Inlier'})
              </span>
            </div>

            {/* Score Progress Bar with Threshold Needle */}
            <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isAnomaly ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, anomalyScore * 100))}%` }}
              />
            </div>
            {/* Threshold marker */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0.00 (Inlier)</span>
              <span className="text-indigo-600 font-bold">
                Threshold: {threshold.toFixed(2)}
              </span>
              <span>1.00 (Outlier)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
            Mathematical model: s(x, n) = 2^(-E(h(x)) / c(n)). When average tree depth is shallow, s &rarr; 1.
          </div>
        </div>

        {/* Column 2: Isolation Tree Depth Metric */}
        <div className="bg-white/90 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span className="font-bold flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                Average Tree Depth $E(h(x))$
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                $c(n)$ = {expectedDepthNormal}
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span
                className={`text-3xl font-extrabold font-mono tabular-nums ${
                  isAnomaly ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {averageDepth.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-slate-500">
                splits (Norm: ~{expectedDepthNormal})
              </span>
            </div>

            {/* Depth Comparison Bars */}
            <div className="space-y-1.5 mt-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                  <span>Current Sample Depth</span>
                  <span className="font-mono font-bold">{averageDepth.toFixed(2)}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isAnomaly ? 'bg-rose-500' : 'bg-slate-700'
                    }`}
                    style={{ width: `${Math.min(100, (averageDepth / 8) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                  <span>Expected Depth for BST Search $c(n)$</span>
                  <span className="font-mono">{expectedDepthNormal.toFixed(2)}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-300"
                    style={{ width: `${Math.min(100, (expectedDepthNormal / 8) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
            {isAnomaly
              ? 'Rapid isolation occurred: Point isolated in few splits due to sparse abnormal region.'
              : 'Nominal clustering: Point requires multiple partitions, indicating high density.'}
          </div>
        </div>

        {/* Column 3: Feature Contribution / Attribution Breakdown */}
        <div className="bg-white/90 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="font-bold">Feature Anomaly Contribution</span>
              <span className="text-[10px] text-slate-400 font-mono">
                Primary: {featureNames[dominantFeature] || dominantFeature}
              </span>
            </div>

            {/* Contribution Bars for 4 Features */}
            <div className="space-y-2">
              {Object.entries(featureContributions).map(([feat, value]) => {
                const pct = Math.round(value * 100);
                const isDominant = feat === dominantFeature && isAnomaly;
                return (
                  <div key={feat}>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                      <span className={isDominant ? 'font-bold text-rose-600' : ''}>
                        {featureNames[feat]}
                      </span>
                      <span className="font-mono font-bold text-slate-700">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isDominant
                            ? 'bg-rose-500'
                            : feat === 'snr'
                            ? 'bg-sky-500'
                            : feat === 'pdr'
                            ? 'bg-emerald-500'
                            : feat === 'latency'
                            ? 'bg-orange-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span>Ensemble: 40 Trees</span>
            <span>Subsample: 64 samples</span>
          </div>
        </div>
      </div>
    </section>
  );
};
