#!/usr/bin/env node

/**
 * Script para testar conexões com PostgreSQL e MinIO
 * Execute: node scripts/test-connections.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const Minio = require('minio');

async function testPostgres() {
  console.log('\n🔍 Testando conexão PostgreSQL...');
  
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ PostgreSQL conectado com sucesso!');
    console.log('   Servidor:', result.rows[0].now);
    
    // Verificar tabelas
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'documentos')
      ORDER BY tablename
    `);
    
    console.log('   Tabelas encontradas:', tables.rows.map(t => t.tablename).join(', '));
    
    // Contar registros
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const docsCount = await pool.query('SELECT COUNT(*) FROM documentos');
    
    console.log(`   Usuários cadastrados: ${usersCount.rows[0].count}`);
    console.log(`   Documentos cadastrados: ${docsCount.rows[0].count}`);
    
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar PostgreSQL:', error.message);
    await pool.end();
    return false;
  }
}

async function testMinio() {
  console.log('\n🔍 Testando conexão MinIO...');
  
  if (!process.env.MINIO_ENDPOINT || process.env.MINIO_ENDPOINT.includes('seu-endpoint')) {
    console.log('⚠️  MINIO_ENDPOINT não configurado no .env');
    console.log('   Por favor, configure o endpoint correto do MinIO');
    return false;
  }

  const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
  });

  const bucketName = process.env.MINIO_BUCKET || 'la-villa-corretora';

  try {
    // Testar conexão listando buckets
    const buckets = await minioClient.listBuckets();
    console.log('✅ MinIO conectado com sucesso!');
    console.log(`   Buckets encontrados: ${buckets.length}`);
    
    // Verificar se o bucket necessário existe
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (bucketExists) {
      console.log(`   ✅ Bucket '${bucketName}' existe`);
      
      // Contar objetos no bucket
      const objects = [];
      const stream = minioClient.listObjects(bucketName, '', true);
      
      for await (const obj of stream) {
        objects.push(obj);
      }
      
      console.log(`   Arquivos no bucket: ${objects.length}`);
    } else {
      console.log(`   ⚠️  Bucket '${bucketName}' não existe`);
      console.log(`   Execute o sistema uma vez para criar o bucket automaticamente`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar MinIO:', error.message);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 Teste de Conexões - Painel de Gestão Corretor');
  console.log('='.repeat(60));

  const postgresOk = await testPostgres();
  const minioOk = await testMinio();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Resultado dos Testes:');
  console.log('='.repeat(60));
  console.log(`PostgreSQL: ${postgresOk ? '✅ OK' : '❌ FALHA'}`);
  console.log(`MinIO: ${minioOk ? '✅ OK' : '⚠️  Verificar configuração'}`);
  console.log('='.repeat(60));

  if (postgresOk && minioOk) {
    console.log('\n✨ Tudo configurado! Execute: npm run dev');
  } else {
    console.log('\n⚠️  Verifique as configurações no arquivo .env');
    console.log('   Consulte SETUP.md para mais informações');
  }
  
  console.log('');
}

main().catch(console.error);

