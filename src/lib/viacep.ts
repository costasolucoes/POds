// src/lib/viacep.ts
const onlyDigits = (s?: string) => (s ?? "").replace(/\D/g, "");

export async function fetchViaCEP(cep: string) {
  const d = onlyDigits(cep);
  if (d.length !== 8) throw new Error("CEP deve ter 8 dígitos");
  const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (j.erro) throw new Error("CEP não encontrado");
  return {
    street: j.logradouro || "",
    neighborhood: j.bairro || "",
    city: j.localidade || "",
    state: j.uf || "",
  };
}
