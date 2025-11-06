'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Car, User, Building2, Shield, DollarSign, Calendar,
  Phone, Mail, MapPin, FileText, CreditCard, Loader2, Download, Printer,
  ChevronRight, Briefcase, Activity
} from 'lucide-react';

interface Apolice {
  id: number;
  numero_apolice: string;
  numero_endosso: string | null;
  proposta_numero: string | null;
  tipo_seguro: string;
  data_emissao: string;
  inicio_vigencia: string;
  fim_vigencia: string;

  // Segurado
  segurado_nome: string;
  segurado_cnpj: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;

  // Condutor
  condutor_nome: string | null;
  condutor_cpf: string | null;
  condutor_idade: number | null;
  condutor_estado_civil: string | null;

  // Veículo
  veiculo_modelo: string | null;
  veiculo_placa: string | null;
  veiculo_ano_modelo: string | null;
  veiculo_chassi: string | null;

  // Coberturas
  casco_premio: number | null;
  rcf_danos_materiais: number | null;
  rcf_danos_corporais: number | null;
  app_morte: number | null;
  app_invalidez: number | null;

  // Valores
  preco_liquido: number | null;
  preco_total: number | null;
  iof: number | null;
  forma_pagamento: string | null;
  parcelas: number | null;
  valor_parcela: number | null;
  franquia_valor: number | null;
  franquia_tipo: string | null;

  // Seguradora
  seguradora_nome: string | null;
  seguradora_cnpj: string | null;
  seguradora_telefones: string | null;
  seguradora_endereco: string | null;

  // Corretor
  corretor_nome: string | null;
  corretor_email: string | null;
  corretor_telefone: string | null;
  corretor_susep: string | null;

  // Empresa (caso seja apólice empresarial)
  empresa_id: string | null;
  empresa_razao_social: string | null;
  empresa_nome_fantasia: string | null;
  empresa_cnpj: string | null;
  empresa_email: string | null;
  empresa_telefone: string | null;
  empresa_endereco: string | null;
}

export default function ApoliceDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [apolice, setApolice] = useState<Apolice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApolice();
  }, [params.id]);

  const fetchApolice = async () => {
    try {
      const response = await fetch(`/api/apolice/${params.id}`);
      if (!response.ok) throw new Error('Erro ao buscar apólice');
      
      const data = await response.json();
      setApolice(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
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

  const formatDocument = (doc: string | null) => {
    if (!doc) return '-';
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!apolice) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900">Apólice não encontrada</h2>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/apolice/${params.id}/documento`);
      if (!response.ok) throw new Error('Documento não encontrado');
      
      const data = await response.json();
      if (data.documento_url) {
        window.open(data.documento_url, '_blank');
      } else {
        alert('Documento não disponível para download');
      }
    } catch (error) {
      console.error('Erro ao baixar:', error);
      alert('Erro ao baixar documento');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Header Superior - Barra Azul Profissional */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 print:hidden shadow-lg">
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

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm border border-white/20"
            >
              <Printer className="w-4 h-4" />
              <span className="font-medium">Imprimir</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 rounded-lg transition-all font-semibold shadow-lg"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Cabeçalho da Apólice - Estilo Corporativo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-blue-100 text-sm font-medium">APÓLICE DE SEGURO</div>
                    <h1 className="text-3xl font-bold text-white">Nº {apolice.numero_apolice}</h1>
                  </div>
                </div>
                <div className="text-blue-100 mt-1">{apolice.tipo_seguro}</div>
              </div>
              
              <div className="text-right bg-white/15 backdrop-blur-md rounded-lg px-6 py-4 border border-white/20">
                <div className="text-blue-100 text-xs font-medium mb-1">PRÊMIO TOTAL</div>
                <div className="text-3xl font-bold text-white">{formatCurrency(apolice.preco_total)}</div>
              </div>
            </div>
          </div>

          {/* Barra de Status */}
          <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-xs text-gray-500 mb-1">Data de Emissão</div>
                <div className="font-semibold text-gray-900">{formatDate(apolice.data_emissao)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Vigência</div>
                <div className="font-semibold text-gray-900">
                  {formatDate(apolice.inicio_vigencia)} até {formatDate(apolice.fim_vigencia)}
                </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Empresa (Se existir) */}
          {apolice.empresa_id && (
            <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Empresa</h3>
                  <p className="text-sm text-gray-500">Dados da empresa contratante</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Razão Social</div>
                  <div className="font-semibold text-gray-900">{apolice.empresa_razao_social || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Nome Fantasia</div>
                  <div className="font-semibold text-gray-900">{apolice.empresa_nome_fantasia || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">CNPJ</div>
                  <div className="font-semibold text-gray-900">{formatDocument(apolice.empresa_cnpj)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Email</div>
                  <div className="font-semibold text-gray-900">{apolice.empresa_email || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Telefone</div>
                  <div className="font-semibold text-gray-900">{apolice.empresa_telefone || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Endereço</div>
                  <div className="font-semibold text-gray-900">{apolice.empresa_endereco || '-'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Segurado */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Segurado</h3>
                <p className="text-sm text-gray-500">Titular da apólice</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Nome Completo</div>
                <div className="font-semibold text-gray-900">{apolice.segurado_nome}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">CPF/CNPJ</div>
                <div className="font-semibold text-gray-900">{formatDocument(apolice.segurado_cnpj)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Email</div>
                <div className="font-semibold text-gray-900">{apolice.email || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Telefone</div>
                <div className="font-semibold text-gray-900">{apolice.telefone || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Endereço</div>
                <div className="font-semibold text-gray-900 text-sm">{apolice.endereco || '-'}</div>
              </div>
            </div>
          </div>

          {/* Veículo */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Car className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Veículo</h3>
                <p className="text-sm text-gray-500">Dados do veículo segurado</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Marca/Modelo</div>
                <div className="font-semibold text-gray-900">{apolice.veiculo_modelo || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Placa</div>
                <div className="font-semibold text-gray-900">{apolice.veiculo_placa || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Ano/Modelo</div>
                <div className="font-semibold text-gray-900">{apolice.veiculo_ano_modelo || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Chassi</div>
                <div className="font-mono text-sm text-gray-900">{apolice.veiculo_chassi || '-'}</div>
              </div>
            </div>
          </div>

          {/* Condutor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b">
              <div className="p-3 bg-amber-50 rounded-lg">
                <Briefcase className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Condutor</h3>
                <p className="text-sm text-gray-500">Condutor principal</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Nome</div>
                <div className="font-semibold text-gray-900">{apolice.condutor_nome || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">CPF</div>
                <div className="font-semibold text-gray-900">{formatDocument(apolice.condutor_cpf)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Idade</div>
                <div className="font-semibold text-gray-900">{apolice.condutor_idade ? `${apolice.condutor_idade} anos` : '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Estado Civil</div>
                <div className="font-semibold text-gray-900">{apolice.condutor_estado_civil || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Coberturas e Valores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Coberturas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b">
              <div className="p-3 bg-green-50 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Coberturas</h3>
                <p className="text-sm text-gray-500">Proteções contratadas</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Casco</span>
                <span className="font-bold text-gray-900">{formatCurrency(apolice.casco_premio)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">RCF Danos Materiais</span>
                <span className="font-bold text-gray-900">{formatCurrency(apolice.rcf_danos_materiais)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">RCF Danos Corporais</span>
                <span className="font-bold text-gray-900">{formatCurrency(apolice.rcf_danos_corporais)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">APP Morte</span>
                <span className="font-bold text-gray-900">{formatCurrency(apolice.app_morte)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">APP Invalidez</span>
                <span className="font-bold text-gray-900">{formatCurrency(apolice.app_invalidez)}</span>
              </div>
            </div>
          </div>

          {/* Pagamento */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b">
              <div className="p-3 bg-rose-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Valores e Pagamento</h3>
                <p className="text-sm text-gray-500">Detalhamento financeiro</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Prêmio Líquido</span>
                <span className="font-bold text-gray-900">{formatCurrency(apolice.preco_liquido)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">IOF</span>
                <span className="font-bold text-gray-900">{formatCurrency(apolice.iof)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
                <span className="text-base font-semibold text-gray-900">TOTAL</span>
                <span className="font-bold text-xl text-blue-600">{formatCurrency(apolice.preco_total)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 mt-4">
                <span className="text-sm text-gray-600">Forma de Pagamento</span>
                <span className="font-bold text-gray-900">{apolice.forma_pagamento || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Parcelas</span>
                <span className="font-bold text-gray-900">
                  {apolice.parcelas}x de {formatCurrency(apolice.valor_parcela)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Franquia</span>
                <span className="font-bold text-gray-900">
                  {apolice.franquia_tipo ? `${apolice.franquia_tipo} - ${formatCurrency(apolice.franquia_valor)}` : formatCurrency(apolice.franquia_valor)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Seguradora e Corretor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seguradora */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Seguradora</h3>
                <p className="text-sm text-gray-500">Empresa seguradora</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Nome</div>
                <div className="font-semibold text-gray-900">{apolice.seguradora_nome || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">CNPJ</div>
                <div className="font-semibold text-gray-900">{formatDocument(apolice.seguradora_cnpj)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Telefones</div>
                <div className="font-semibold text-gray-900">{apolice.seguradora_telefones || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Endereço</div>
                <div className="font-semibold text-gray-900 text-sm">{apolice.seguradora_endereco || '-'}</div>
              </div>
            </div>
          </div>

          {/* Corretor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b">
              <div className="p-3 bg-cyan-50 rounded-lg">
                <User className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Corretor</h3>
                <p className="text-sm text-gray-500">Responsável pela venda</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Nome</div>
                <div className="font-semibold text-gray-900">{apolice.corretor_nome || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Email</div>
                <div className="font-semibold text-gray-900">{apolice.corretor_email || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Telefone</div>
                <div className="font-semibold text-gray-900">{apolice.corretor_telefone || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">SUSEP</div>
                <div className="font-semibold text-gray-900">{apolice.corretor_susep || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Print */}
        <div className="hidden print:block mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
          <p>Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          <p className="mt-1">Este documento é uma via informativa e não possui validade legal sem assinatura digital.</p>
        </div>
      </div>
    </div>
  );
}
