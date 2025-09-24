// BotaoPixNovo.tsx
import { useState } from "react";
import { buildCheckoutPayload, createCheckout, CartItem } from "@/payments/paradise";
import PaymentModal from "@/components/PaymentModal";

export default function BotaoPixNovo({ cart }: { cart: CartItem[] }) {
  const [open, setOpen] = useState(false);
  const [txId, setTxId] = useState("");
  const [pixCode, setPixCode] = useState<string|null>(null);
  const [pixBase64, setPixBase64] = useState<string|null>(null);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    try {
      setBusy(true);

      const payload = buildCheckoutPayload({
        items: cart, // pode estar com "R$ 54,90": a função corrige pra centavos
        customer: {
          name: "Cliente Teste",
          email: "cliente@example.com",
          document: "52998224725",
          phone: "+55 (11) 99999-9999",
        },
        // address aqui é ignorado no build (endereços do form não vão pra API)
        address: {
          line1: "qualquer",
          number: "qualquer",
          neighborhood: "qualquer",
          city: "qualquer",
          state: "SP",
          postal_code: "00000-000",
          country: "BR",
        },
        metadata: { origem: "botao-novo" },
      });

      const resp = await createCheckout(payload);

      if (resp.checkoutUrl) {
        window.location.href = resp.checkoutUrl;
        return;
      }

      setTxId(resp.txId || "");
      setPixCode(resp.pixCode);
      setPixBase64(resp.qrBase64);
      setOpen(true);
    } catch (e) {
      console.error(e);
      alert("Falha ao gerar PIX. Verifique o console.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={onClick} disabled={busy} className="px-4 py-2 rounded bg-black text-white">
        {busy ? "Processando…" : "Pagar com PIX (novo botão)"}
      </button>

      <PaymentModal
        open={open}
        onClose={() => setOpen(false)}
        txId={txId}
        initialBrcode={pixCode}
        initialQrBase64={pixBase64}
      />
    </>
  );
}
