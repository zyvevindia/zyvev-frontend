import { useState } from "react";

import { API_URL } from "../config";

import {
  validateLoginForm,
  sanitizeInput,
} from "../utils/validators";

import {
  cardStyle,
  primaryButton,
  inputStyle,
  shadows,
  radius,
  transitions,
  colors,
  gradients,
} from "../styles/ui";

/* =========================================================
   ================= CREATE SALES USER ======================
   ========================================================= */

export default function CreateSalesUser({
  token,
  onUserCreated,
}) {

  /* =========================================================
     ========================= STATE =========================
     ========================================================= */

  const [form, setForm] =
    useState({

      email: "",

      password: "",

      role: "sales",
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});

  /* =========================================================
     ===================== CLEAR STATE =======================
     ========================================================= */

  const clearMessages = () => {

    setError("");

    setSuccess("");

    setFieldErrors({});
  };

  /* =========================================================
     ====================== HANDLE CHANGE ====================
     ========================================================= */

  const handleChange = (
    field,
    value
  ) => {

    clearMessages();

    const sanitizedValue =

      field === "email"

        ? sanitizeInput(
            value.toLowerCase()
          )

        : sanitizeInput(value);

    setForm((prev) => ({

      ...prev,

      [field]:
        sanitizedValue,
    }));
  };

  /* =========================================================
     ===================== HANDLE SUBMIT =====================
     ========================================================= */

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      clearMessages();

      /* ================= VALIDATION ================= */

      const validation =
        validateLoginForm({

          email:
            form.email,

          password:
            form.password,
        });

      const errors = {
        ...validation.errors,
      };

      /* ================= ROLE VALIDATION ================= */

      const validRoles = [

        "sales",

        "admin",
      ];

      if (
        !validRoles.includes(
          form.role
        )
      ) {

        errors.role =
          "Invalid role selected";
      }

      /* ================= SHOW ERRORS ================= */

      if (
        Object.keys(errors)
          .length > 0
      ) {

        setFieldErrors(
          errors
        );

        return;
      }

      setLoading(true);

      try {

        const response =
          await fetch(
            `${API_URL}/api/admin/users`,
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({

                  email:
                    sanitizeInput(
                      form.email
                    ),

                  password:
                    form.password,

                  role:
                    form.role,
                }),
            }
          );

        const data =
          await response.json();

        /* ================= ERROR ================= */

        if (
          !response.ok
        ) {

          throw new Error(

            data.error ||

            data.message ||

            "Failed to create sales user"
          );
        }

        /* ================= SUCCESS ================= */

        setSuccess(
          "Sales user created successfully"
        );

        /* ================= CALLBACK ================= */

        if (
          onUserCreated
        ) {

          onUserCreated(
            data
          );
        }

        /* ================= RESET ================= */

        setForm({

          email: "",

          password: "",

          role: "sales",
        });

      } catch (err) {

        console.error(
          "CREATE USER ERROR:",
          err
        );

        setError(

          err.message ||

          "Server error"
        );

      } finally {

        setLoading(false);
      }
    };

  /* =========================================================
     =========================== UI ==========================
     ========================================================= */

  return (

    <section
      style={wrapper}

      aria-label="Create Sales User Form"
    >

      {/* ================= HEADER ================= */}

      <div style={headerRow}>

        <div style={iconBox}>
          👥
        </div>

        <div>

          <div style={badge}>
            Admin Control
          </div>

          <h3 style={heading}>
            Create Sales User
          </h3>

          <p style={subText}>
            Add sales team members with
            controlled role-based access.
          </p>

        </div>

      </div>

      {/* ================= FORM ================= */}

      <form
        onSubmit={
          handleSubmit
        }

        style={formStyle}
      >

        {/* ================= EMAIL ================= */}

        <div style={field}>

          <label
            htmlFor="sales-email"

            style={label}
          >
            Email Address
          </label>

          <input
            id="sales-email"

            type="email"

            placeholder="sales@evsavari.com"

            value={form.email}

            onChange={(e) =>
              handleChange(
                "email",
                e.target.value
              )
            }

            required

            autoComplete="email"

            aria-invalid={
              !!fieldErrors.email
            }

            style={{
              ...input,

              border:
                fieldErrors.email

                  ? `1px solid ${colors.danger}`

                  : input.border,
            }}
          />

          {fieldErrors.email && (

            <span
              style={fieldErrorText}

              role="alert"
            >
              {
                fieldErrors.email
              }
            </span>
          )}

        </div>

        {/* ================= PASSWORD ================= */}

        <div style={field}>

          <label
            htmlFor="sales-password"

            style={label}
          >
            Password
          </label>

          <input
            id="sales-password"

            type="password"

            placeholder="Minimum 6 characters"

            value={form.password}

            onChange={(e) =>
              handleChange(
                "password",
                e.target.value
              )
            }

            required

            autoComplete="new-password"

            aria-invalid={
              !!fieldErrors.password
            }

            style={{
              ...input,

              border:
                fieldErrors.password

                  ? `1px solid ${colors.danger}`

                  : input.border,
            }}
          />

          {fieldErrors.password && (

            <span
              style={fieldErrorText}

              role="alert"
            >
              {
                fieldErrors.password
              }
            </span>
          )}

        </div>

        {/* ================= ROLE ================= */}

        <div style={field}>

          <label
            htmlFor="sales-role"

            style={label}
          >
            Role
          </label>

          <select
            id="sales-role"

            value={form.role}

            onChange={(e) =>
              handleChange(
                "role",
                e.target.value
              )
            }

            aria-invalid={
              !!fieldErrors.role
            }

            style={{
              ...input,

              cursor: "pointer",

              border:
                fieldErrors.role

                  ? `1px solid ${colors.danger}`

                  : input.border,
            }}
          >

            <option value="sales">
              Sales
            </option>

            <option value="admin">
              Admin
            </option>

          </select>

          {fieldErrors.role && (

            <span
              style={fieldErrorText}

              role="alert"
            >
              {
                fieldErrors.role
              }
            </span>
          )}

        </div>

        {/* ================= BUTTON ================= */}

        <button
          type="submit"

          disabled={loading}

          style={{
            ...button,

            opacity:
              loading
                ? 0.7
                : 1,

            cursor:
              loading
                ? "not-allowed"
                : "pointer",
          }}
        >

          {loading
            ? "Creating User..."
            : "Create User"}

        </button>

        {/* ================= ERROR ================= */}

        {error && (

          <div
            style={errorBox}

            role="alert"
          >
            ⚠ {error}
          </div>
        )}

        {/* ================= SUCCESS ================= */}

        {success && (

          <div
            style={successBox}

            role="status"
          >
            ✅ {success}
          </div>
        )}

      </form>

    </section>
  );
}

/* =========================================================
   ========================= STYLES =========================
   ========================================================= */

const wrapper = {
  ...cardStyle,

  padding: "28px",

  borderRadius:
    radius.xl,

  boxShadow:
    shadows.medium,
};

const headerRow = {
  display: "flex",

  gap: "18px",

  alignItems: "flex-start",

  marginBottom: "28px",
};

const iconBox = {
  width: "64px",

  height: "64px",

  borderRadius: "20px",

  background:
    gradients.primary,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  fontSize: "28px",

  color: "white",

  flexShrink: 0,

  boxShadow:
    shadows.glow,
};

const badge = {
  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  background:
    gradients.softBlue,

  color:
    colors.primaryDark,

  padding: "8px 14px",

  borderRadius:
    radius.full,

  fontWeight: "700",

  fontSize: "12px",

  marginBottom: "12px",
};

const heading = {
  margin: 0,

  color:
    colors.text,

  fontSize: "28px",

  fontWeight: "800",

  letterSpacing: "-0.5px",
};

const subText = {
  color:
    colors.textLight,

  marginTop: "10px",

  lineHeight: "1.7",

  fontSize: "14px",
};

const formStyle = {
  display: "flex",

  flexDirection: "column",

  gap: "22px",
};

const field = {
  display: "flex",

  flexDirection: "column",
};

const label = {
  marginBottom: "10px",

  fontSize: "14px",

  fontWeight: "700",

  color:
    colors.text,
};

const input = {
  ...inputStyle,

  padding: "16px 18px",

  borderRadius:
    radius.md,

  fontSize: "15px",

  minHeight: "56px",

  transition:
    transitions.smooth,
};

const fieldErrorText = {
  marginTop: "8px",

  color:
    colors.danger,

  fontSize: "13px",

  fontWeight: "600",
};

const button = {
  ...primaryButton,

  width: "100%",

  minHeight: "58px",

  borderRadius:
    radius.lg,

  fontWeight: "800",

  fontSize: "15px",

  marginTop: "4px",
};

const errorBox = {
  background:
    "linear-gradient(135deg, #fef2f2, #fee2e2)",

  color:
    colors.danger,

  padding: "16px 18px",

  borderRadius:
    radius.md,

  border:
    "1px solid #fecaca",

  fontWeight: "600",

  fontSize: "14px",

  lineHeight: "1.7",
};

const successBox = {
  background:
    "linear-gradient(135deg, #f0fdf4, #dcfce7)",

  color:
    colors.success,

  padding: "16px 18px",

  borderRadius:
    radius.md,

  border:
    "1px solid #bbf7d0",

  fontWeight: "700",

  fontSize: "14px",

  lineHeight: "1.7",
};