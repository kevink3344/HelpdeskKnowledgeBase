import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, attachmentsTable } from "@workspace/db";
import { DeleteAttachmentParams } from "@workspace/api-zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/attachments/upload", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const ticketIdRaw = req.body.ticketId;
  const ticketId = parseInt(ticketIdRaw, 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: "Invalid ticketId" });
    return;
  }

  const [attachment] = await db
    .insert(attachmentsTable)
    .values({
      ticketId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      url: `/api/attachments/files/${req.file.filename}`,
    })
    .returning();

  res.status(201).json(attachment);
});

router.get("/attachments/files/:filename", (req, res): void => {
  const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  const safeName = path.basename(filename);
  const filePath = path.join(uploadDir, safeName);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.sendFile(filePath);
});

router.delete("/attachments/:id", async (req, res): Promise<void> => {
  const params = DeleteAttachmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [attachment] = await db
    .delete(attachmentsTable)
    .where(eq(attachmentsTable.id, params.data.id))
    .returning();

  if (!attachment) {
    res.status(404).json({ error: "Attachment not found" });
    return;
  }

  const filename = path.basename(attachment.url);
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.sendStatus(204);
});

export default router;
