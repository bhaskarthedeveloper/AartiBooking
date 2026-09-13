// src/lib/validation.ts

export const VALIDATION_PATTERNS = {
  alphaOnly: /^[a-zA-Z\s]+$/,
  textNoSpecial: /^[a-zA-Z0-9\s]+$/,       // Pure alphanumeric + spaces only
  addressAllowed: /^[a-zA-Z0-9\s,]+$/,     // Alphanumeric + spaces + commas only
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  uaeMobile: /^05\d{8}$/,
  whatsappNumber: /^\+\d{8,12}$/,
};

export const FIELD_LIMITS = {
  name: 40,
  mobileDigitsAfterPrefix: 8,
  mobile: 10,
  whatsapp: 12,
  email: 50,
  address: 200,
  liked: 200,
  attended: 200,
  otherSeva: 100,
  landmark: 100,
  city: 50,
  company: 60,
  profession: 60,
  notes: 200,
  noOfLamps: 6,
};

// --- Sanitizer Helpers (use on onChange to block illegal typing) ---

/** Allows only letters, numbers, and spaces */
export function sanitizeTextOnly(val: string): string {
  return val.replace(/[^a-zA-Z0-9\s]/g, "");
}

/** Allows only letters and spaces */
export function sanitizeAlphaOnly(val: string): string {
  return val.replace(/[^a-zA-Z\s]/g, "");
}

/** Allows only alphanumeric, spaces, and commas */
export function sanitizeAddress(val: string): string {
  return val.replace(/[^a-zA-Z0-9\s,]/g, "");
}

// --- Field Validators ---

export function validateFullName(name: string): string | null {
  if (!name || !name.trim()) return "Full name is required.";
  if (name.trim().length > FIELD_LIMITS.name) {
    return `Full name cannot exceed ${FIELD_LIMITS.name} characters.`;
  }
  if (!VALIDATION_PATTERNS.alphaOnly.test(name.trim())) {
    return "Full name should only contain alphabetic letters (no special characters or numbers).";
  }
  return null;
}

export function validateAddress(address: string): string | null {
  if (!address || !address.trim()) return "Address is required.";
  if (address.trim().length > FIELD_LIMITS.address) {
    return `Address cannot exceed ${FIELD_LIMITS.address} characters.`;
  }
  if (!VALIDATION_PATTERNS.addressAllowed.test(address.trim())) {
    return "Address can only contain letters, numbers, and commas (no other special characters).";
  }
  return null;
}

export function validateGenericText(val: string, fieldName: string, maxLength: number, required = false): string | null {
  if (!val || !val.trim()) {
    return required ? `${fieldName} is required.` : null;
  }
  if (val.trim().length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters.`;
  }
  if (!VALIDATION_PATTERNS.textNoSpecial.test(val.trim())) {
    return `${fieldName} cannot contain special characters. Only letters, numbers, and spaces are allowed.`;
  }
  return null;
}

export function validateUAEMobile(mobile: string): string | null {
  if (!mobile || !mobile.trim()) return "Mobile number is required.";
  const cleanMobile = mobile.replace(/\D/g, "");
  if (!cleanMobile.startsWith("05")) {
    return "Mobile number must begin with 05.";
  }
  if (cleanMobile.length !== FIELD_LIMITS.mobile) {
    return `Mobile number must be exactly 10 digits including '05' (e.g. 0501234567).`;
  }
  if (!VALIDATION_PATTERNS.uaeMobile.test(cleanMobile)) {
    return "Please enter a valid 10-digit UAE mobile number starting with 05.";
  }
  return null;
}

export function validateWhatsapp(whatsapp: string): string | null {
  if (!whatsapp || !whatsapp.trim() || whatsapp.trim() === "+") {
    return "WhatsApp number is required.";
  }
  if (!VALIDATION_PATTERNS.whatsappNumber.test(whatsapp.trim())) {
    return "Please enter a valid WhatsApp number with country code (e.g. +971501234567).";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) return "Email address is required.";
  if (email.length > FIELD_LIMITS.email) {
    return `Email address cannot exceed ${FIELD_LIMITS.email} characters.`;
  }
  if (!VALIDATION_PATTERNS.email.test(email.trim())) {
    return "Please enter a valid email address.";
  }
  return null;
}