import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/guards";
import fs from "node:fs";
import path from "node:path";
import { OUTPUT_DIR } from "@/lib/pdf/generate";

export async function GET(request: NextRequest) {
  const sessionResult = await getSessionUser();
  if (!sessionResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileParam = searchParams.get("file") || searchParams.get("path");
  if (!fileParam) {
    return NextResponse.json({ error: "Missing file or path parameter" }, { status: 400 });
  }

  // Prevent path traversal attacks
  const cleanFileName = path.basename(fileParam);
  if (!cleanFileName.endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are accessible" }, { status: 400 });
  }

  // Search in both primary OUTPUT_DIR and fallback locations
  const searchDirs = [
    path.resolve(process.cwd(), OUTPUT_DIR),
    path.resolve(process.cwd(), "./public/generated/pdfs"),
    path.resolve(process.cwd(), "./generated/pdfs"),
  ];

  let resolvedPath: string | null = null;
  for (const dir of searchDirs) {
    const candidate = path.join(dir, cleanFileName);
    if (fs.existsSync(candidate)) {
      resolvedPath = candidate;
      break;
    }
  }

  if (!resolvedPath) {
    return NextResponse.json({ error: "Requested PDF not found" }, { status: 404 });
  }

  const fileBytes = await fs.promises.readFile(resolvedPath);
  const isDownload = searchParams.get("download") === "true";

  return new NextResponse(fileBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${cleanFileName}"`,
      "Content-Length": fileBytes.length.toString(),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
