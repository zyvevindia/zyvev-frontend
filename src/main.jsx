import React from "react";

import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import {
  HelmetProvider,
} from "react-helmet-async";

import App from "./App.jsx";

import ErrorBoundary from "./components/ErrorBoundary";

import GoogleAnalytics from "./components/GoogleAnalytics";

import { ReportIssueProvider } from "./components/feedback/ReportIssueProvider";

import "./index.css";

/* =========================================================
   ========================= RENDER =========================
   ========================================================= */

ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <HelmetProvider>

      <BrowserRouter>

        <ErrorBoundary>

          <ReportIssueProvider>

            <GoogleAnalytics />

            <App />

          </ReportIssueProvider>

        </ErrorBoundary>

      </BrowserRouter>

    </HelmetProvider>

  </React.StrictMode>
);