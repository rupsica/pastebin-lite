export const runtime = "nodejs";

import { prisma } from "../../../../lib/prisma";

function getNow(req: Request) {
  // Deterministic time for testing
  if (process.env.TEST_MODE === "1") {
    const header = req.headers.get("x-test-now-ms");
    if (header) {
      const ms = Number(header);
      if (!Number.isNaN(ms)) {
        return new Date(ms);
      }
    }
  }
  return new Date();
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const paste = await prisma.paste.findUnique({
    where: { id: params.id },
  });

  if (!paste) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const now = getNow(_req);

  // Check TTL
  if (paste.expiresAt && paste.expiresAt <= now) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Check view limit
  if (paste.maxViews !== null && paste.views >= paste.maxViews) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Increment view count
  const updated = await prisma.paste.update({
    where: { id: paste.id },
    data: { views: { increment: 1 } },
  });

  return Response.json({
    content: updated.content,
    remaining_views:
      updated.maxViews !== null
        ? Math.max(updated.maxViews - updated.views, 0)
        : null,
    expires_at: updated.expiresAt,
  });
}
