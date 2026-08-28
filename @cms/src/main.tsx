import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { RunConsoleProvider } from "./lib/RunConsoleProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <RunConsoleProvider>
        <App />
      </RunConsoleProvider>
    </ErrorBoundary>
  </StrictMode>
);
