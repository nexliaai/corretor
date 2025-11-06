'use client';

import { useEffect, useState } from 'react';
import { Users, Search, Building2, User, FileText, Loader2, Sparkles, Filter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import NovoEscopoModal from '../components/NovoEscopoModal';

interface Client {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  document: string;
  email: string;
  phone: string;
  city: string;
  active: boolean;
  document_count: number;
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showNovoEscopo, setShowNovoEscopo] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/users/with-stats');
      if (!response.ok) throw new Error('Erro ao buscar clientes');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDocument = (doc: string) => {
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.document?.includes(searchTerm) ||
      client.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterActive === 'all' ||
      (filterActive === 'active' && client.active) ||
      (filterActive === 'inactive' && !client.active);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Superior - Barra Azul Profissional */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/busca">
              <Image 
                src="/lavilla-logo.png" 
                alt="Lavilla Corretora de Seguros" 
                width={180} 
                height={60}
                className="h-12 w-auto cursor-pointer hover:opacity-90 transition-opacity"
                priority
              />
            </Link>
          </div>

          <button
            onClick={() => setShowNovoEscopo(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-900 hover:bg-blue-50 rounded-lg transition-all font-semibold shadow-lg hover:shadow-xl"
          >
            <Sparkles className="w-5 h-5" />
            NOVO ESCOPO
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
              <p className="text-gray-600">Gerenciamento de clientes e apólices</p>
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, email, CPF/CNPJ ou cidade..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white font-medium text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setFilterActive('all')}
                className={`px-4 py-2 rounded-md transition-all font-medium text-sm ${
                  filterActive === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todos ({clients.length})
              </button>
              <button
                onClick={() => setFilterActive('active')}
                className={`px-4 py-2 rounded-md transition-all font-medium text-sm ${
                  filterActive === 'active'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ativos ({clients.filter(c => c.active).length})
              </button>
              <button
                onClick={() => setFilterActive('inactive')}
                className={`px-4 py-2 rounded-md transition-all font-medium text-sm ${
                  filterActive === 'inactive'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Inativos ({clients.filter(c => !c.active).length})
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredClients.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum cliente encontrado
              </h3>
              <p className="text-gray-500">
                Tente ajustar os filtros ou buscar por outros termos
              </p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <Link key={client.id} href={`/cliente/${client.id}`}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {client.name || `${client.first_name} ${client.last_name}`}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium">
                          {formatDocument(client.document)}
                        </p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      client.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {client.active ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>📧</span>
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>📱</span>
                      <span>{client.phone}</span>
                    </div>
                    {client.city && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📍</span>
                        <span>{client.city}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Documentos</span>
                      <span className="text-sm font-bold text-blue-600">
                        {client.document_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Estatísticas no rodapé */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Clientes Ativos</p>
                <p className="text-3xl font-bold text-green-600">
                  {clients.filter(c => c.active).length}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <User className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Documentos</p>
                <p className="text-3xl font-bold text-purple-600">
                  {clients.reduce((acc, c) => acc + (c.document_count || 0), 0)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal NOVO ESCOPO */}
      {showNovoEscopo && (
        <NovoEscopoModal
          onClose={() => setShowNovoEscopo(false)}
          onComplete={() => {
            setShowNovoEscopo(false);
            fetchClients();
          }}
        />
      )}
    </div>
  );
}

