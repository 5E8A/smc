import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { ArrowClockwiseIcon, CheckIcon, CopyIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { ApiError } from "../api";
import { Button } from "./fields";

const TROUBLESHOOTING: Array<{ problem: string; fix: string }> = [
  {
    problem: "Server shows UNREACHABLE above",
    fix: 'The CMS process crashed or isn\'t running - restart it with "npm run cms" and check the terminal for the crash log.',
  },
  {
    problem: '"Failed to fetch" on every action',
    fix: 'Server is down, or it was restarted while this page stayed open - restart "npm run cms", then reload the page.',
  },
  {
    problem: "Broke right after source files were edited",
    fix: "Dev-server HMR hiccup - a plain browser reload usually fixes it.",
  },
  {
    problem: "Port 4000 already in use on startup",
    fix: "Another CMS instance is still running - close it or kill the process listening on port 4000.",
  },
  {
    problem: "Image/video uploads fail",
    fix: 'ffmpeg missing - run "npm run cms:ffmpeg" (or install it system-wide), then restart "npm run cms".',
  },
  {
    problem: "Save rejected with an issues list",
    fix: "That is validation, not a bug - fix the listed fields shown in the banner.",
  },
];

const describeError = (error: unknown): string[] => {
  const lines: string[] = [];
  if (error instanceof Error) {
    lines.push(`${error.name}: ${error.message}`);
    lines.push(error.stack ?? "  (no stack available)");
    if (error instanceof ApiError) {
      lines.push(`HTTP status: ${error.status}`);
      try {
        lines.push(`Response payload: ${JSON.stringify(error.payload, null, 2)}`);
      } catch {
        /* unserializable payload */
      }
    }
    let cause: unknown = error.cause;
    let depth = 0;
    while (cause !== undefined && cause !== null && depth < 5) {
      lines.push(`Caused by: ${cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause)}`);
      if (cause instanceof Error && cause.stack) lines.push(cause.stack);
      cause = (cause as Error).cause;
      depth++;
    }
  } else {
    lines.push(`Non-Error thrown (${typeof error}):`);
    try {
      lines.push(JSON.stringify(error, null, 2) ?? String(error));
    } catch {
      lines.push(String(error));
    }
  }
  return lines;
};

const buildReport = (error: unknown, componentStack: string | null, serverLine: string, kind: string): string => {
  const lines = [
    `CMS Bug Report - ${new Date().toISOString()}`,
    `Kind: ${kind}`,
    `URL: ${window.location.href}`,
    `Viewport: ${window.innerWidth}x${window.innerHeight}`,
    `User agent: ${navigator.userAgent}`,
    serverLine,
    "",
    ...describeError(error),
  ];
  if (componentStack) {
    lines.push("", "Component stack:", componentStack);
  }
  return lines.join("\n");
};

interface BugReportScreenProps {
  error: unknown;
  componentStack: string | null;
  kind: "render" | "global";
  onReset: () => void;
  onDismiss?: () => void;
}

const BugReportScreen = ({ error, componentStack, kind, onReset, onDismiss }: BugReportScreenProps) => {
  const [copied, setCopied] = useState(false);
  const [serverLine, setServerLine] = useState("Server: checking…");

  useEffect(() => {
    let alive = true;
    fetch("/api/content?kind=posts&lang=en", { method: "HEAD" })
      .then((r) => {
        if (alive) setServerLine(`Server: reachable (HTTP ${r.status})`);
      })
      .catch(() => {
        if (alive) setServerLine("Server: UNREACHABLE - the CMS process has likely crashed or isn't running");
      });
    return () => {
      alive = false;
    };
  }, []);

  const report = buildReport(
    error,
    componentStack,
    serverLine,
    kind === "render" ? "render error (caught by boundary)" : "uncaught error / unhandled rejection"
  );

  const copy = () => {
    void navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-zinc-950 p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex items-center gap-3">
          <WarningCircleIcon size={28} className="shrink-0 text-red-400" />
          <h1 className="text-lg font-bold text-white">Something broke</h1>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            {kind === "render" ? "render error" : "uncaught error"}
          </span>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="mb-2 text-[9px] font-bold tracking-wider text-zinc-500 uppercase">Common causes</div>
          <ul className="space-y-1.5">
            {TROUBLESHOOTING.map((t) => (
              <li key={t.problem} className="text-xs leading-snug">
                <span className="font-semibold text-zinc-200">{t.problem}</span>
                <span className="text-zinc-500"> - {t.fix}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-1 text-[9px] font-bold tracking-wider text-zinc-500 uppercase">
            Full report (attach when reporting)
          </div>
          <pre className="max-h-[45vh] overflow-auto rounded-md border border-zinc-800 bg-black/40 p-3 font-mono text-[11px] leading-snug break-words whitespace-pre-wrap text-zinc-300 select-all">
            {report}
          </pre>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={copy}>
            {copied ? <CheckIcon size={15} className="text-green-200" /> : <CopyIcon size={15} />}
            {copied ? "Copied" : "Copy report"}
          </Button>
          {kind === "render" ? (
            <Button variant="danger" onClick={onReset} title="Remounts the editor - unsaved changes are lost">
              <ArrowClockwiseIcon size={15} /> Try again
            </Button>
          ) : (
            <Button onClick={onDismiss} title="Keeps the editor and any unsaved changes open">
              <XIcon size={15} /> Dismiss - back to editor
            </Button>
          )}
          <Button variant="ghost" onClick={() => window.location.reload()} title="Reloads the page">
            <ArrowClockwiseIcon size={15} /> Reload page
          </Button>
        </div>
      </div>
    </div>
  );
};

interface RenderErrorState {
  error: unknown;
  componentStack: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface State {
  renderError: RenderErrorState | null;
  globalError: unknown | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { renderError: null, globalError: null };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { renderError: { error, componentStack: null } };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState((s) =>
      s.renderError ? { renderError: { error, componentStack: info.componentStack ?? null } } : null
    );
  }

  componentDidMount() {
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  private handleWindowError = (e: ErrorEvent) => {
    if (this.state.renderError || this.state.globalError !== null) return;
    this.setState({ globalError: e.error ?? new Error(e.message || "Unknown script error") });
  };

  private handleUnhandledRejection = (e: PromiseRejectionEvent) => {
    if (this.state.renderError || this.state.globalError !== null) return;
    this.setState({ globalError: e.reason ?? new Error("Unhandled promise rejection with no reason") });
  };

  clearRenderError = () => this.setState({ renderError: null });

  clearGlobalError = () => this.setState({ globalError: null });

  render() {
    if (this.state.renderError) {
      return (
        <BugReportScreen
          error={this.state.renderError.error}
          componentStack={this.state.renderError.componentStack}
          kind="render"
          onReset={this.clearRenderError}
        />
      );
    }
    return (
      <>
        {this.props.children}
        {this.state.globalError !== null && (
          <BugReportScreen
            error={this.state.globalError}
            componentStack={null}
            kind="global"
            onReset={this.clearGlobalError}
            onDismiss={this.clearGlobalError}
          />
        )}
      </>
    );
  }
}
