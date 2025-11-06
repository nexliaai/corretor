import * as Minio from 'minio';

// Limpar endpoint de http:// ou https://
const cleanEndpoint = (endpoint: string) => {
  return endpoint
    .replace('http://', '')
    .replace('https://', '')
    .replace(/\/+$/, ''); // Remove trailing slashes
};

const endpoint = cleanEndpoint(process.env.MINIO_ENDPOINT || 'localhost');
const port = parseInt(process.env.MINIO_PORT || '9000');
const useSSL = process.env.MINIO_USE_SSL === 'true';

console.log('🔧 MinIO Config:', {
  endpoint,
  port,
  useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY ? '***' : 'NOT SET',
});

const minioClient = new Minio.Client({
  endPoint: endpoint,
  port: port,
  useSSL: useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
});

export const bucketName = process.env.MINIO_BUCKET || 'la-villa-corretora';

export default minioClient;

