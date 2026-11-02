import { NextResponse } from "next/server";
import { HttpError } from "./auth";

/** Wraps an API handler so thrown HttpErrors become JSON error responses. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}

export function bad(message: string, status = 400): never {
  throw new HttpError(status, message);
}

export const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const int = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : NaN;
};
export const strArr = (v: unknown) =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean).slice(0, 20) : [];
