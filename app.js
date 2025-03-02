const express = require("express");
const multer = require("multer");
const puppeteer = require("puppeteer");
const fs = require("fs");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;

// Настройка загрузки файлов
const upload = multer({ dest: "uploads/" });

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HTML to PDF API",
      version: "1.0.0",
      description: "API для конвертации HTML-файлов в PDF",
    },
    servers: [{ url: "http://85.202.192.87:3000/" }],
  },
  apis: ["./app.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(express.json({
  limit: '5gb'
}));
app.use(express.urlencoded({ limit: '5gb', extended: true }));
/**
 * @swagger
 * /convert:
 *   post:
 *     summary: Конвертирует HTML-файл в PDF
 *     description: Загружает HTML-файл и возвращает PDF с заданным именем.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: HTML-файл для конвертации
 *               filename:
 *                 type: string
 *                 description: Название выходного PDF (например, output.pdf)
 *     responses:
 *       200:
 *         description: PDF-файл успешно создан и отправлен
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Ошибка, файл не загружен
 *       500:
 *         description: Ошибка сервера
 */
app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const pdfName = req.body.filename || "output.pdf";

    if (!file) {
      return res.status(400).json({ error: "Файл не загружен" });
    }

    const html = fs.readFileSync(file.path, "utf-8");
    const browser = await puppeteer.launch({
      headless: true, // or "new" depending on your version
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true, // Включаем фоновые стили
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });


    await browser.close();
    fs.unlinkSync(file.path);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdfName}"`);
    res.setHeader("Content-Length", pdfBuffer.length); // Указываем размер файла

    res.end(pdfBuffer); // Используем end() вместо send()
  } catch (error) {
    console.error("Ошибка:", error);
    res.status(500).json({ error: "Ошибка обработки" });
  }
});

/**
 * @swagger
 * /convert/base64:
 *   post:
 *     summary: Конвертирует HTML в PDF и возвращает Base64
 *     description: Загружает HTML-файл и возвращает PDF в формате Base64.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: HTML-файл для конвертации
 *     responses:
 *       200:
 *         description: Успешное создание PDF
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 base64:
 *                   type: string
 *                   description: PDF в Base64
 *       400:
 *         description: Ошибка, файл не загружен
 *       500:
 *         description: Ошибка сервера
 */
app.post("/convert/base64", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Файл не загружен" });
    }

    const html = fs.readFileSync(file.path, "utf-8");
    const browser = await puppeteer.launch({
      headless: true, // or "new" depending on your version
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true, // Включаем фоновые стили
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });

    await browser.close();
    fs.unlinkSync(file.path);

    const base64 = uint8ArrayToBase64(pdfBuffer);
    res.json({ base64 });
  } catch (error) {
    console.error("Ошибка:", error);
    res.status(500).json({ error: "Ошибка обработки" });
  }
});
// New endpoint for converting HTML string to PDF and returning Base64
/**
 * @swagger
 * /convert/html/base64:
 *   post:
 *     summary: Конвертирует HTML строку в PDF и возвращает Base64
 *     description: Принимает строку HTML и возвращает PDF в формате Base64.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               html:
 *                 type: string
 *                 description: HTML-строка для конвертации
 *     responses:
 *       200:
 *         description: Успешное создание PDF в формате Base64
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 base64:
 *                   type: string
 *                   description: PDF в Base64
 *       400:
 *         description: Ошибка, HTML не передан
 *       500:
 *         description: Ошибка сервера
 */
app.post("/convert/html/base64", async (req, res) => {
  try {

    console.log('Start convert html to pdf');

    const html = req.body.htmlContent;
    if (!html) {
      return res.status(400).json({ error: "HTML не передан" });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });

    await browser.close();

    // Исправление: Используем Buffer напрямую
    const base64 = pdfBuffer.toString("base64");

    res.json({ base64 });
  } catch (error) {
    console.error("Ошибка:", error);
    res.status(500).json({ error: "Ошибка обработки" });
  }
});

// New endpoint for converting HTML string to PDF and returning it as a file
/**
 * @swagger
 * /convert/html/file:
 *   post:
 *     summary: Конвертирует HTML строку в PDF и возвращает файл
 *     description: Принимает строку HTML и возвращает PDF файл.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               html:
 *                 type: string
 *                 description: HTML-строка для конвертации
 *               filename:
 *                 type: string
 *                 description: Название выходного PDF (например, output.pdf)
 *     responses:
 *       200:
 *         description: PDF-файл успешно создан и отправлен
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Ошибка, HTML не передан
 *       500:
 *         description: Ошибка сервера
 */
app.post("/convert/html/file", async (req, res) => {
  try {
    const html = req.body.html;
    const pdfName = req.body.filename || "output.pdf";

    if (!html) {
      return res.status(400).json({ error: "HTML не передан" });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true, // Включаем фоновые стили
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdfName}"`);
    res.setHeader("Content-Length", pdfBuffer.length); // Указываем размер файла

    res.end(pdfBuffer); // Отправляем файл
  } catch (error) {
    console.error("Ошибка:", error);
    res.status(500).json({ error: "Ошибка обработки" });
  }
});

function uint8ArrayToBase64(uint8Array) {
  let binaryString = String.fromCharCode(...uint8Array);
  return btoa(binaryString);
}

app.listen(port, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${port}`);
  console.log(`📄 Swagger доступен на http://localhost:${port}/api-docs`);
  console.log(`📂 Загрузки доступны в папке uploads`);
});
