/**
 * @module App
 * @description Root application component.
 * Sets up the MUI ThemeProvider, CssBaseline, React Router, and an
 * ErrorBoundary wrapping all routes. The useAuth hook is instantiated here
 * and passed as a prop to pages to avoid prop drilling through Context.
 */

import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Log } from "./middleware/logger";
import { theme } from "./styles/theme";
import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { InboxPage } from "./pages/InboxPage";

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Top-level React error boundary.
 * Catches unhandled rendering exceptions and logs them before showing
 * a graceful recovery UI.
 */
class AppErrorBoundary extends React.Component<
  React.PropsWithChildren<Record<never, never>>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<Record<never, never>>) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error): void {
    Log(
      "frontend",
      "fatal",
      "component",
      `Unhandled render error: ${error.message}`
    );
  }

  handleReset = (): void => {
    this.setState({ hasError: false, message: "" });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            background: "linear-gradient(135deg, #F8FAFC, #E2E8F0)",
            color: "text.primary",
            px: 3,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}
          >
            An unexpected error occurred
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontFamily: "'Inter', sans-serif",
              maxWidth: 480,
            }}
          >
            {this.state.message || "Please refresh the page to continue."}
          </Typography>
          <Button
            variant="contained"
            onClick={this.handleReset}
            sx={{
              mt: 2,
              background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Try Again
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

// ─── App Router Shell ─────────────────────────────────────────────────────────

/**
 * Inner router component that consumes the auth hook and passes it to pages.
 * Extracted to keep App clean and testable.
 */
function AppRoutes(): React.ReactElement {
  const auth = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          auth.isAuthenticated ? (
            <Navigate to="/inbox" replace />
          ) : (
            <LoginPage auth={auth} />
          )
        }
      />
      <Route
        path="/inbox"
        element={
          auth.isAuthenticated ? (
            <InboxPage auth={auth} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      {/* Fallback: redirect unknown routes to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

/**
 * Application root. Wraps everything in the theme, baseline reset,
 * error boundary, and router.
 */
function App(): React.ReactElement {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppErrorBoundary>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
