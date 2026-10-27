import { BadRequestException } from '@nestjs/common';
import { safeFilename, validateUploadedFile } from './file-validation.js';

describe('owner document file validation', () => {
  it('accepts a PDF only when its signature matches its MIME type', () => {
    const pdf = Buffer.from('%PDF-1.7');
    expect(() => validateUploadedFile({
      originalname: 'license.pdf',
      mimetype: 'application/pdf',
      size: pdf.length,
      buffer: pdf,
    })).not.toThrow();
    expect(() => validateUploadedFile({
      originalname: 'fake.pdf',
      mimetype: 'application/pdf',
      size: 4,
      buffer: Buffer.from('text'),
    })).toThrow(BadRequestException);
  });

  it('rejects documents above 5 MB and PDF files in photo fields', () => {
    expect(() => validateUploadedFile({
      originalname: 'large.jpg',
      mimetype: 'image/jpeg',
      size: 5 * 1024 * 1024 + 1,
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
    })).toThrow(BadRequestException);
    expect(() => validateUploadedFile({
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      size: 8,
      buffer: Buffer.from('%PDF-1.4'),
    }, false)).toThrow(BadRequestException);
  });

  it('sanitizes the original filename before storage', () => {
    expect(safeFilename('..\\private\r\n.pdf')).toBe('private__.pdf');
  });
});