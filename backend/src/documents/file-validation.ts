import { BadRequestException } from '@nestjs/common';
import type { UploadedDocumentFile } from './file.types.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function validateUploadedFile(file: UploadedDocumentFile, allowPdf = true): void {
  if (file.size < 1 || file.size > MAX_FILE_SIZE || file.buffer.length !== file.size) {
    throw new BadRequestException('Cada archivo debe pesar como máximo 5 MB.');
  }

  const isPdf = file.mimetype === 'application/pdf' && file.buffer.subarray(0, 5).toString() === '%PDF-';
  const isJpeg = file.mimetype === 'image/jpeg' && file.buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const isPng = file.mimetype === 'image/png' && file.buffer.subarray(0, 8).equals(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  const isWebp =
    file.mimetype === 'image/webp' &&
    file.buffer.subarray(0, 4).toString() === 'RIFF' &&
    file.buffer.subarray(8, 12).toString() === 'WEBP';

  if ((!allowPdf && !isJpeg && !isPng && !isWebp) || (allowPdf && !isPdf && !isJpeg && !isPng && !isWebp)) {
    throw new BadRequestException('Solo se aceptan PDF, JPEG, PNG o WebP válidos.');
  }
}

export function safeFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).pop() ?? 'documento';
  return basename.replace(/[^a-zA-Z0-9._() -]/g, '_').slice(0, 120) || 'documento';
}