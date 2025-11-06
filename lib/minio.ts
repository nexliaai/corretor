import * as Minio from 'minio';

// Limpar endpoint de http:// ou https://
const cleanEndpoint = (endpoint: string) => {
  return endpoint
    .replace('http://', '')
    .replace('https://', '')
    .replace(/\/+$/, ''); // Remove trailing slashes
};

// Validar variáveis de ambiente
if (!process.env.MINIO_ENDPOINT) {
  console.error('❌ MINIO_ENDPOINT não está definida!');
}
if (!process.env.MINIO_ACCESS_KEY) {
  console.error('❌ MINIO_ACCESS_KEY não está definida!');
}
if (!process.env.MINIO_SECRET_KEY) {
  console.error('❌ MINIO_SECRET_KEY não está definida!');
}

const endpoint = cleanEndpoint(process.env.MINIO_ENDPOINT || 'localhost');
const port = parseInt(process.env.MINIO_PORT || '443');
const useSSL = process.env.MINIO_USE_SSL === 'true';
const accessKey = process.env.MINIO_ACCESS_KEY || '';
const secretKey = process.env.MINIO_SECRET_KEY || '';

console.log('🔧 MinIO Configuration:', {
  endpoint,
  port,
  useSSL,
  accessKey: accessKey ? `${accessKey.slice(0, 4)}***` : 'NOT SET',
  secretKey: secretKey ? '***' : 'NOT SET',
  bucket: process.env.MINIO_BUCKET_NAME,
});

// Validar se todas as credenciais estão presentes
if (!endpoint || !accessKey || !secretKey) {
  throw new Error('MinIO: Credenciais incompletas! Verifique as variáveis de ambiente.');
}

const minioClient = new Minio.Client({
  endPoint: endpoint,
  port: port,
  useSSL: useSSL,
  accessKey: accessKey,
  secretKey: secretKey,
});

export const bucketName = process.env.MINIO_BUCKET_NAME || 'corretor-docs';

export default minioClient;

