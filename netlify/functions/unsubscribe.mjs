import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response("Invalid JSON", { status: 400 });
  }
  const { endpoint } = body || {};
  if (!endpoint) return new Response("Missing endpoint", { status: 400 });
  const store = getStore("push-subscriptions");
  const key = Buffer.from(endpoint).toString("base64url").slice(0, 200);
  await store.delete(key);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" }
  });
};
