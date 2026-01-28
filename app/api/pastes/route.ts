export const runtime = "nodejs";

import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, ttl_seconds, max_views } = body;

    if (typeof content !== "string" || content.trim() === "") {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    if (
      ttl_seconds !== undefined &&
      (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)
    ) {
      return Response.json({ error: "Invalid ttl_seconds" }, { status: 400 });
    }

    if (
      max_views !== undefined &&
      (!Number.isInteger(max_views) || max_views < 1)
    ) {
      return Response.json({ error: "Invalid max_views" }, { status: 400 });
    }

    const expiresAt =
      ttl_seconds !== undefined
        ? new Date(Date.now() + ttl_seconds * 1000)
        : null;

    const paste = await prisma.paste.create({
      data: {
        content,
        expiresAt,
        maxViews: max_views,
      },
    });

    return Response.json({
      id: paste.id,
      url: `http://localhost:3000/p/${paste.id}`,
    });
  } catch (err: any) {
    console.error("PASTE CREATE ERROR:", err);
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
