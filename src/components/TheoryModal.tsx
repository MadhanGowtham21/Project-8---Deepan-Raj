import React from 'react';
import { X, BookOpen, Cpu, Radio, Shield, Zap } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ME Project Theoretical Foundations & Mathematical Formulations
              </h2>
              <p className="text-xs text-slate-500">
                Unsupervised AI-Based Wireless Interference Detection and Adaptive Link Recovery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed font-sans">
          {/* Section 1: Abstract & Problem Statement */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              1. Engineering Motivation & Problem Formulation
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              In contemporary dense wireless networks (e.g. 802.11ax/be, 5G NR-U, tactile IoT), wireless links in unlicensed ISM/UNII spectrum bands (2.4 GHz and 5 GHz) suffer from severe, unpredictable cross-technology interference, intentional swept-frequency RF jamming, and industrial microwave radiation. Traditional static rule-based thresholds fail because:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 mt-2 space-y-1 ml-1">
              <li>High jamming signals increase overall RSSI while severely collapsing SINR and PDR.</li>
              <li>Static RSSI triggers false-positives under normal mobility and multipath shadow fading.</li>
              <li>Unsupervised anomaly detection eliminates the need for expensive labeled jamming datasets.</li>
            </ul>
          </div>

          {/* Section 2: Isolation Forest Mathematical Formulation */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              2. Isolation Forest (iForest) Mathematical Derivation
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              The Isolation Forest algorithm isolates anomalies rather than profiling normal data points. It constructs an ensemble of t randomized isolation trees (iTrees) on a subsample X of size ψ = 64.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {/* Formula A: c(n) */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-[11px] font-bold text-slate-800 mb-1">
                  BST Average Path Length Normalizer $c(n)$:
                </div>
                <div className="font-mono text-xs text-indigo-900 bg-white p-2 rounded border border-slate-200">
                  c(n) = 2 · [ ln(n - 1) + γ ] - [ 2 · (n - 1) / n ]
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5">
                  Where $\gamma \approx 0.5772156649$ is the Euler-Mascheroni constant and $n = \psi$ is subsample size.
                </div>
              </div>

              {/* Formula B: s(x, n) */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-[11px] font-bold text-slate-800 mb-1">
                  Ensemble Anomaly Score s(x, n):
                </div>
                <div className="font-mono text-xs text-indigo-900 bg-white p-2 rounded border border-slate-200">
                  {'s(x, n) = 2^[ - E(h(x)) / c(n) ]'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5">
                  Where E(h(x)) is the expectation of path lengths h(x) across all t=40 randomized isolation trees.
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong>Boundary Properties:</strong>
              </p>
              <ul className="list-disc list-inside ml-2 space-y-0.5 text-xs text-slate-600">
                <li>If E(h(x)) &rarr; 0, s &rarr; 1: Sample isolates in 1–3 splits &implies; <strong>Confirmed Anomaly</strong>.</li>
                <li>If E(h(x)) &rarr; c(n), s &rarr; 0.5: Sample path length equals average BST depth &implies; <strong>Nominal Behavior</strong>.</li>
                <li>If E(h(x)) &rarr; n-1, s &rarr; 0: Deeply clustered in dense central manifold &implies; <strong>Safe Inlier</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Wireless RF Physical Layer Models */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              3. Wireless Physical Layer Propagation & Capacity Equations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">Shannon-Hartley Channel Capacity:</div>
                <div className="font-mono text-xs text-indigo-900 bg-white p-2 rounded border border-slate-200">
                  C = B · log₂( 1 + SINR_lin )
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  B = 20 MHz, SINR = P_rx / (I_jam + N_0 · B)
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">Log-Distance Path Loss with Shadowing:</div>
                <div className="font-mono text-xs text-indigo-900 bg-white p-2 rounded border border-slate-200">
                  PL(d) = PL(d₀) + 10γ log₁₀(d / d₀) + X_σ
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  γ = 2.8 path loss exponent, X_σ ~ N(0, σ²) log-normal shadow fading.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Adaptive Link Recovery Policy Matrix */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              4. Closed-Loop Recovery Decision Matrix
            </h3>
            <table className="w-full text-xs text-left border-collapse border border-slate-200 bg-white rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  <th className="p-2 border border-slate-200">Interference Signature</th>
                  <th className="p-2 border border-slate-200">Isolated Metric</th>
                  <th className="p-2 border border-slate-200">Adaptive Policy</th>
                  <th className="p-2 border border-slate-200">Target Metric Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="p-2 border border-slate-200 font-medium">Narrowband / Swept Jammer</td>
                  <td className="p-2 border border-slate-200">RSSI Spike + SINR Collapse</td>
                  <td className="p-2 border border-slate-200 font-semibold text-indigo-700">Channel Switching (DFS)</td>
                  <td className="p-2 border border-slate-200">Drops in-band jammer power by &gt;35 dB</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200 font-medium">Elevated AWGN / Noise Floor</td>
                  <td className="p-2 border border-slate-200">SINR &lt; MCS Min Threshold</td>
                  <td className="p-2 border border-slate-200 font-semibold text-sky-700">MCS Downshift (Rate Adapt)</td>
                  <td className="p-2 border border-slate-200">Reduces required SNR threshold to 4-8 dB</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200 font-medium">Microwave Burst / Packet Drop</td>
                  <td className="p-2 border border-slate-200">PDR Drop &lt; 90%</td>
                  <td className="p-2 border border-slate-200 font-semibold text-amber-700">HARQ Retransmit & FEC Boost</td>
                  <td className="p-2 border border-slate-200">Chase combining repairs corrupted frames</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 shrink-0">
          <span className="text-xs text-slate-500">
            Wireless RF Signal Processing & Machine Learning Lab · Master of Engineering Research
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close Theory Guide
          </button>
        </div>
      </div>
    </div>
  );
};
