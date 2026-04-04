export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: object;
  headers?: Record<string, string>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 12000);

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
  const url = normalizedBase
    ? new URL(normalizedPath, `${normalizedBase}/`)
    : new URL(normalizedPath, "http://localhost");

  if (query) {
    Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  if (normalizedBase) {
    return url.toString();
  }

  return `${url.pathname}${url.search}`;
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const hasBody = options.body !== undefined;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(options.headers ?? {}),
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type");
  const maybeJson = contentType?.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    if (maybeJson && typeof maybeJson === "object") {
      if ("message" in maybeJson && typeof maybeJson.message === "string") {
        message = maybeJson.message;
      } else if (
        "error" in maybeJson &&
        maybeJson.error &&
        typeof maybeJson.error === "object" &&
        "message" in maybeJson.error &&
        typeof maybeJson.error.message === "string"
      ) {
        message = maybeJson.error.message;
      }
    }
    throw new ApiError(message, response.status, maybeJson ?? undefined);
  }

  return maybeJson as T;
}

export async function downloadFile(path: string, filenameHint: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method: "GET",
      credentials: "include",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Download timed out. Please try again.", 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new ApiError(`Failed to download file (${response.status})`, response.status);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filenameHint;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error. Please try again.";
}
