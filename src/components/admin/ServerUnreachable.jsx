'use client';

import { AlertOctagon, RefreshCw, WifiOff } from 'lucide-react';

export default function ServerUnreachable({ onRetry, isRetrying }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center rounded-2xl border border-red-500/20 bg-slate-900/60 backdrop-blur-xl">
      <div className="w-16 h-16 mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
        <WifiOff className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Barangay Server Unreachable</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        Could not establish a connection to the local barangay hall server. Check that your terminal is
        connected to the barangay LAN or server PC.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Checking connection...' : 'Retry connection'}
        </button>
      )}
    </div>
  );
}
