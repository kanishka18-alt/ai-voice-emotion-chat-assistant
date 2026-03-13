import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
console.log("[Lovable] main.tsx loaded");
const rootEl = document.getElementById("root");
if (!rootEl) {
  console.error("[Lovable] Root element #root not found");
} else {
  console.log("[Lovable] Mounting React App");
  createRoot(rootEl).render(<App />);
}
