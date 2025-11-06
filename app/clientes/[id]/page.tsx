'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  FileText,
  Upload,
} from 'lucide-react';
import { User, UserFile, DOCUMENT_CATEGORIES_MAP } from '../../types';
import FileUpload from '../../components/FileUpload';
import NovoEscopoButton from '../../components/NovoEscopoButton';

export default function ClienteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'docs' | 'info'>('docs');

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadFiles();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();
        const foundUser = users.find((u: User) => u.id === userId);
        setUser(foundUser || null);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await fetch(`/api/files?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    }
  };

  const groupFilesByCategory = () => {
    const grouped: Record<string, UserFile[]> = {};
    files.forEach((file) => {
      const category = file.origem || 'outros';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(file);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Cliente não encontrado</p>
          <button
            onClick={() => router.push('/clientes')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Voltar para clientes
          </button>
        </div>
      </div>
    );
  }

  const groupedFiles = groupFilesByCategory();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/clientes')}
            className="flex items-center text-white hover:text-blue-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para clientes
          </button>

          <div className="flex items-start space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">
                {user.first_name} {user.last_name}
              </h1>
              <div className="mt-2 space-y-1">
                <div className="flex items-center text-blue-100">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center text-blue-100">
                    <Phone className="w-4 h-4 mr-2" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                {(user.city || user.country) && (
                  <div className="flex items-center text-blue-100">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {[user.city, user.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-4 text-center">
              <FileText className="w-8 h-8 text-white mx-auto mb-1" />
              <p className="text-3xl font-bold text-white">{files.length}</p>
              <p className="text-xs text-blue-100">documentos</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-2 flex space-x-2">
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'docs'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5 inline mr-2" />
            Documentos ({files.length})
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'info'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserIcon className="w-5 h-5 inline mr-2" />
            Informações
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'docs' ? (
          <div className="space-y-6">
            {/* Novo Escopo com IA */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl shadow-xl p-6 border-2 border-purple-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                <Upload className="w-6 h-6 mr-2 text-purple-600" />
                Processamento Inteligente
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Envie um documento e a IA irá extrair e estruturar automaticamente todas as informações relevantes
              </p>
              <NovoEscopoButton userId={userId} onComplete={loadFiles} />
            </div>

            {/* Upload Normal */}
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-6 h-6 mr-2 text-blue-600" />
                Enviar Documentos
              </h2>
              <FileUpload userId={userId} onFileUploaded={loadFiles} />
            </div>

            {/* Documentos Agrupados */}
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Documentos ({files.length})
              </h2>

              {files.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum documento cadastrado</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Faça upload de documentos acima
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedFiles).map(([category, categoryFiles]) => (
                    <div key={category} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-blue-600" />
                        {DOCUMENT_CATEGORIES_MAP[category] || category} ({categoryFiles.length})
                      </h3>
                      <div className="space-y-2">
                        {categoryFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.nome_arquivo}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {(file.tamanho_bytes / 1024).toFixed(1)} KB •{' '}
                                {new Date(file.criado_em).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Informações do Cliente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                <p className="mt-1 text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-gray-900">{user.email}</p>
              </div>
              {user.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefone</label>
                  <p className="mt-1 text-gray-900">{user.phone}</p>
                </div>
              )}
              {user.document && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Documento</label>
                  <p className="mt-1 text-gray-900">{user.document}</p>
                </div>
              )}
              {user.city && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Cidade</label>
                  <p className="mt-1 text-gray-900">{user.city}</p>
                </div>
              )}
              {user.country && (
                <div>
                  <label className="text-sm font-medium text-gray-500">País</label>
                  <p className="mt-1 text-gray-900">{user.country}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

