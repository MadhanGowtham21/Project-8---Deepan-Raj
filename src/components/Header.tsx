import React from 'react';
import { Radio, RotateCcw, BookOpen, Download } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenTheory: () => void;
  onExportCsv: () => void;
  isRunning: boolean;
  onToggleRun: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onOpenTheory,
  onExportCsv,
  isRunning,
  onToggleRun,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-slate-200">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
          <Radio className="w-4 h-4" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900">
          WirelessRF Adaptive Link
        </span>
      </div>

      {/* Zone 2: 4-5 concise single-line navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
        <a href="#simulation-controls" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
          Controls
        </a>
        <a href="#feature-telemetry" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
          Feature Telemetry
        </a>
        <a href="#anomaly-detection" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
          Isolation Forest
        </a>
        <a href="#adaptive-recovery" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
          Link Recovery
        </a>
        <a href="#event-log" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
          Audit Log
        </a>
      </nav>

      {/* Zone 3: Primary action cluster with single-line controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onToggleRun}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            isRunning
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
          }`}
          title={isRunning ? 'Pause continuous simulation' : 'Resume simulation'}
        >
          {isRunning ? 'Pause Engine' : 'Resume Engine'}
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap border border-slate-200"
          title="Reset link to clean baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Baseline</span>
        </button>

        <button
          onClick={onExportCsv}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap border border-slate-200 shadow-xs"
          title="Export telemetry records to CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={onOpenTheory}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>ME Theory & Formulas</span>
        </button>
      </div>
    </header>
  );
};
