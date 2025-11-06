'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, Building2, Mail, Phone, MapPin, FileText, Car, Loader2, 
  Calendar, DollarSign, ChevronRight, Briefcase, Activity 
} from 'lucide-react';

interface Empresa {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  email_principal: string | null;
  telefone_principal: string | null;
  logradouro: string | null;
  numero: string | null;
  cidade: string | null;
  estado: string | null;
  ramo_atividade: string | null;
  apolices: Apolice[];
}

interface Apolice {
  id: number;
  numero_apolice: string;
  tipo_seguro: string;
  inicio_vigencia: string;
  fim_vigencia: string;
  preco_total: number;
  veiculo_modelo: string | null;
  veiculo_placa: string | null;
  seguradora_nome: string | null;
}

export default function EmpresaDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmpresa();
  }, [params.id]);

  const fetchEmpresa = async () => {
    try {
      const response = await fetch(`/api/empresa/${params.id}`);
      if (!response.ok) throw new Error('Erro ao buscar empresa');
      
      const data = await response.json();
      setEmpresa(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDocument = (doc: string | null) => {
    if (!doc) return '-';
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    const [year, month, day] = date.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900">Empresa não encontrada</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Superior - Barra Azul Profissional */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/busca">
              <Image 
                src="/lavilla-logo.png" 
                alt="Lavilla Corretora de Seguros" 
                width={160} 
                height={50}
                className="h-10 w-auto cursor-pointer hover:opacity-90 transition-opacity"
                priority
              />
            </Link>
            <div className="h-8 w-px bg-white/20"></div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Voltar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Cabeçalho da Empresa - Estilo Corporativo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-purple-100 text-sm font-medium">EMPRESA</div>
                    <h1 className="text-3xl font-bold text-white">
                      {empresa.nome_fantasia || empresa.razao_social}
                    </h1>
                  </div>
                </div>
                {empresa.nome_fantasia && (
                  <div className="text-purple-100 mt-1 ml-14">{empresa.razao_social}</div>
                )}
              </div>
              
              <div className="text-right bg-white/15 backdrop-blur-md rounded-lg px-6 py-4 border border-white/20">
                <div className="text-purple-100 text-xs font-medium mb-1">TOTAL DE APÓLICES</div>
                <div className="text-3xl font-bold text-white">{empresa.apolices?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* Barra de Informações */}
          <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-xs text-gray-500 mb-1">CNPJ</div>
                <div className="font-semibold text-gray-900">{formatDocument(empresa.cnpj)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Ramo de Atividade</div>
                <div className="font-semibold text-gray-900">{empresa.ramo_atividade || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-600">ATIVA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Informações de Contato */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Contato</h3>
                <p className="text-sm text-gray-500">Informações de contato</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Email Principal</div>
                <div className="font-semibold text-gray-900">{empresa.email_principal || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Telefone Principal</div>
                <div className="font-semibold text-gray-900">{empresa.telefone_principal || '-'}</div>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b">
              <div className="p-3 bg-purple-50 rounded-lg">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Localização</h3>
                <p className="text-sm text-gray-500">Endereço da empresa</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Endereço</div>
                <div className="font-semibold text-gray-900">
                  {empresa.logradouro && empresa.numero 
                    ? `${empresa.logradouro}, ${empresa.numero}` 
                    : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Cidade/Estado</div>
                <div className="font-semibold text-gray-900">
                  {empresa.cidade && empresa.estado 
                    ? `${empresa.cidade} - ${empresa.estado}` 
                    : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Apólices da Empresa */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b">
            <div className="p-3 bg-green-50 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Apólices de Seguros</h3>
              <p className="text-sm text-gray-500">{empresa.apolices?.length || 0} apólice(s) ativa(s)</p>
            </div>
          </div>

          {!empresa.apolices || empresa.apolices.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhuma apólice encontrada
              </h3>
              <p className="text-gray-500">
                Esta empresa ainda não possui apólices cadastradas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {empresa.apolices.map((apolice) => (
                <Link
                  key={apolice.id}
                  href={`/apolice/${apolice.id}`}
                  className="block"
                >
                  <div className="border-2 border-gray-200 rounded-lg p-5 hover:border-green-400 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                            Apólice #{apolice.numero_apolice || 'Sem número'}
                          </h3>
                          <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">
                            {apolice.tipo_seguro}
                          </span>
                        </div>
                        {apolice.seguradora_nome && (
                          <p className="text-sm text-gray-600">
                            Seguradora: {apolice.seguradora_nome}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(apolice.preco_total)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Veículo</div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {apolice.veiculo_modelo || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Placa</div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {apolice.veiculo_placa || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Vigência</div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {formatDate(apolice.inicio_vigencia)} até {formatDate(apolice.fim_vigencia)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm text-green-600 font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                        Ver detalhes
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Estatísticas */}
        {empresa.apolices && empresa.apolices.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Apólices</p>
                  <p className="text-3xl font-bold text-gray-900">{empresa.apolices.length}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Valor Total Segurado</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(empresa.apolices.reduce((acc, a) => acc + (a.preco_total || 0), 0))}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Veículos Segurados</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {empresa.apolices.filter(a => a.veiculo_modelo).length}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <Car className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
