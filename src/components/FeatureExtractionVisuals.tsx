import React, { useEffect, useRef } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { LiveMetrics, ChannelConfig } from '../types/simulator';
import { WIFI_CHANNELS } from '../utils/rfPhysics';
import { Activity, Radio, Cpu, ArrowUpDown } from 'lucide-react';

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);

interface FeatureExtractionVisualsProps {
  currentMetrics: LiveMetrics;
  history: LiveMetrics[];
  config: ChannelConfig;
  isAnomaly: boolean;
}

export const FeatureExtractionVisuals: React.FC<FeatureExtractionVisualsProps> = ({
  currentMetrics,
  history,
  config,
  isAnomaly,
}) => {
  const rssiCanvasRef = useRef<HTMLCanvasElement>(null);
  const snrCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdrCanvasRef = useRef<HTMLCanvasElement>(null);
  const latencyCanvasRef = useRef<HTMLCanvasElement>(null);

  const rssiChartRef = useRef<Chart | null>(null);
  const snrChartRef = useRef<Chart | null>(null);
  const pdrChartRef = useRef<Chart | null>(null);
  const latencyChartRef = useRef<Chart | null>(null);

  // Common chart options for smooth, high-fidelity real-time telemetry
  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 250,
      easing: 'linear' as const,
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 4,
      },
      line: {
        tension: 0.35,
        borderWidth: 2,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 10, family: 'JetBrains Mono' },
        bodyFont: { size: 11, family: 'JetBrains Mono' },
        padding: 6,
        displayColors: false,
      },
    },
    scales: {
      x: {
        display: false,
        grid: { display: false },
      },
      y: {
        ticks: {
          font: { size: 10, family: 'JetBrains Mono' },
          color: '#64748b',
          maxTicksLimit: 4,
        },
        grid: {
          color: '#f1f5f9',
        },
      },
    },
  };

  // Initialize and update charts
  useEffect(() => {
    const labels = history.map((_, i) => `${i}s`);

    // 1. RSSI Chart
    if (rssiCanvasRef.current) {
      if (!rssiChartRef.current) {
        rssiChartRef.current = new Chart(rssiCanvasRef.current, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'RSSI (dBm)',
                data: history.map((h) => h.rssi),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                fill: true,
              },
            ],
          },
          options: {
            ...baseChartOptions,
            scales: {
              ...baseChartOptions.scales,
              y: {
                ...baseChartOptions.scales.y,
                min: -90,
                max: -30,
              },
            },
          },
        });
      } else {
        rssiChartRef.current.data.labels = labels;
        rssiChartRef.current.data.datasets[0].data = history.map((h) => h.rssi);
        rssiChartRef.current.update('none');
      }
    }

    // 2. SNR / SINR Chart
    if (snrCanvasRef.current) {
      if (!snrChartRef.current) {
        snrChartRef.current = new Chart(snrCanvasRef.current, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'SINR (dB)',
                data: history.map((h) => h.snr),
                borderColor: '#0284c7',
                backgroundColor: 'rgba(2, 132, 199, 0.08)',
                fill: true,
              },
            ],
          },
          options: {
            ...baseChartOptions,
            scales: {
              ...baseChartOptions.scales,
              y: {
                ...baseChartOptions.scales.y,
                min: -5,
                max: 35,
              },
            },
          },
        });
      } else {
        snrChartRef.current.data.labels = labels;
        snrChartRef.current.data.datasets[0].data = history.map((h) => h.snr);
        snrChartRef.current.update('none');
      }
    }

    // 3. PDR Chart
    if (pdrCanvasRef.current) {
      if (!pdrChartRef.current) {
        pdrChartRef.current = new Chart(pdrCanvasRef.current, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'PDR (%)',
                data: history.map((h) => h.pdr),
                borderColor: isAnomaly ? '#e11d48' : '#059669',
                backgroundColor: isAnomaly ? 'rgba(225, 29, 72, 0.08)' : 'rgba(5, 150, 105, 0.08)',
                fill: true,
              },
            ],
          },
          options: {
            ...baseChartOptions,
            scales: {
              ...baseChartOptions.scales,
              y: {
                ...baseChartOptions.scales.y,
                min: 0,
                max: 100,
              },
            },
          },
        });
      } else {
        pdrChartRef.current.data.labels = labels;
        pdrChartRef.current.data.datasets[0].data = history.map((h) => h.pdr);
        pdrChartRef.current.data.datasets[0].borderColor = isAnomaly ? '#e11d48' : '#059669';
        pdrChartRef.current.data.datasets[0].backgroundColor = isAnomaly
          ? 'rgba(225, 29, 72, 0.08)'
          : 'rgba(5, 150, 105, 0.08)';
        pdrChartRef.current.update('none');
      }
    }

    // 4. Latency Chart
    if (latencyCanvasRef.current) {
      if (!latencyChartRef.current) {
        latencyChartRef.current = new Chart(latencyCanvasRef.current, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Latency (ms)',
                data: history.map((h) => h.latency),
                borderColor: '#ea580c',
                backgroundColor: 'rgba(234, 88, 12, 0.08)',
                fill: true,
              },
            ],
          },
          options: {
            ...baseChartOptions,
            scales: {
              ...baseChartOptions.scales,
              y: {
                ...baseChartOptions.scales.y,
                min: 0,
                max: 200,
              },
            },
          },
        });
      } else {
        latencyChartRef.current.data.labels = labels;
        latencyChartRef.current.data.datasets[0].data = history.map((h) => h.latency);
        latencyChartRef.current.update('none');
      }
    }
  }, [history, isAnomaly]);

  // Clean up charts on unmount
  useEffect(() => {
    return () => {
      rssiChartRef.current?.destroy();
      snrChartRef.current?.destroy();
      pdrChartRef.current?.destroy();
      latencyChartRef.current?.destroy();
    };
  }, []);

  return (
    <section id="feature-telemetry" className="space-y-4">
      {/* Real-time Engineering KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: RSSI */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>RSSI Power</span>
            <span className="text-[10px] font-mono text-slate-400">dBm</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {currentMetrics.rssi}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>Noise: {currentMetrics.rawNoiseFloorDbm} dBm</span>
          </div>
        </div>

        {/* Metric 2: SNR */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>SINR Ratio</span>
            <span className="text-[10px] font-mono text-slate-400">dB</span>
          </div>
          <div
            className={`text-xl font-bold font-mono tabular-nums ${
              currentMetrics.snr < 10 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {currentMetrics.snr > 0 ? `+${currentMetrics.snr}` : currentMetrics.snr}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            <span>MCS Req: &gt;11 dB</span>
          </div>
        </div>

        {/* Metric 3: PDR */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Packet Delivery (PDR)</span>
            <span className="text-[10px] font-mono text-slate-400">%</span>
          </div>
          <div
            className={`text-xl font-bold font-mono tabular-nums ${
              currentMetrics.pdr < 90 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {currentMetrics.pdr}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            <span>Target QoS: &ge;95%</span>
          </div>
        </div>

        {/* Metric 4: Latency */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Round-Trip Latency</span>
            <span className="text-[10px] font-mono text-slate-400">ms</span>
          </div>
          <div
            className={`text-xl font-bold font-mono tabular-nums ${
              currentMetrics.latency > 50 ? 'text-amber-600' : 'text-slate-900'
            }`}
          >
            {currentMetrics.latency}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            <span>Jitter: {currentMetrics.jitter} ms</span>
          </div>
        </div>

        {/* Metric 5: Shannon Capacity / Throughput */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Link Throughput</span>
            <span className="text-[10px] font-mono text-slate-400">Mbps</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-indigo-600">
            {currentMetrics.throughputMbps}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            <span>BW: 20 MHz</span>
          </div>
        </div>

        {/* Metric 6: Channel & Modulation */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Active Carrier</span>
            <span className="text-[10px] font-mono text-slate-400">Ch {config.currentChannel}</span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            MCS {config.currentMcs} · {config.fecRate}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>HARQ Retries: {config.harqRetries}x</span>
          </div>
        </div>
      </div>

      {/* 4 Real-time Animated Chart.js Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chart 1: RSSI */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              RSSI Signal Strength
            </span>
            <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
              {currentMetrics.rssi} dBm
            </span>
          </div>
          <div className="h-32 w-full relative">
            <canvas ref={rssiCanvasRef} />
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 text-right">
            Nominal Range: -58 to -48 dBm
          </span>
        </div>

        {/* Chart 2: SNR / SINR */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Signal-to-Noise Ratio (SINR)
            </span>
            <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
              {currentMetrics.snr} dB
            </span>
          </div>
          <div className="h-32 w-full relative">
            <canvas ref={snrCanvasRef} />
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 text-right">
            Modulation Cutoff: 11 dB (QPSK)
          </span>
        </div>

        {/* Chart 3: Packet Delivery Ratio (PDR) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${isAnomaly ? 'bg-rose-500' : 'bg-emerald-500'}`}
              />
              Packet Delivery Ratio (PDR)
            </span>
            <span
              className={`text-xs font-mono font-bold tabular-nums ${
                currentMetrics.pdr < 90 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {currentMetrics.pdr}%
            </span>
          </div>
          <div className="h-32 w-full relative">
            <canvas ref={pdrCanvasRef} />
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 text-right">
            QoS Failure Threshold: &lt; 90%
          </span>
        </div>

        {/* Chart 4: Latency */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Round-Trip Latency
            </span>
            <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
              {currentMetrics.latency} ms
            </span>
          </div>
          <div className="h-32 w-full relative">
            <canvas ref={latencyCanvasRef} />
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 text-right">
            Baseline: 11-15 ms · MAC Retries
          </span>
        </div>
      </div>

      {/* RF Spectrum Occupancy & Dynamic Channel Map */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-indigo-600" />
              RF Spectrum Channel Map & Interference Footprint
            </h3>
            <p className="text-[11px] text-slate-500">
              Orthogonal carrier channels across 2.4 GHz ISM and 5 GHz UNII bands.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500 inline-block" />
              <span className="text-slate-600">Active Link</span>
            </div>
            {config.jammingType !== 'none' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                <span className="text-slate-600">Jamming Spike</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
              <span className="text-slate-600">Idle Channels</span>
            </div>
          </div>
        </div>

        {/* Channel Spectrum Visual Bars */}
        <div className="grid grid-cols-5 gap-2.5">
          {WIFI_CHANNELS.map((ch) => {
            const isActive = config.currentChannel === ch.ch;
            const isJammingTarget = ch.ch === 6 && config.jammingType !== 'none';
            return (
              <div
                key={ch.ch}
                className={`p-3 rounded-lg border text-center transition-all ${
                  isActive
                    ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-200'
                    : isJammingTarget
                    ? 'bg-rose-50/70 border-rose-300'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">
                  Channel {ch.ch}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {ch.freq} MHz
                </div>

                {/* Simulated Spectrum Power Indicator */}
                <div className="mt-2 h-10 w-full flex items-end justify-center gap-0.5 bg-white/70 rounded p-1 border border-slate-100">
                  {[-2, -1, 0, 1, 2].map((subOffset) => {
                    let heightPct = 15;
                    if (isActive) heightPct += 55 - Math.abs(subOffset) * 12;
                    if (isJammingTarget) heightPct += 30 + Math.random() * 20;
                    heightPct = Math.min(100, Math.max(10, heightPct));

                    return (
                      <div
                        key={subOffset}
                        style={{ height: `${heightPct}%` }}
                        className={`w-2 rounded-t transition-all duration-300 ${
                          isActive && isJammingTarget
                            ? 'bg-rose-500'
                            : isActive
                            ? 'bg-indigo-500'
                            : isJammingTarget
                            ? 'bg-rose-400'
                            : 'bg-slate-200'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="mt-1.5 text-[10px] font-semibold">
                  {isActive && isJammingTarget ? (
                    <span className="text-rose-600 font-bold">Interfered Link</span>
                  ) : isActive ? (
                    <span className="text-indigo-600 font-bold">Active Link</span>
                  ) : isJammingTarget ? (
                    <span className="text-rose-500">Jamming Burst</span>
                  ) : (
                    <span className="text-slate-400">Clean / Available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
