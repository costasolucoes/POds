// src/lib/validate.ts
export type Address = {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type CheckoutForm = {
  name: string;
  email: string;
  document: string; // CPF (qualquer texto)
  phone: string;    // qualquer texto
  address: Address;
};

// Validação "lite": só checa se está preenchido (qualquer string não vazia)
export function validateFormLite(f: CheckoutForm) {
  const errors: Record<string, string> = {};
  const req = (v?: any) => String(v ?? "").trim().length > 0;

  if (!req(f.name)) errors.name = "Preencha este campo";
  if (!req(f.email)) errors.email = "Preencha este campo";
  if (!req(f.document)) errors.document = "Preencha este campo";
  if (!req(f.phone)) errors.phone = "Preencha este campo";

  if (!req(f.address.cep)) errors["address.cep"] = "Preencha este campo";
  if (!req(f.address.street)) errors["address.street"] = "Preencha este campo";
  if (!req(f.address.number)) errors["address.number"] = "Preencha este campo";
  if (!req(f.address.neighborhood)) errors["address.neighborhood"] = "Preencha este campo";
  if (!req(f.address.city)) errors["address.city"] = "Preencha este campo";
  if (!req(f.address.state)) errors["address.state"] = "Preencha este campo";

  return { ok: Object.keys(errors).length === 0, errors };
}
