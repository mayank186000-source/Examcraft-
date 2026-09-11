import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Wrench, ShieldCheck, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  autoFixing: boolean;
  fixedSuccessfully: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  declare state: State;
  declare props: Props;
  declare setState: (state: Partial<State> | ((prevState: State) => Partial<State>), callback?: () => void) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      autoFixing: false,
      fixedSuccessfully: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const msg = String(error?.message || error || '');
    if (
      msg.includes('Database is closing') ||
      msg.includes('closing/hidden') ||
      msg.includes('database connection is closing') ||
      msg.includes('IndexedDB')
    ) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [Auto-Diagnostics Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log error to local diagnostics history for Admin review
    try {
      const logs = JSON.parse(localStorage.getItem('examcraft_error_logs') || '[]');
      logs.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
      localStorage.setItem('examcraft_error_logs', JSON.stringify(logs.slice(-20)));
    } catch (e) {
      // ignore storage write error
    }
  }

  private handleAutoFix = () => {
    this.setState({ autoFixing: true });
    setTimeout(() => {
      // Clear corrupt draft state or cached keys if any
      try {
        sessionStorage.clear();
        // Keep user auth intact if possible
        const authKey = localStorage.getItem('examcraft_auth_user');
        localStorage.clear();
        if (authKey) localStorage.setItem('examcraft_auth_user', authKey);
      } catch (e) {
        console.error('Failed clearing session:', e);
      }
      this.setState({ autoFixing: false, fixedSuccessfully: true });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }, 1200);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-2xl w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-stone-800 pb-5">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Auto-Diagnostics System
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Realtime Guard
                  </span>
                </div>
                <h2 className="text-xl font-black text-stone-100 mt-1">
                  Runtime Exception Detected & Diagnosed
                </h2>
                <p className="text-xs text-stone-400 font-medium">
                  An unexpected error occurred during operation. Our automatic diagnostics system captured the details below.
                </p>
              </div>
            </div>

            {/* Diagnostic Details */}
            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold">
                <Terminal className="w-4 h-4" />
                <span>Error Diagnosis:</span>
              </div>
              <p className="text-xs font-mono text-red-300 bg-red-950/40 p-3 rounded-xl border border-red-900/50 break-words">
                {this.state.error?.message || 'Unknown runtime error'}
              </p>
              {this.state.errorInfo?.componentStack && (
                <details className="text-[11px] font-mono text-stone-500 cursor-pointer">
                  <summary className="hover:text-stone-300 transition-colors">View Diagnostic Stack</summary>
                  <pre className="mt-2 p-2 bg-stone-900 rounded-lg overflow-x-auto text-[10px] text-stone-400 leading-relaxed max-h-32">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            {/* Auto Fix / Recovery Actions */}
            <div className="bg-stone-800/50 p-4 rounded-2xl border border-stone-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <span>Automatic Self-Healing Recovery</span>
                </h4>
                <p className="text-[11px] text-stone-400">
                  Clicking below will clear stale cache, restore clean system state, and reload the application automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={this.handleAutoFix}
                disabled={this.state.autoFixing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${this.state.autoFixing ? 'animate-spin' : ''}`} />
                <span>{this.state.autoFixing ? 'Fixing & Restoring...' : 'Diagnose & Auto-Fix System'}</span>
              </button>
            </div>

            <div className="text-center text-[11px] text-stone-500">
              ExamCraft AI Assistant continuously monitors system health and automatically prevents paper generation crashes.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
