import { createRoot } from "react-dom/client";
// Imported first for its side effect: registers the API base URL with the
// generated client before any component can fire a request.
import "./lib/api-base";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
