// components/AddressForm.tsx
import { useState } from "react";
import { fetchCep } from "@/payments/paradise";

export default function AddressForm() {
  const [cep, setCep] = useState("");
  const [line1, setLine1] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setStateUf] = useState("");

  async function onBlurCep() {
    const clean = cep.replace(/\D/g, "");
    if (clean.length < 8) return;

    try {
      const d = await fetchCep(clean);
      // Preenche só a UI
      setLine1(d.street || "");
      setNeighborhood(d.neighborhood || "");
      setCity(d.city || "");
      setStateUf(d.state || "");
    } catch (e) {
      console.debug("CEP não encontrado", e);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label>CEP</label>
        <input value={cep} onChange={e=>setCep(e.target.value)} onBlur={onBlurCep} className="border p-2 w-full rounded" />
      </div>
      <div>
        <label>Endereço</label>
        <input value={line1} onChange={e=>setLine1(e.target.value)} className="border p-2 w-full rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Número</label>
          <input value={number} onChange={e=>setNumber(e.target.value)} className="border p-2 w-full rounded" />
        </div>
        <div>
          <label>Bairro</label>
          <input value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} className="border p-2 w-full rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Cidade</label>
          <input value={city} onChange={e=>setCity(e.target.value)} className="border p-2 w-full rounded" />
        </div>
        <div>
          <label>UF</label>
          <input value={state} onChange={e=>setStateUf(e.target.value)} className="border p-2 w-full rounded" />
        </div>
      </div>

      {/* IMPORTANTE: esses dados NÃO vão pro payload; o checkout usa endereço fixo */}
      <p className="text-xs text-gray-500">
        Seu endereço é usado só para entrega/comunicação. A confirmação de pagamento é automática.
      </p>
    </div>
  );
}
