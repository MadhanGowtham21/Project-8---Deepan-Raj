import React from 'react';
import { ChannelConfig, JammingType } from '../types/simulator';
import { Play, Pause, StepForward, Zap, Shield, Radio, Flame, Sparkles } from 'lucide-react';

interface SimulationControlsProps {
  config: ChannelConfig;
  onChangeConfig: (newConfig: Partial<ChannelConfig>) => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onStepOnce: () => void;
  simSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  onApplyPreset: (presetName: string) => void;
  activePreset: string;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  config,
  onChangeConfig,
  isRunning,
  onToggleRun,
  onStepOnce,
  simSpeed,
  onChangeSimSpeed,
  onApplyPreset,
  activePreset,
}) => {
  const jammingTypes: Array<{ type: JammingType; label: string; desc: string }> = [
    { type: 'none', label: 'None (Clean)', desc: 'Pure AWGN thermal floor' },
    { type: 'broadband_chirp', label: 'Swept Chirp', desc: 'Continuous fast chirp across 20 MHz' },
    { type: 'microwave_pulse', label: 'Microwave Pulse', desc: 'Periodic 2.45 GHz burst radiation' },
    { type: 'narrowband_tone', label: 'Narrowband Tone', desc: 'Single-carrier high power carrier' },
    { type: 'multipath_fade', label: 'Multipath Fade', desc: 'Rayleigh destructive notch + Doppler' },
  ];

  const presets = [
    { id: 'clean', name: 'Nominal Clean', icon: Sparkles, desc: 'Indoor line-of-sight AWGN' },
    { id: 'microwave', name: 'Microwave Oven', icon: Flame, desc: '2.45 GHz burst cycle interference' },
    { id: 'chirp', name: 'Swept Chirp Jammer', icon: Zap, desc: 'Wideband RF jamming barrier' },
    { id: 'multipath', name: 'Deep Rayleigh Fade', icon: Radio, desc: 'Severe multipath phase cancellation' },
    { id: 'hostile', name: 'Hostile Barrage', icon: Shield, desc: 'Full spectrum saturation + loss' },
  ];

  return (
    <section id="simulation-controls" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      {/* Header and Execution Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Simulation Controls & Interference Injection
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inject synthetic physical noise, hostile jamming signatures, and stochastic packet drop to test AI response.
          </p>
        </div>

        {/* Runtime State & Speed Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Tick Speed segmented control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            {[0.5, 1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => onChangeSimSpeed(speed)}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  simSpeed === speed
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Step Once Button */}
          <button
            onClick={onStepOnce}
            disabled={isRunning}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              isRunning
                ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs'
            }`}
            title="Advance simulation by single clock tick"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          {/* Autonomous closed-loop switch */}
          <button
            onClick={() => onChangeConfig({ autoRecoveryEnabled: !config.autoRecoveryEnabled })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
              config.autoRecoveryEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
            title="Toggle autonomous closed-loop AI adaptation vs manual operator action"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Recovery: {config.autoRecoveryEnabled ? 'Autonomous' : 'Manual'}</span>
          </button>
        </div>
      </div>

      {/* Quick Scenario Presets */}
      <div className="py-4 border-b border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
          Scenario Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {presets.map((preset) => {
            const Icon = preset.icon;
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onApplyPreset(preset.id)}
                className={`flex flex-col text-left p-2.5 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                    : 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold truncate ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>
                    {preset.name}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 line-clamp-1">{preset.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Interference Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        {/* Slider 1: AWGN Noise Power */}
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800">AWGN Noise Power ($N_0$)</span>
            <span className="text-xs font-mono font-bold text-indigo-700 tabular-nums">
              {config.awgnNoiseDbm} dBm
            </span>
          </div>
          <input
            type="range"
            min="-105"
            max="-60"
            step="1"
            value={config.awgnNoiseDbm}
            onChange={(e) => onChangeConfig({ awgnNoiseDbm: Number(e.target.value) })}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>-105 dBm (Thermal)</span>
            <span>-60 dBm (Extreme)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Thermal & ambient Gaussian noise floor over 20 MHz bandwidth.
          </p>
        </div>

        {/* Slider 2: Jamming-to-Signal Ratio (J/S) */}
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800">Jamming Ratio ($J/S$)</span>
            <span
              className={`text-xs font-mono font-bold tabular-nums ${
                config.jammingRatioDb > 5 ? 'text-rose-600' : 'text-indigo-700'
              }`}
            >
              {config.jammingRatioDb > 0 ? `+${config.jammingRatioDb}` : config.jammingRatioDb} dB
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="25"
            step="1"
            value={config.jammingRatioDb}
            onChange={(e) => onChangeConfig({ jammingRatioDb: Number(e.target.value) })}
            className="w-full accent-rose-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>-30 dB (Negligible)</span>
            <span>+25 dB (Severe J/S)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Jammer power relative to desired carrier signal at the receiver.
          </p>
        </div>

        {/* Slider 3: Injected Stochastic Packet Loss */}
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800">Injected Loss Probability (p_drop)</span>
            <span
              className={`text-xs font-mono font-bold tabular-nums ${
                config.injectedPacketLossPct > 20 ? 'text-rose-600' : 'text-indigo-700'
              }`}
            >
              {config.injectedPacketLossPct}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={config.injectedPacketLossPct}
            onChange={(e) => onChangeConfig({ injectedPacketLossPct: Number(e.target.value) })}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>0% (Lossless)</span>
            <span>90% (Near Total Loss)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Simulates MAC collision, frame CRC corruption, or buffer queue overflow.
          </p>
        </div>
      </div>

      {/* Jamming Type Waveform Selector */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
          Interference Waveform Signature
        </label>
        <div className="flex flex-wrap gap-2">
          {jammingTypes.map((jt) => (
            <button
              key={jt.type}
              onClick={() => onChangeConfig({ jammingType: jt.type })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                config.jammingType === jt.type
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title={jt.desc}
            >
              {jt.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
