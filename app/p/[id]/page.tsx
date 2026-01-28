export const runtime = "nodejs";

import { prisma } from "../../../lib/prisma";
import { notFound } from "next/navigation";

function getNow(headers: Headers) {
  if (process.env.TEST_MODE === "1") {
    const header = headers.get("x-test-now-ms");
    if (header) {
      const ms = Number(header);
      if (!Number.isNaN(ms)) {
        return new Date(ms);
      }
    }
  }
  return new Date();
}

export default async function PastePage({
  params,
}: {
  params: { id: string };
}) {
  const paste = await prisma.paste.findUnique({
    where: { id: params.id },
  });

  if (!paste) {
    notFound();
  }

  const now = getNow(new Headers());

  // TTL check
  if (paste.expiresAt && paste.expiresAt <= now) {
    notFound();
  }

  // View limit check
  if (paste.maxViews !== null && paste.views >= paste.maxViews) {
    notFound();
  }

  // Increment view count
  const updated = await prisma.paste.update({
    where: { id: paste.id },
    data: { views: { increment: 1 } },
  });

  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Paste</h1>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          background: "#f5f5f5",
          padding: "1rem",
          borderRadius: "6px",
        }}
      >
        {updated.content}
      </pre>
    </main>
  );
}
