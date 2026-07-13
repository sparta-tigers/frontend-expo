export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly details?: unknown,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    // TS 컴파일 후 instanceof 체크를 위해 명시적으로 prototype을 세팅
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkError extends AppError {
  constructor(cause?: unknown) {
    super(
      "네트워크 요청을 처리하지 못했어요.",
      "NETWORK_ERROR",
      undefined,
      undefined,
      cause,
    );
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    status: number,
    code: string,
    details?: unknown,
  ) {
    super(message, code, status, details);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message, "VALIDATION_ERROR", 422);
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

const USER_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "네트워크 연결을 확인해 주세요.",
  NOT_FOUND: "요청하신 항목을 찾을 수 없어요.",
  UNAUTHORIZED: "로그인이 필요해요.",
  AUTH_FAILED: "이메일 또는 비밀번호를 확인해 주세요.",
  FORBIDDEN: "접근 권한이 없어요.",
  VALIDATION_ERROR: "입력 내용을 다시 확인해 주세요.",
  RATE_LIMITED: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.",
  UNKNOWN_ERROR: "알 수 없는 문제가 생겼어요. 잠시 후 다시 시도해주세요.",
};

export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return USER_MESSAGES[error.code] ?? USER_MESSAGES.UNKNOWN_ERROR;
  }
  return USER_MESSAGES.UNKNOWN_ERROR;
}
