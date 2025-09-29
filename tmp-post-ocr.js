import fs from 'fs';
import { FormData, fetch } from 'undici';
(async () => {
  try {
    const fd = new FormData();
    fd.setBoundary('----WebKitFormBoundary7MA4YWxkTrZu0gW');
    fd.append('file', fs.createReadStream('./tmp-ocr-test.txt'));
    const res = await fetch('http://localhost:5001/ocr', { method: 'POST', body: fd, headers: fd.getHeaders ? fd.getHeaders() : {} });
    console.log('status', res.status);
    const text = await res.text();
    console.log(text);
  } catch (e) {
    console.error('err', e);
  }
})();
