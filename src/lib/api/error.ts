import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type PostgrestErrorLike = {
  code?: string;
  message?: string;
};

function isPostgrestError(error: unknown): error is PostgrestErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

// Postgres error codes we can confidently attribute to bad client input,
// mapped to a clean 4xx instead of falling through to a generic 500.
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const PG_ERROR_MAP: Record<
  string,
  { status: number; code: string; message: string }
> = {
  "23503": {
    status: 400,
    code: "INVALID_REFERENCE",
    message: "참조한 항목이 존재하지 않습니다",
  },
  "23505": {
    status: 409,
    code: "DUPLICATE",
    message: "이미 존재하는 값입니다",
  },
  "22P02": {
    status: 400,
    code: "VALIDATION_ERROR",
    message: "입력값 형식이 올바르지 않습니다",
  },
};

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  if (isPostgrestError(error) && error.code && PG_ERROR_MAP[error.code]) {
    const mapped = PG_ERROR_MAP[error.code];
    return NextResponse.json(
      { error: { code: mapped.code, message: mapped.message } },
      { status: mapped.status },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
    { status: 500 },
  );
}
