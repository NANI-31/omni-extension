import React from "react";
import { telemetryLogger } from "../utils/TelemetryLogger.js";

/**
 * ErrorBoundary Component
 * Catches React component render crashes, logs them to TelemetryLogger,
 * and renders a graceful glassmorphism error fallback UI.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    telemetryLogger.logError(error, {
      componentStack: errorInfo?.componentStack,
      component: this.props.name || "UnknownComponent",
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-2xl backdrop-blur-md space-y-4 my-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-sm font-bold text-red-300 uppercase tracking-wider">
                Component Render Error
              </h3>
              <p className="text-xs text-zinc-400">
                {this.props.name || "A feature section"} encountered an unexpected error.
              </p>
            </div>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg font-mono text-[11px] text-red-400 overflow-x-auto max-h-32">
            {this.state.error?.message || "Unknown rendering exception"}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={this.handleReset}
              className="py-1.5 px-4 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-lg"
            >
              Try Reloading Feature
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}