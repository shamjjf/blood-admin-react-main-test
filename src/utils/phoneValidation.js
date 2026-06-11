import { isValidPhoneNumber } from "libphonenumber-js";

/**
 * Strict, international phone validation backed by libphonenumber-js.
 *
 * Numbers are checked against each country's real numbering plan (prefix +
 * length), not just a digit count — so "1234567890" is rejected for India even
 * though it is 10 digits long, while a valid number for any country is accepted.
 *
 * IMPORTANT: this only *validates*. It never changes how the value is stored.
 * The app keeps storing `phone` = national number (no dial code) and
 * `phoneCode` = the country dial code, exactly as before, so existing logins
 * and the backend are unaffected.
 *
 * @param {string|number} phoneCode dial code, e.g. "91" or "+91"
 * @param {string|number} phone     national number, e.g. "9876543210"
 * @returns {boolean} true only for a valid number for that country
 */
export function isValidIntlPhone(phoneCode, phone) {
  const code = String(phoneCode ?? "").replace(/\D/g, "");
  const national = String(phone ?? "").replace(/\D/g, "");
  if (!code || !national) return false;
  try {
    return isValidPhoneNumber(`+${code}${national}`);
  } catch {
    return false;
  }
}

/**
 * Validate the raw value react-phone-input-2 passes to its onChange handler —
 * the full international number as digits with no leading "+"
 * (e.g. "919876543210"). Use when you have the combined value rather than the
 * separate dial-code / national parts.
 *
 * @param {string} value full intl number digits, e.g. "919876543210"
 * @returns {boolean}
 */
export function isValidIntlPhoneRaw(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return false;
  try {
    return isValidPhoneNumber(`+${digits}`);
  } catch {
    return false;
  }
}
