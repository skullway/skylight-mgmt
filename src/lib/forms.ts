import type { z } from "zod";

// Shared shape for useActionState-driven forms.
export type FormState<V = Record<string, string>> = {
  error?: string;
  message?: string;
  values?: V;
};

export function formValues(formData: FormData, keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "").trim()]));
}

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "הנתונים אינם תקינים";
}
