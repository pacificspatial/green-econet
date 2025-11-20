import CustomError from "../utils/customError.js";

const errorMiddleware = (err, req, res, next) => {
  console.error("Error middleware", err?.error);

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
    });
  }

  // If the error is not a CustomError, send a generic error response
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    statusCode: 500,
    errorCode: "INTERNAL_SERVER_ERROR",
  });
};

export default errorMiddleware;
