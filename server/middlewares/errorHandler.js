const errorMiddleware = (err, req, res, next) => {
  console.error("Error middleware:", err.message);

  // Use properties if they exist, otherwise fallback to defaults
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    errorCode,
  });
};

export default errorMiddleware;
