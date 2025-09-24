import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { checkoutHandler } from "./routes/checkout";

const app = express();

// Segurança e parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));

// CORS global (inclui pré-flight e garante header em qualquer resposta)
const ALLOWED_ORIGINS = [
  "https://odoutorpds.shop",
  // adicione outros domínios autorizados se necessário
];

app.use((req, res, next) => {
  const origin = (req.headers.origin as string) || "";
  if (origin && (ALLOWED_ORIGINS.includes(origin) || /localhost:\d+$/.test(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    // se preferir travar, remova a linha abaixo
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Pré-flight
app.options("*", (_req, res) => res.status(204).end());

// Health
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// Rotas
app.post("/checkout", checkoutHandler);

// Error handler (mantém CORS nos erros)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("unhandled error:", err?.stack || err);
  res.status(200).json({ ok: false, error: "fatal", detail: { message: err?.message || "Erro inesperado" } });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API up on :${PORT}`));
