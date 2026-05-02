/**
 * @module pages/LoginPage
 * @description Authentication credentials form page.
 * Collects all required fields, validates them, then calls useAuth.login().
 * Navigates to the InboxPage upon successful authentication.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import KeyIcon from "@mui/icons-material/Key";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import LockIcon from "@mui/icons-material/Lock";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CircularProgress from "@mui/material/CircularProgress";
import { Log } from "../middleware/logger";
import { ErrorBanner } from "../components/ErrorBanner";
import type { AuthCredentials, UseAuthReturn } from "../types";

interface LoginPageProps {
  /** Auth hook interface injected from the parent. */
  auth: UseAuthReturn;
}

/** Initial empty form state. */
const EMPTY_FORM: AuthCredentials = {
  email: "",
  name: "",
  rollNo: "",
  accessCode: "",
  clientID: "",
  clientSecret: "",
};

/** Validation rules per field. */
const FIELD_VALIDATORS: Record<keyof AuthCredentials, (v: string) => string | null> = {
  email: (v) =>
    !v.trim()
      ? "Email is required."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? "Enter a valid email address."
      : null,
  name: (v) => (!v.trim() ? "Name is required." : null),
  rollNo: (v) => (!v.trim() ? "Roll number is required." : null),
  accessCode: (v) => (!v.trim() ? "Access code is required." : null),
  clientID: (v) => (!v.trim() ? "Client ID is required." : null),
  clientSecret: (v) => (!v.trim() ? "Client secret is required." : null),
};

type FormErrors = Partial<Record<keyof AuthCredentials, string>>;

/**
 * Login page with full credential validation and error display.
 * On success, navigates the user to the priority inbox.
 *
 * @param props - LoginPageProps
 */
export function LoginPage({ auth }: LoginPageProps): React.ReactElement {
  const navigate = useNavigate();
  const [form, setForm] = useState<AuthCredentials>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  useEffect(() => {
    Log("frontend", "info", "page", "LoginPage mounted.");
  }, []);

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate("/inbox", { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  const handleChange = useCallback(
    (field: keyof AuthCredentials) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      },
    []
  );

  const validate = useCallback((): boolean => {
    const errors: FormErrors = {};
    let isValid = true;
    (Object.keys(FIELD_VALIDATORS) as (keyof AuthCredentials)[]).forEach(
      (field) => {
        const error = FIELD_VALIDATORS[field](form[field]);
        if (error) {
          errors[field] = error;
          isValid = false;
        }
      }
    );
    setFieldErrors(errors);
    return isValid;
  }, [form]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!validate()) {
        Log("frontend", "warn", "page", "LoginPage: form validation failed.");
        return;
      }
      Log("frontend", "info", "page", "LoginPage: submitting credentials.");
      await auth.login(form);
    },
    [auth, form, validate]
  );

  const fieldConfig: {
    key: keyof AuthCredentials;
    label: string;
    type: string;
    icon: React.ReactElement;
    autocomplete: string;
  }[] = [
    { key: "email", label: "Email Address", type: "email", icon: <EmailIcon />, autocomplete: "email" },
    { key: "name", label: "Full Name", type: "text", icon: <PersonIcon />, autocomplete: "name" },
    { key: "rollNo", label: "Roll Number", type: "text", icon: <BadgeIcon />, autocomplete: "off" },
    { key: "accessCode", label: "Access Code", type: "password", icon: <KeyIcon />, autocomplete: "off" },
    { key: "clientID", label: "Client ID", type: "text", icon: <FingerprintIcon />, autocomplete: "off" },
    { key: "clientSecret", label: "Client Secret", type: "password", icon: <LockIcon />, autocomplete: "new-password" },
  ];

  /** Shared TextField sx styles. */
  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      color: "#0F172A",
      "& fieldset": { borderColor: "rgba(0,0,0,0.12)" },
      "&:hover fieldset": { borderColor: "rgba(0,0,0,0.24)" },
      "&.Mui-focused fieldset": { borderColor: "#4F46E5" },
      "&.Mui-disabled": { opacity: 0.5 },
    },
    "& .MuiInputLabel-root": {
      color: "text.secondary",
      fontFamily: "'Inter', sans-serif",
      "&.Mui-focused": { color: "#4F46E5" },
    },
    "& .MuiFormHelperText-root": {
      fontFamily: "'Inter', sans-serif",
      fontSize: "0.72rem",
    },
    "& input": {
      fontFamily: "'Inter', sans-serif",
      fontSize: "0.9rem",
    },
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px #FFFFFF inset",
      WebkitTextFillColor: "#0F172A",
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)",
        px: 2,
        py: 4,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 560 }}>
        {/* Brand header */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "20px",
              background: "linear-gradient(135deg, #4F46E5, #3B82F6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              boxShadow: "0 8px 32px rgba(79, 70, 229, 0.3)",
            }}
          >
            <NotificationsActiveIcon sx={{ fontSize: 36, color: "#fff" }} />
          </Box>
          <Typography
            variant="h4"
            sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, color: "text.primary", letterSpacing: "-0.5px" }}
          >
            Campus Notifications
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontFamily: "'Inter', sans-serif", mt: 0.5 }}
          >
            Priority Inbox — Sign in to continue
          </Typography>
        </Box>

        {/* Login card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography
              variant="h6"
              sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: "text.primary", mb: 3 }}
            >
              Enter Your Credentials
            </Typography>

            {auth.error && (
              <ErrorBanner message={auth.error} title="Authentication Failed" />
            )}

            <Box component="form" id="login-form" onSubmit={handleSubmit} noValidate>
              {/* 2-column responsive grid using flexbox */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  "& > *": { flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)" } },
                }}
              >
                {fieldConfig.map(({ key, label, type, icon, autocomplete }) => (
                  <TextField
                    key={key}
                    fullWidth
                    required
                    id={`login-field-${key}`}
                    name={key}
                    label={label}
                    type={type}
                    value={form[key]}
                    onChange={handleChange(key)}
                    error={Boolean(fieldErrors[key])}
                    helperText={fieldErrors[key] ?? " "}
                    autoComplete={autocomplete}
                    disabled={auth.isLoading}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box
                              component="span"
                              sx={{ fontSize: 18, color: "text.secondary", display: "flex" }}
                            >
                              {icon}
                            </Box>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={textFieldSx}
                  />
                ))}
              </Box>

              <Button
                type="submit"
                id="login-submit-btn"
                fullWidth
                variant="contained"
                disabled={auth.isLoading}
                sx={{
                  mt: 3,
                  py: 1.6,
                  borderRadius: 2.5,
                  background: "linear-gradient(135deg, #4F46E5, #3B82F6)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  textTransform: "none",
                  boxShadow: "0 4px 16px rgba(79, 70, 229, 0.25)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #4338CA, #2563EB)",
                    boxShadow: "0 6px 20px rgba(79, 70, 229, 0.4)",
                    transform: "translateY(-1px)",
                  },
                  "&:active": { transform: "translateY(0)" },
                  "&.Mui-disabled": { opacity: 0.6 },
                  transition: "all 0.2s ease",
                }}
                startIcon={
                  auth.isLoading ? (
                    <CircularProgress size={18} sx={{ color: "#fff" }} />
                  ) : undefined
                }
              >
                {auth.isLoading ? "Authenticating…" : "Sign In"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
