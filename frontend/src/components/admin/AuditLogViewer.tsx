import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { AuditLogItem } from '../../types';
import { ShieldCheck, Eye, Clock, ArrowRight, RefreshCw, Filter } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) => filterAction === 'ALL' || l.action === filterAction
  );

  return (
    <div className="glass-card rounded-3xl p-6 shadow-card transition-all duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ink dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-aqua" />
            Faculty Academic Audit Trail
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Immutable log recording who changed what, timestamp, previous states, and updated records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="p-2 rounded-xl bg-ink-100 hover:bg-ink-200 dark:bg-darkcard2 dark:hover:bg-darkborder text-ink-600 dark:text-ink-300 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 dark:border-darkborder text-[11px] font-extrabold tracking-wider uppercase text-ink-400">
              <th className="py-3 px-3">Timestamp</th>
              <th className="py-3 px-3">Faculty / User</th>
              <th className="py-3 px-3">Action</th>
              <th className="py-3 px-3">Entity Target</th>
              <th className="py-3 px-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-darkborder">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-ink-50/50 dark:hover:bg-darkcard2/40 transition-colors">
                <td className="py-3 px-3 whitespace-nowrap text-xs font-mono text-ink-500 dark:text-ink-400">
                  {new Date(log.timestamp).toLocaleString()}
                </td>

                <td className="py-3 px-3">
                  <div className="font-bold text-xs text-ink dark:text-white">
                    {log.user_name}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-aqua-dark dark:text-aqua">
                    {log.user_role}
                  </span>
                </td>

                <td className="py-3 px-3">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light">
                    {log.action}
                  </span>
                </td>

                <td className="py-3 px-3 text-xs text-ink-600 dark:text-ink-300">
                  <span className="font-semibold">{log.model_name}</span>
                  {log.record_id && <span className="text-ink-400"> #{log.record_id}</span>}
                </td>

                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-ink-100 hover:bg-ink-200 dark:bg-darkcard2 dark:hover:bg-darkborder text-ink-700 dark:text-ink-200 inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Diff
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Diff Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card max-w-2xl w-full rounded-3xl p-6 shadow-2xl border border-ink-200 dark:border-darkborder animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-darkborder">
              <div>
                <h3 className="text-base font-extrabold text-ink dark:text-white">
                  Audit Entry: {selectedLog.action}
                </h3>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  Executed by {selectedLog.user_name} ({selectedLog.user_role}) on {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-ink-400 hover:text-ink dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <div className="font-bold text-coral mb-1 flex items-center gap-1">
                  <span>[-] Old Value State</span>
                </div>
                <div className="p-3 rounded-xl bg-ink-50 dark:bg-darkcard2 border border-ink-200 dark:border-darkborder max-h-60 overflow-y-auto whitespace-pre-wrap break-all text-[11px] text-ink-700 dark:text-ink-300">
                  {JSON.stringify(selectedLog.old_value, null, 2)}
                </div>
              </div>

              <div>
                <div className="font-bold text-aqua mb-1 flex items-center gap-1">
                  <span>[+] New Value State</span>
                </div>
                <div className="p-3 rounded-xl bg-ink-50 dark:bg-darkcard2 border border-ink-200 dark:border-darkborder max-h-60 overflow-y-auto whitespace-pre-wrap break-all text-[11px] text-ink-700 dark:text-ink-300">
                  {JSON.stringify(selectedLog.new_value, null, 2)}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-ink-100 hover:bg-ink-200 dark:bg-darkcard2 text-ink-800 dark:text-white"
              >
                Close Diff
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
