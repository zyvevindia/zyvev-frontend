import {
  isValidIndiaCity,
  isValidIndiaState,
} from "../data/indiaLocations";

/* =========================================================
   ===================== HELPERS ===========================
   ========================================================= */

const cleanString = (value = "") => {

  return String(value)
    .trim()
    .replace(/\s+/g, " ");
};

/* =========================================================
   ===================== REQUIRED ==========================
   ========================================================= */

export const isRequired = (value) => {

  return cleanString(value).length > 0;
};

/* =========================================================
   ===================== EMAIL =============================
   ========================================================= */

export const isValidEmail = (email = "") => {

  const cleaned = cleanString(email);

  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regex.test(cleaned);
};

/* =========================================================
   ===================== PHONE =============================
   ========================================================= */

export const isValidIndianPhone = (
  phone = ""
) => {

  const cleaned =
    phone.replace(/\D/g, "");

  return /^[6-9]\d{9}$/.test(cleaned);
};

/* =========================================================
   ===================== PASSWORD ==========================
   ========================================================= */

export const isStrongPassword = (
  password = ""
) => {

  return password.length >= 6;
};

/* =========================================================
   ===================== SLUG ==============================
   ========================================================= */

export const isValidSlug = (
  slug = ""
) => {

  return /^[a-z0-9-]+$/.test(
    cleanString(slug)
  );
};

/* =========================================================
   ===================== PRICE =============================
   ========================================================= */

export const isValidPrice = (
  value
) => {

  return (
    !isNaN(value) &&
    Number(value) > 0
  );
};

/* =========================================================
   ===================== NAME ==============================
   ========================================================= */

export const isValidName = (
  name = ""
) => {

  return cleanString(name).length >= 2;
};

/* =========================================================
   ===================== TEXT LIMIT ========================
   ========================================================= */

export const hasMaxLength = (
  value = "",
  max = 500
) => {

  return cleanString(value).length <= max;
};

/* =========================================================
   ===================== SANITIZE ==========================
   ========================================================= */

export const sanitizeInput = (
  value = ""
) => {

  return cleanString(value)

    .replace(/<script.*?>.*?<\/script>/gi, "")

    .replace(/[<>]/g, "");
};

/* =========================================================
   ===================== LEAD FORM =========================
   ========================================================= */

export const validateLeadForm = ({
  name,
  phone,
  email,
  state,
  city,
  interestedVehicle,
  message,
}) => {

  const errors = {};

  if (!isValidName(name)) {

    errors.name =
      "Please enter valid name";
  }

  if (
    !isValidIndianPhone(phone)
  ) {

    errors.phone =
      "Please enter valid mobile number";
  }

  if (cleanString(email) && !isValidEmail(email)) {

    errors.email =
      "Please enter valid email";
  }

  if (!isValidIndiaState(state)) {
    errors.state = "Please select your state";
  }

  if (!isValidIndiaCity(state, city)) {
    errors.city = isValidIndiaState(state)
      ? "Please select your city"
      : "Please select state first";
  }

  if (
    !isRequired(interestedVehicle) ||
    cleanString(interestedVehicle).length < 2
  ) {

    errors.interestedVehicle =
      "Please enter the vehicle you are interested in";
  }

  if (
    message &&
    !hasMaxLength(
      message,
      2000
    )
  ) {

    errors.message =
      "Message is too long (max 2000 characters)";
  }

  return {

    isValid:
      Object.keys(errors).length === 0,

    errors,
  };
};

export const validateTestDriveForm = ({
  name,
  phone,
  state,
  city,
  interestedVehicle,
}) => {
  const errors = {};

  if (!isValidName(name)) {
    errors.name = "Please enter valid name";
  }

  if (!isValidIndianPhone(phone)) {
    errors.phone = "Please enter valid mobile number";
  }

  if (!isValidIndiaState(state)) {
    errors.state = "Please select your state";
  }

  if (!isValidIndiaCity(state, city)) {
    errors.city = isValidIndiaState(state)
      ? "Please select your city"
      : "Please select state first";
  }

  if (
    !isRequired(interestedVehicle) ||
    cleanString(interestedVehicle).length < 2
  ) {
    errors.interestedVehicle =
      "Please select a variant";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/* =========================================================
   ================= LEGACY MINI LEAD ======================
   ========================================================= */

export const validateMiniLeadForm = ({
  name,
  phone,
}) => {

  const errors = {};

  if (!isValidName(name)) {

    errors.name =
      "Please enter valid name";
  }

  if (
    !isValidIndianPhone(phone)
  ) {

    errors.phone =
      "Please enter valid mobile number";
  }

  return {

    isValid:
      Object.keys(errors).length === 0,

    errors,
  };
};

/* =========================================================
   ===================== LOGIN FORM ========================
   ========================================================= */

export const validateLoginForm = ({
  email,
  password,
}) => {

  const errors = {};

  if (!isValidEmail(email)) {

    errors.email =
      "Please enter valid email";
  }

  if (
    !isStrongPassword(password)
  ) {

    errors.password =
      "Password must be minimum 6 characters";
  }

  return {

    isValid:
      Object.keys(errors).length === 0,

    errors,
  };
};

/* =========================================================
   ===================== CAR FORM ==========================
   ========================================================= */

export const validateCarForm = ({
  name,
  brand,
  slug,
  startingPrice,
}) => {

  const errors = {};

  if (!isValidName(name)) {

    errors.name =
      "Car name required";
  }

  if (!isValidName(brand)) {

    errors.brand =
      "Brand required";
  }

  if (!isValidSlug(slug)) {

    errors.slug =
      "Invalid slug format";
  }

  if (
    !isValidPrice(startingPrice)
  ) {

    errors.startingPrice =
      "Invalid price";
  }

  return {

    isValid:
      Object.keys(errors).length === 0,

    errors,
  };
};