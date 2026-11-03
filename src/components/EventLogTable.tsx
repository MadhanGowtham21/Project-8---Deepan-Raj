import React, { useState } from 'react';
import { AnomalyEventRecord } from '../types/simulator';
import { Download, Filter, Trash2, Database } from 'lucide-react';

interface EventLogTableProps {
  events: AnomalyEventRecord[];
  onClearLogs: () => void;
  onExportCsv: () => void;
}

export const EventLogTable: React.FC<EventLogTableProps> = ({
  events,
  onClearLogs,
  onExportCsv,
}) => {
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredEvents = events.filter((e) => {
    if (filterAction === 'all') return true;
    return e.actionTaken === filterAction;
  });

  const actionLabels: Record<string, string> = {
    channel_switching: 'Channel Switch',
    rate_adaptation: 'Rate Adaptation',
    packet_retransmission: 'HARQ Retransmit',
    none: 'None',
  };

  return (
    <section id="event-log" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            Anomaly Event & Adaptive Recovery Audit Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical log of detected outliers, iForest path lengths, executed mitigation actions, and stabilization latency.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Actions ({events.length})</option>
              <option value="channel_switching">Channel Switching</option>
              <option value="rate_adaptation">Rate Adaptation</option>
              <option value="packet_retransmission">Packet Retransmission</option>
            </select>
          </div>

          <button
            onClick={onClearLogs}
            disabled={events.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40"
            title="Clear event logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            onClick={onExportCsv}
            disabled={events.length === 0}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="mt-4 overflow-x-auto">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No anomaly events recorded yet. Increase Jamming or Noise sliders to trigger unsupervised detection.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Anomaly Score $s$</th>
                <th className="py-2.5 px-3">Dominant Feature</th>
                <th className="py-2.5 px-3">Interference</th>
                <th className="py-2.5 px-3">Triggered Recovery</th>
                <th className="py-2.5 px-3">Recovery Latency</th>
                <th className="py-2.5 px-3">Post PDR</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    {ev.timestamp}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-rose-600 tabular-nums">
                    {ev.anomalyScore.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 font-sans font-medium">
                    {ev.dominantFeature.toUpperCase()}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-sans">
                    {ev.injectedInterference}
                  </td>
                  <td className="py-2.5 px-3 text-indigo-700 font-sans font-semibold">
                    {actionLabels[ev.actionTaken] || ev.actionTaken}
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 tabular-nums">
                    {ev.recoveryDurationMs} ms
                  </td>
                  <td className="py-2.5 px-3 text-emerald-600 font-bold tabular-nums">
                    {ev.postRecoveryPdr}%
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-sans text-[11px] font-bold ${
                        ev.status === 'Recovered'
                          ? 'text-emerald-700'
                          : ev.status === 'Stabilized'
                          ? 'text-indigo-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
