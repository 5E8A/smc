import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { RunConsoleProvider } from "./hooks/RunConsoleProvider";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
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
