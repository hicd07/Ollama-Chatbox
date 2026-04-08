import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full border border-[#141414] bg-white p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-3 mb-6 text-red-600">
              <AlertCircle className="w-8 h-8" />
              <h1 className="text-xl font-mono font-bold uppercase tracking-tighter">System Failure</h1>
            </div>
            
            <div className="space-y-4 mb-8">
              <p className="text-sm font-mono opacity-70">
                Se ha producido un error crítico en la arquitectura de la aplicación.
              </p>
              <div className="bg-[#141414] text-[#E4E3E0] p-4 font-mono text-xs overflow-auto max-h-32">
                {this.state.error?.message || 'Unknown architectural fault'}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={this.handleReset}
                className="flex-1 bg-[#141414] text-[#E4E3E0] rounded-none font-mono text-xs uppercase hover:bg-[#141414]/90"
              >
                <RefreshCw className="w-3 h-3 mr-2" /> Reiniciar Sistema
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="border-[#141414] rounded-none font-mono text-xs uppercase"
              >
                <Home className="w-3 h-3 mr-2" /> Inicio
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
