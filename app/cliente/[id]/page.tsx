'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, MapPin, FileText, Car, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Cliente {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  city: string;
  country: string;
}

interface Apolice {
  id: number;
  numero_apolice: string;
  tipo_seguro: string;
  inicio_vigencia: string;
  fim_vigencia: string;
  preco_total: number;
  veiculo_modelo: string;
  veiculo_placa: string;
  seguradora_nome: string;
}

export default function ClienteDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [apolices, setApolices] = useState<Apolice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCliente();
  }, [params.id]);

  const fetchCliente = async () => {
    try {
      const response = await fetch(`/api/cliente/${params.id}`);
      if (!response.ok) throw new Error('Erro ao buscar cliente');
      
      const data = await response.json();
      setCliente(data.cliente);
      setApolices(data.apolices || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDocument = (doc: string) => {
    const clean = doc?.replace(/\D/g, '') || '';
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    const [year, month, day] = date.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900">Cliente não encontrado</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        {/* Cliente Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
              <User className="w-12 h-12 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{cliente.name}</h1>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">CPF/CNPJ</div>
                    <div className="font-semibold">{formatDocument(cliente.document)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-semibold">{cliente.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Telefone</div>
                    <div className="font-semibold">{cliente.phone || '-'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Endereço</div>
                    <div className="font-semibold">
                      {cliente.city && cliente.country 
                        ? `${cliente.city}, ${cliente.country}` 
                        : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Apólices */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Car className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Apólices ({apolices.length})
            </h2>
          </div>

          {apolices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma apólice encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apolices.map((apolice) => (
                <Link
                  key={apolice.id}
                  href={`/apolice/${apolice.id}`}
                  className="block"
                >
                  <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                          {apolice.numero_apolice || 'Sem número'}
                        </h3>
                        <p className="text-sm text-gray-600">{apolice.tipo_seguro}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(apolice.preco_total)}
                        </div>
                        <div className="text-sm text-gray-500">{apolice.seguradora_nome}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Veículo:</span>{' '}
                        <span className="font-semibold">{apolice.veiculo_modelo || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Placa:</span>{' '}
                        <span className="font-semibold">{apolice.veiculo_placa || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Vigência:</span>{' '}
                        <span className="font-semibold">
                          {formatDate(apolice.inicio_vigencia)} até {formatDate(apolice.fim_vigencia)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

