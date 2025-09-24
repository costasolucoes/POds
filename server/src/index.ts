import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { checkoutHandler } from "./routes/checkout";

const app = express();

// Segurança + logs
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

// CORS robusto (front em odoutorpds.shop)
const ALLOWED = [
  "https://odoutorpds.shop",
  "https://www.odoutorpds.shop",
  "http://localhost:3000"
];
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin as string | undefined;
  if (origin && ALLOWED.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Saúde
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Rotas
app.post("/checkout", checkoutHandler);

// Error handler (mantém CORS nos erros)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("unhandled error:", err?.stack || err);
  res.status(200).json({ ok: false, error: "fatal", detail: { message: err?.message || "Erro inesperado" } });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
});
