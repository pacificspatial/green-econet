/**
 * Send a successful API response.
 *
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {any} data - Data to send in the response
 * @param {number} status - HTTP status code (default: 200)
 */
export const success = (res, message, data, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error API response.
 *
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code (default: 500)
 * @param {any} errors - Optional detailed errors
 */
export const error = (res, message, status = 500, errors = null) => {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
};
