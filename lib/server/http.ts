import { NextResponse } from "next/server";

export class RouteError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export function okResponse<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json(
    {
      ok: true,
      ...data,
    },
    { status },
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof RouteError) {
    return errorResponse(error.status, error.code, error.message);
  }

  console.error("Unhandled route error", error);
  return errorResponse(500, "INTERNAL_ERROR", "Something went wrong");
}
