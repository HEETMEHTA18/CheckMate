FROM node:18-bullseye

# Install system deps for Tesseract OCR
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libleptonica-dev \
    libtesseract-dev \
    pkg-config \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/ocr

# Copy package files from repo root (we keep dependency list unified)
COPY package*.json ./
RUN npm ci --production

# Copy OCR server code
COPY ocr-server.js ./

EXPOSE 5001
ENV PORT=5001

CMD ["node", "ocr-server.js"]
