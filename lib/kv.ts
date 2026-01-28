import kv from "@/lib/kv";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, ttl_seconds, max_views } = body;

  // ✅ Validate content
  if (typeof content !== "string" || content.trim() === "") {
    return Response.json(
      { error: "content must be a non-empty string" },
      { status: 400 }
    );
  }

  // ✅ Validate ttl_seconds
  if (
    ttl_seconds !== undefined &&
    (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)
  ) {
    return Response.json(
      { error: "ttl_seconds must be an integer >= 1" },
      { status: 400 }
    );
  }

  // ✅ Validate max_views
  if (
    max_views !== undefined &&
    (!Number.isInteger(max_views) || max_views < 1)
  ) {
    return Response.json(
      { error: "max_views must be an integer >= 1" },
      { status: 400 }
    );
  }

  const id = nanoid(8);
  const now = Date.now();

  const paste = {
    content,
    views: 0,
    max_views: max_views ?? null,
    expires_at: ttl_seconds ? now + ttl_seconds * 1000 : null,
  };

  await kv.set(`paste:${id}`, paste);

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return Response.json(
    {
      id,
      url: `${baseUrl}/p/${id}`,
    },
    { status: 201 }
  );
}
