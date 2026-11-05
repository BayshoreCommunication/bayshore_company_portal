import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// After files went straight to the backend (lib/sendToBackend.ts): the pages that show them,
// to be rebuilt with what was saved. { pages: ["/content", ...] }
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.accessToken) return Response.json({ success: false }, { status: 401 });

  const { pages } = (await request.json().catch(() => ({}))) as { pages?: unknown };
  const valid = Array.isArray(pages) ? pages.filter((page): page is string => typeof page === "string" && /^\/[\w\-/]{0,200}$/.test(page)) : [];
  valid.slice(0, 10).forEach((page) => revalidatePath(page));
  return Response.json({ success: true });
}
