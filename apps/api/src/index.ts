import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    service: "api",
    framework: "hono",
  });
});

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "api",
  });
});

export default app;
