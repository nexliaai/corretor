import { NextResponse } from 'next/server';
import minioClient, { bucketName } from '@/lib/minio';

export async function GET() {
  try {
    console.log('🧪 Testando conexão MinIO...');
    
    // Teste 1: Listar buckets
    const buckets = await minioClient.listBuckets();
    console.log('✅ Buckets encontrados:', buckets.map(b => b.name));
    
    // Teste 2: Verificar se bucket existe
    const bucketExists = await minioClient.bucketExists(bucketName);
    console.log(`✅ Bucket '${bucketName}' existe:`, bucketExists);
    
    return NextResponse.json({
      success: true,
      buckets: buckets.map(b => b.name),
      targetBucket: bucketName,
      bucketExists,
      message: 'MinIO conectado com sucesso! ✅'
    });
  } catch (error: any) {
    console.error('❌ Erro ao conectar MinIO:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      endpoint: process.env.MINIO_ENDPOINT,
      port: process.env.MINIO_PORT,
      useSSL: process.env.MINIO_USE_SSL,
      message: 'Erro ao conectar no MinIO'
    }, { status: 500 });
  }
}

