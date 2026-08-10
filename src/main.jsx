import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ExtensionStateProvider } from "./context/ExtensionStateContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ExtensionStateProvider>
      <App />
    </ExtensionStateProvider>
  </React.StrictMode>
);

