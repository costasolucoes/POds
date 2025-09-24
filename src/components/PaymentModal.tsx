// components/PaymentModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { api } from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  txId: string;
  initialBrcode?: string | null;
  initialQrBase64?: string | null;
};

function normalizeBrcode(s?: string | null) {
  if (!s) return null;
  const clean = s.replace(/\s+/g, "").trim();
  return clean.length > 0 ? clean : null;
}

export default function PaymentModal({
  open,
  onClose,
  txId,
  initialBrcode,
  initialQrBase64,
}: Props) {
  const [status, setStatus] = useState("pending");
  const [brcode, setBrcode] = useState<string | null>(normalizeBrcode(initialBrcode));
  const [qrBase64, setQrBase64] = useState<string | null>(initialQrBase64 || null);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const lastBrcodeRef = useRef<string | null>(null);

  useEffect(() => {
    setBrcode(normalizeBrcode(initialBrcode));
    setQrBase64(initialQrBase64 || null);
  }, [initialBrcode, initialQrBase64]);

  useEffect(() => {
    if (!open) return;
    const shouldGenerate = !qrBase64 && !!brcode && brcode !== lastBrcodeRef.current;
    if (!shouldGenerate) return;

    setQrError(null);
    setQrDataUrl(null);

    QRCode.toDataURL(brcode!, { margin: 1, errorCorrectionLevel: "M", scale: 6 })
      .then((dataUrl) => {
        lastBrcodeRef.current = brcode!;
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.debug("[QR] falhou:", err);
        setQrError("Falha ao gerar QR local");
      });
  }, [open, brcode, qrBase64]);

  const imgSrc = useMemo(() => {
    if (qrBase64) return `data:image/png;base64,${qrBase64}`;
    if (qrDataUrl) return qrDataUrl;
    return null;
  }, [qrBase64, qrDataUrl]);

  // POLLING no Render
  useEffect(() => {
    if (!open || !txId) return;

    const iv = setInterval(async () => {
      try {
        const d = await api.getTx(txId);

        setStatus(d.status || "pending");

        const p = d.pix || {};
        const maybeBrcode =
          p.brcode || p.pix_qr_code || p.copia_e_cola || p.payload || null;
        const maybeBase64 = p.qr_code_base64 || null;

        if (maybeBase64 && !qrBase64) setQrBase64(maybeBase64);
        const norm = normalizeBrcode(maybeBrcode);
        if (norm && norm !== brcode) setBrcode(norm);

        if (d.status === "paid") {
          clearInterval(iv);
          setTimeout(() => (window.location.href = "/obrigado"), 700);
        }
      } catch (e) {
        // ignora erros transitórios
      }
    }, 2500);

    return () => clearInterval(iv);
  }, [open, txId, brcode, qrBase64]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/40 z-50">
      <div className="bg-white rounded-2xl p-5 w-[340px] text-center shadow-xl">
        <h3 className="text-lg font-semibold mb-3">Pague com PIX</h3>

        {imgSrc ? (
          <img key={imgSrc} src={imgSrc} width={220} height={220} className="mx-auto select-none" alt="QR Code PIX" />
        ) : qrError ? (
          <div className="text-red-600 text-sm py-10">{qrError}. Use o copia-e-cola abaixo.</div>
        ) : brcode ? (
          <div className="animate-pulse text-sm py-16">Gerando QR…</div>
        ) : (
          <div className="animate-pulse text-sm py-16">Aguardando PIX…</div>
        )}

        {brcode && (
          <div className="text-xs mt-3 break-all">
            <div className="mb-1">Copia e cola:</div>
            <div className="p-2 bg-gray-100 rounded">{brcode}</div>
            <button className="mt-2 px-3 py-1 rounded bg-black text-white" onClick={() => navigator.clipboard.writeText(brcode)}>
              Copiar
            </button>
          </div>
        )}

        <div className="mt-3 text-sm">Status: <b>{status}</b></div>

        <button className="mt-4 px-4 py-2 rounded border" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}