import { NextResponse } from 'next/server'

export async function GET() {
  const status: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    dependencies: {}
  }

  // Check PDF processing dependencies
  try {
    const pdfParse = await import('pdf-parse')
    status.dependencies.pdfparse = pdfParse.default ? 'available' : 'unavailable'
  } catch (e) {
    status.dependencies.pdfparse = 'unavailable'
  }

  try {
    const { PNG } = await import('pngjs')
    status.dependencies.pngjs = PNG ? 'available' : 'unavailable'
  } catch (e) {
    status.dependencies.pngjs = 'unavailable'
  }

  try {
    const tesseract = await import('tesseract.js')
    status.dependencies.tesseract = tesseract ? 'available' : 'unavailable'
  } catch (e) {
    status.dependencies.tesseract = 'unavailable'
  }

  return NextResponse.json(status)
}
