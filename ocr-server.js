// Simple OCR microservice using Express and Tesseract.js
const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const cors = require('cors');
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

app.post('/ocr', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health endpoint for orchestrators (Render, etc.)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', pid: process.pid, uptime: process.uptime() });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`OCR server running on port ${PORT}`);
});
