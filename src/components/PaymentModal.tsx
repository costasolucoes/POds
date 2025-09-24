import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

type Props = {
  open: boolean;
  onClose: () => void;
  txId: string;                       // usado para o polling externo (seu código já faz)
  initialBrcode?: string | null;      // copia-e-cola que veio do /checkout
  initialQrBase64?: string | null;    // imagem pronta que veio do /checkout (se vier)
};

function normalizeBrcode(s?: string | null) {
  if (!s) return null;
  // remove quebras/espacos invisíveis que quebram a lib de QR
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

  console.log('PaymentModal renderizado:', { open, txId, initialBrcode, initialQrBase64 });

  // estados do PIX (controlados pelo modal e pelo polling externo)
  const [brcode, setBrcode] = useState<string | null>(normalizeBrcode(initialBrcode));
  const [qrBase64, setQrBase64] = useState<string | null>(initialQrBase64 || null);

  // imagem de QR gerada localmente a partir do brcode
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  
  // estado para feedback de cópia
  const [copied, setCopied] = useState(false);

  // guardar último brcode usado pra evitar gerar QR repetido
  const lastBrcodeRef = useRef<string | null>(null);

  // quando props mudarem (ex.: modal reaberto com dados novos)
  useEffect(() => {
    setBrcode(normalizeBrcode(initialBrcode));
    setQrBase64(initialQrBase64 || null);
  }, [initialBrcode, initialQrBase64]);

  // gera QR local SE não veio imagem pronta e se temos copia-e-cola
  useEffect(() => {
    if (!open) return;

    const shouldGenerate = !qrBase64 && !!brcode && brcode !== lastBrcodeRef.current;

    if (!shouldGenerate) return;

    setQrError(null);
    setQrDataUrl(null); // limpa para forçar re-render enquanto gera

    QRCode.toDataURL(brcode!, {
      margin: 1,
      errorCorrectionLevel: "M",  // bom equilíbrio (L/M/Q/H)
      scale: 6,                   // nitidez boa sem ficar gigante
    })
      .then((dataUrl) => {
        lastBrcodeRef.current = brcode!;
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.debug("[QR] falhou ao gerar a partir do brcode:", err);
        setQrError("Falha ao gerar QR local");
      });
  }, [open, brcode, qrBase64]);

  // Exibição: dá preferência para imagem pronta do provedor
  const imgSrc = useMemo(() => {
    if (qrBase64) return `data:image/png;base64,${qrBase64}`;
    if (qrDataUrl) return qrDataUrl;
    return null;
  }, [qrBase64, qrDataUrl]);

  // --- POLLING DO STATUS/PIX (seu back já normaliza /tx/:id) ---
  useEffect(() => {
    if (!open || !txId) return;

    const iv = setInterval(async () => {
      try {
        const r = await fetch(`http://localhost:3333/tx/${encodeURIComponent(txId)}`);
        const d = await r.json();

        setStatus(d.status || "pending");

        // se o back começar a devolver o pix depois, atualiza os estados aqui
        const p = d.pix || {};
        const maybeBrcode =
          p.brcode || p.pix_qr_code || p.copia_e_cola || p.payload || null;
        const maybeBase64 = p.qr_code_base64 || null;

        if (maybeBase64 && !qrBase64) setQrBase64(maybeBase64);
        if (maybeBrcode && normalizeBrcode(maybeBrcode) !== brcode) {
          setBrcode(normalizeBrcode(maybeBrcode));
        }

        if (d.status === "paid") {
          clearInterval(iv);
          setTimeout(() => (window.location.href = "/obrigado"), 700);
        }
      } catch (e) {
        // ignora falhas momentâneas de polling
      }
    }, 2500);

    return () => clearInterval(iv);
  }, [open, txId, brcode, qrBase64]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 grid place-items-center bg-black/40" 
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        // Só fecha se clicar no fundo, não no modal
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl p-5 w-[340px] text-center shadow-xl relative"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()} // Impede que clique no modal feche
      >
        {/* Botão X no canto superior direito */}
        <button
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Botão X clicado');
            onClose();
          }}
        >
          ×
        </button>
        
        <h3 className="text-lg font-semibold mb-3">Pague com PIX</h3>

        {/* Imagem do QR */}
        {imgSrc ? (
          <img
            key={imgSrc} // força refresh se o src trocar
            src={imgSrc}
            width={220}
            height={220}
            className="mx-auto select-none"
            alt="QR Code PIX"
          />
        ) : qrError ? (
          <div className="text-red-600 text-sm py-10">
            {qrError}. Use o copia-e-cola abaixo.
          </div>
        ) : brcode ? (
          <div className="animate-pulse text-sm py-16">Gerando QR…</div>
        ) : (
          <div className="animate-pulse text-sm py-16">Aguardando PIX…</div>
        )}

        {/* Copia-e-cola */}
        {brcode && (
          <div className="text-xs mt-3 break-all">
            <div className="mb-1">Copia e cola:</div>
            <div 
              className={`p-2 bg-gray-100 rounded cursor-pointer transition-all duration-300 ${
                copied 
                  ? 'bg-green-100 border-2 border-green-500 scale-105' 
                  : 'hover:bg-gray-200 border-2 border-transparent'
              }`}
              style={{ pointerEvents: 'auto' }}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await navigator.clipboard.writeText(brcode);
                  console.log('PIX copiado para clipboard');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch (error) {
                  console.error('Erro ao copiar PIX:', error);
                  // Fallback para navegadores mais antigos
                  const textArea = document.createElement('textarea');
                  textArea.value = brcode;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
            >
              {brcode}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {copied ? '✓ Copiado! Clique novamente para copiar' : 'Clique no código acima para copiar'}
            </div>
          </div>
        )}

        <div className="mt-3 text-sm">
          Status: <b>{status}</b>
        </div>

        {/* Toast de sucesso */}
        {copied && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[10001] animate-bounce">
            ✓ PIX copiado com sucesso!
          </div>
        )}

        <button 
          className="mt-4 px-4 py-2 rounded border hover:bg-gray-100 transition-colors"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Botão Fechar clicado');
            onClose();
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}