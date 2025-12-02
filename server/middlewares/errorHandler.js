const errorMiddleware = (err, req, res, next) => {
  const origin = req.headers.origin;
  res.header("Access-Control-Allow-Origin",  origin || "");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
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
