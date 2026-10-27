export interface UploadedDocumentFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface OwnerRegistrationFiles {
  license?: UploadedDocumentFile[];
  insurance?: UploadedDocumentFile[];
  backgroundCheck?: UploadedDocumentFile[];
  photos?: UploadedDocumentFile[];
}