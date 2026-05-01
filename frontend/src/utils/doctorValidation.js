export const DOCTOR_PHONE_REGEX = /^\+[1-9]\d{9,14}$/;

const SPECIALTY_ALLOWED_REGEX = /^[\p{L}\s&'./()-]+$/u;

export function normalizeWhitespace(value = "") {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeDoctorPhone(value = "") {
  return value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}

export function isValidDoctorPhone(value) {
  return DOCTOR_PHONE_REGEX.test(value);
}

export function isValidDoctorSpecialty(value) {
  if (value.length < 3 || value.length > 100) return false;
  const lettersCount = Array.from(value).filter((char) => /\p{L}/u.test(char)).length;
  return lettersCount >= 3 && SPECIALTY_ALLOWED_REGEX.test(value);
}
