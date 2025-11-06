export interface User {
  id: string; // UUID
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  address?: string;
  number?: string;
  postal_code?: string;
  address_extra?: string;
  id_drive?: string;
  document?: string;
  cargo?: string;
  clientes_associados?: string;
  active?: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
  document_count?: number; // Contagem de documentos
}

export interface UserFile {
  id: number;
  user_id: string; // UUID
  nome_arquivo: string;
  caminho_minio: string;
  tipo: string;
  tamanho_bytes: number;
  origem?: string;
  metadata?: any;
  criado_em: string;
}

export const DOCUMENT_CATEGORIES_MAP: Record<string, string> = {
  apolice: 'Apólice de Seguro',
  boletos: 'Boletos',
  certificados: 'Certificados',
  endossos: 'Endossos',
  propostas: 'Propostas',
  avisos_sinistro: 'Avisos de Sinistro',
  condicoes_gerais: 'Condições Gerais',
  tabelas_cobertura: 'Tabelas de Cobertura',
  cnh_digital: 'CNH Digital',
  cnh_escaneada: 'CNH Escaneada',
  carta_verde: 'Carta Verde',
  comprovante_residencia: 'Comprovante de Residência',
  outros: 'Outros',
};

