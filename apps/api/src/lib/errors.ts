export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const badRequest = (msg: string, code = "bad_request") => new HttpError(400, code, msg);
export const unauthorized = () => new HttpError(401, "unauthorized", "Sign in required");
export const forbidden = (msg = "Forbidden") => new HttpError(403, "forbidden", msg);
export const notFound = (msg = "Not found") => new HttpError(404, "not_found", msg);
export const conflict = (msg: string, code = "conflict") => new HttpError(409, code, msg);
