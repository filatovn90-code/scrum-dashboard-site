import { ensureHealthSchema } from "../../lib/health-schema.js";
import { importAppleHealthZip, parseMultipartZipUpload } from "../../lib/health-import.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      ok: false,
      error: "Method not allowed."
    });
  }

  const userId = String(req.headers["x-user-id"] || "").trim();
  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: "Не удалось определить пользователя."
    });
  }

  try {
    await ensureHealthSchema();
    const upload = await parseMultipartZipUpload(req);
    const result = await importAppleHealthZip({
      userId,
      fileName: upload.fileName,
      fileHash: upload.fileHash,
      tempFilePath: upload.tempFilePath
    });

    if (result.alreadyImported) {
      return res.status(200).json({
        ok: true,
        alreadyImported: true,
        message: "Этот архив уже был загружен",
        import: result.import
      });
    }

    return res.status(200).json({
      ok: true,
      alreadyImported: false,
      message: "Импорт завершён",
      result
    });
  } catch (error) {
    console.error("POST /api/health/import failed", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Не удалось импортировать архив Apple Health."
    });
  }
}
