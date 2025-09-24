// src/lib/validate.ts
export function validateFormLite(form: any) {
  const required = ["name","email","document","phone","postal_code","line1","number","city","state"];
  const empty = required.filter(k => String(form?.[k] ?? "").trim() === "");
  return { ok: empty.length === 0, empty };
}