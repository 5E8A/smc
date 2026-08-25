import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { RunConsoleProvider } from "./lib/RunConsoleProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RunConsoleProvider>
      <App />
    </RunConsoleProvider>
  </StrictMode>
);
