'use client';

import { useState } from 'react';
import { Search, Building2, User, FileText, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import NovoEscopoModal from '../components/NovoEscopoModal';

interface SearchResult {
  type: 'user' | 'empresa';
  id: string;
  name: string;
  document: string;
  email: string;
  phone?: string;
  document_count?: number;
  apolices_count?: number;
  found_by?: string | null;
}

export default function BuscaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showNovoEscopo, setShowNovoEscopo] = useState(false);

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

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearched(true);
    setResults([]);
    try {
      const response = await fetch(`/api/busca?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar dados');
      }
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Superior - Barra Azul Profissional */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image 
              src="/lavilla-logo.png" 
              alt="Lavilla Corretora de Seguros" 
              width={180} 
              height={60}
              className="h-12 w-auto"
              priority
            />
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
        {/* Título e Descrição */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Busca de Clientes e Apólices</h1>
          <p className="text-gray-600">Pesquise por CPF, CNPJ ou Número da Apólice</p>
        </div>

        {/* Barra de Busca */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite CPF, CNPJ ou Nº da Apólice..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-base bg-white font-medium text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Resultados */}
        {searched && !loading && (
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-gray-500">
                  Tente buscar por outro CPF, CNPJ ou número de apólice
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600 font-medium">
                    {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {results.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={result.type === 'empresa' ? `/empresa/${result.id}` : `/cliente/${result.id}`}
                      className="block"
                    >
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5 flex-1">
                            <div className={`p-4 rounded-lg shadow-sm ${
                              result.type === 'empresa'
                                ? 'bg-purple-50'
                                : 'bg-blue-50'
                            }`}>
                              {result.type === 'empresa' ? (
                                <Building2 className={`w-7 h-7 ${
                                  result.type === 'empresa' ? 'text-purple-600' : 'text-blue-600'
                                }`} />
                              ) : (
                                <User className="w-7 h-7 text-blue-600" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">
                                  {result.name}
                                </h3>
                                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                  result.type === 'empresa'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {result.type === 'empresa' ? 'EMPRESA' : 'PESSOA'}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                {result.found_by ? (
                                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium border border-green-200">
                                    <span>✓</span>
                                    Encontrado por: {result.found_by}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">{formatDocument(result.document)}</span>
                                  </div>
                                )}
                                {result.email && (
                                  <div className="flex items-center gap-2">
                                    <span>📧</span>
                                    <span>{result.email}</span>
                                  </div>
                                )}
                                {result.phone && (
                                  <div className="flex items-center gap-2">
                                    <span>📱</span>
                                    <span>{result.phone}</span>
                                  </div>
                                )}
                              </div>

                              {(result.document_count > 0 || result.apolices_count > 0) && (
                                <div className="flex gap-3 mt-3">
                                  {result.document_count > 0 && (
                                    <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                                      {result.document_count} Documento(s)
                                    </span>
                                  )}
                                  {result.apolices_count > 0 && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                                      {result.apolices_count} Apólice(s)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-6 h-6 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal NOVO ESCOPO */}
      {showNovoEscopo && (
        <NovoEscopoModal
          onClose={() => setShowNovoEscopo(false)}
          onComplete={() => {
            setShowNovoEscopo(false);
          }}
        />
      )}
    </div>
  );
}
