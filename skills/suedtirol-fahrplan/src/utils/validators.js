/**
 * Input validation utilities
 */

// Minimum query length
const MIN_QUERY_LENGTH = 2;

// Maximum query length
const MAX_QUERY_LENGTH = 100;

// Date format: YYYYMMDD
const DATE_REGEX = /^\d{8}$/;

// Time format: HH:mm
const TIME_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)$/;

// Stop ID format: numeric (e.g., 66000468)
const STOP_ID_REGEX = /^\d+$/;

/**
 * Validate stop search query
 * @param {string} query - Search query
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateStopQuery(query) {
  if (!query || typeof query !== 'string') {
    return {
      valid: false,
      error: 'Bitte gib einen Haltestellennamen ein.'
    };
  }

  const trimmed = query.trim();

  if (trimmed.length < MIN_QUERY_LENGTH) {
    return {
      valid: false,
      error: `Der Name muss mindestens ${MIN_QUERY_LENGTH} Zeichen lang sein.`
    };
  }

  if (trimmed.length > MAX_QUERY_LENGTH) {
    return {
      valid: false,
      error: `Der Name darf maximal ${MAX_QUERY_LENGTH} Zeichen lang sein.`
    };
  }

  return { valid: true };
}

/**
 * Validate route parameters
 * @param {string} from - Origin
 * @param {string} to - Destination
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateRoute(from, to) {
  const fromValidation = validateStopQuery(from);
  if (!fromValidation.valid) {
    return {
      valid: false,
      error: `Ursprung: ${fromValidation.error}`
    };
  }

  const toValidation = validateStopQuery(to);
  if (!toValidation.valid) {
    return {
      valid: false,
      error: `Ziel: ${toValidation.error}`
    };
  }

  if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
    return {
      valid: false,
      error: 'Ursprung und Ziel können nicht identisch sein.'
    };
  }

  return { valid: true };
}

/**
 * Validate date format (YYYYMMDD)
 * @param {string} date - Date string
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateDate(date) {
  if (!DATE_REGEX.test(date)) {
    return {
      valid: false,
      error: 'Ungültiges Datumsformat. Verwende: YYYYMMDD (z.B. 20260221)'
    };
  }

  const year = parseInt(date.substring(0, 4), 10);
  const month = parseInt(date.substring(4, 6), 10);
  const day = parseInt(date.substring(6, 8), 10);

  if (month < 1 || month > 12) {
    return {
      valid: false,
      error: 'Ungültiger Monat (01-12)'
    };
  }

  if (day < 1 || day > 31) {
    return {
      valid: false,
      error: 'Ungültiger Tag (01-31)'
    };
  }

  return { valid: true };
}

/**
 * Validate time format (HH:mm)
 * @param {string} time - Time string
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateTime(time) {
  if (!TIME_REGEX.test(time)) {
    return {
      valid: false,
      error: 'Ungültiges Zeitformat. Verwende: HH:mm (z.B. 14:30)'
    };
  }

  return { valid: true };
}

/**
 * Check if string looks like a stop ID
 * @param {string} value - Value to check
 * @returns {boolean} True if it looks like a stop ID
 */
function isStopId(value) {
  return STOP_ID_REGEX.test(value);
}

/**
 * Sanitize user input for display
 * @param {string} input - Raw input
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .substring(0, MAX_QUERY_LENGTH)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

/**
 * Parse route command arguments
 * @param {string} args - Command arguments (e.g., "Brixen to Bozen")
 * @returns {{from: string, to: string, valid: boolean, error?: string}} Parsed args
 */
function parseRouteArgs(args) {
  if (!args || typeof args !== 'string') {
    return {
      from: '',
      to: '',
      valid: false,
      error: 'Bitte gib Ursprung und Ziel an: /route <Von> to <Nach>'
    };
  }

  // Support both "to" and "nach" as separators
  const separators = [' to ', ' nach '];
  let parts = [];
  
  for (const separator of separators) {
    parts = args.split(separator);
    if (parts.length === 2) {
      break;
    }
  }

  if (parts.length !== 2) {
    return {
      from: '',
      to: '',
      valid: false,
      error: 'Bitte verwende "to" oder "nach" als Trennung:\n/route Brixen to Bozen\n/route Brixen nach Bozen'
    };
  }

  const from = parts[0].trim();
  const to = parts[1].trim();

  const validation = validateRoute(from, to);
  
  return {
    from,
    to,
    valid: validation.valid,
    error: validation.error
  };
}

/**
 * Get current date in YYYYMMDD format
 * @returns {string} Today's date
 */
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Get current time in HH:mm format
 * @returns {string} Current time
 */
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

module.exports = {
  validateStopQuery,
  validateRoute,
  validateDate,
  validateTime,
  isStopId,
  sanitizeInput,
  parseRouteArgs,
  getCurrentDate,
  getCurrentTime,
  MIN_QUERY_LENGTH,
  MAX_QUERY_LENGTH
};
