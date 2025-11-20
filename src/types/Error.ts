export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  errorCode: string;
}

export interface ApiError extends Error {
  response?: {
    data?: ApiErrorResponse;
    status?: number;
  };
}
