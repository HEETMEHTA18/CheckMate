# OCR Microservice Setup

1. Install dependencies (in your project root):
   npm install express multer tesseract.js cors

2. Start the OCR server:
   node ocr-server.js

3. The server will listen on http://localhost:5001/ocr
   - POST an image file as form-data with key 'file' to /ocr
   - Response: { text: "...extracted text..." }

4. Update your Next.js API route to POST the uploaded file to this endpoint and use the returned text for name extraction.

This keeps OCR logic out of your Next.js API and avoids deployment/runtime issues.