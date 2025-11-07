import fs from 'node:fs/promises';
import path from 'node:path';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import ExcelJS from 'exceljs';
import { ExportConfig, ExportResult } from './types';

const getContainerClient = (config: ExportConfig): ContainerClient => {
  if (!config.blob) {
    throw new Error('Blob destination is not configured.');
  }

  if (config.blob.connectionString) {
    const serviceClient = BlobServiceClient.fromConnectionString(config.blob.connectionString);
    return serviceClient.getContainerClient(config.blob.container);
  }

  if (config.blob.sasUrl) {
    return new ContainerClient(config.blob.sasUrl);
  }

  throw new Error('Blob destination is missing credentials.');
};

const uploadToBlob = async (buffer: Buffer, config: ExportConfig): Promise<string> => {
  const containerClient = getContainerClient(config);
  await containerClient.createIfNotExists();

  const blobClient = containerClient.getBlockBlobClient(config.filename);
  await blobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });

  return blobClient.url;
};

const writeLocally = async (buffer: Buffer, config: ExportConfig): Promise<string> => {
  if (!config.outputDir) {
    throw new Error('Local destination requires outputDir.');
  }

  const folder = path.resolve(process.cwd(), config.outputDir);
  await fs.mkdir(folder, { recursive: true });
  const targetPath = path.join(folder, config.filename);
  await fs.writeFile(targetPath, buffer);
  return targetPath;
};

export const deliverWorkbook = async (workbook: ExcelJS.Workbook, config: ExportConfig): Promise<ExportResult> => {
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (config.destination === 'blob') {
    const location = await uploadToBlob(buffer, config);
    return {
      destination: config.destination,
      location,
      bytesWritten: buffer.byteLength,
      filename: config.filename,
    };
  }

  if (config.destination === 'local') {
    const location = await writeLocally(buffer, config);
    return {
      destination: config.destination,
      location,
      bytesWritten: buffer.byteLength,
      filename: config.filename,
    };
  }

  throw new Error(`Unsupported destination: ${config.destination}`);
};
