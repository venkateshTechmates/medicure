"use client";
import { Component, type ErrorInfo, type ReactNode } from "react";

// PRD §14.P — wrap the app in a friendly fallback. Functional components leak errors only
// to class boundaries, so this MUST stay a class component.
interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; info: ErrorInfo | null; copied: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, info: null, copied: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the console useful for devs without spamming users.
    if (typeof console !== "undefined") {
      console.error("[ErrorBoundary]", error, info);
    }
    this.setState({ info });
  }

  handleReload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  handleCopy = async () => {
    const { error, info } = this.state;
    const text = [
      `MedCure error report`,
      `time: ${new Date().toISOString()}`,
      `url:  ${typeof window !== "undefined" ? window.location.href : ""}`,
      `name: ${error?.name ?? "Error"}`,
      `msg:  ${error?.message ?? ""}`,
      "",
      "stack:",
      error?.stack ?? "(no stack)",
      "",
      "componentStack:",
      info?.componentStack ?? "(no component stack)",
    ].join("\n");
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== "undefined") {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // best-effort
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message ?? "An unexpected error occurred.";
    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "var(--bg, #fafafa)",
        }}
      >
        <div className="card" style={{ maxWidth: 560, width: "100%", padding: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden>⚠</div>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>
            Something went wrong on this screen.
          </div>
          <div style={{ color: "var(--ink-mute)", marginBottom: 14, fontSize: 13 }}>
            The clinical data is safe. Reload to recover, or copy the error so we can fix it.
          </div>
          <div
            style={{
              background: "rgba(0,0,0,.05)",
              padding: 10,
              borderRadius: 8,
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: 11,
              marginBottom: 14,
              overflow: "auto",
              maxHeight: 120,
              whiteSpace: "pre-wrap",
            }}
          >
            {msg}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" onClick={this.handleReload}>Reload</button>
            <button className="btn" onClick={this.handleCopy}>
              {this.state.copied ? "Copied ✓" : "Copy error"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
