
import React, { useEffect, useState } from 'react';
import { X, Trash2, Terminal, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Logger, LogEntry } from '../logger';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setLogs(Logger.getLogs());
    const unsubscribe = Logger.subscribe(setLogs);
    return unsubscribe;
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warn': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-50 border-red-100 text-red-800';
      case 'success': return 'bg-green-50 border-green-100 text-green-800';
      case 'warn': return 'bg-yellow-50 border-yellow-100 text-yellow-800';
      default: return 'bg-gray-50 border-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl h-[70vh] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        
        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-800 text-white">
          <h2 className="text-lg font-mono flex items-center gap-2">
            <Terminal className="w-5 h-5" /> 系统日志 (System Logs)
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => Logger.clear()}
              className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition"
              title="清空日志"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm bg-gray-50">
          {logs.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">暂无日志记录</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={`p-2 rounded border ${getColor(log.level)}`}>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">{getIcon(log.level)}</span>
                  <div className="flex-1">
                     <div className="flex justify-between mb-1">
                        <span className="font-bold">{log.message}</span>
                        <span className="text-xs opacity-60">{log.timestamp}</span>
                     </div>
                     {log.details && (
                       <pre className="text-xs bg-white/50 p-1.5 rounded overflow-x-auto whitespace-pre-wrap border border-black/5">
                         {JSON.stringify(log.details, null, 2)}
                       </pre>
                     )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
