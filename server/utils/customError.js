class CustomError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);

    // Setting the properties
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    // Set the name to CustomError so that it's easier to identify in stack traces
    this.name = this.constructor.name;

    // Capturing the stack trace (optional)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default CustomError;
