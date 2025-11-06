'use client';

import { User } from '../types';
import { MapPin, Phone, Mail, FileText, ChevronRight, User as UserIcon } from 'lucide-react';

interface ClientCardProps {
  user: User;
  onClick: () => void;
}

export default function ClientCard({ user, onClick }: ClientCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border border-gray-200 hover:border-blue-300 hover:scale-[1.02] group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Avatar */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-4 group-hover:scale-110 transition-transform">
            <UserIcon className="w-6 h-6 text-white" />
          </div>

          {/* Informações */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {user.first_name} {user.last_name}
            </h3>

            <div className="mt-3 space-y-2">
              {/* Email */}
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-sm truncate">{user.email}</span>
              </div>

              {/* Telefone */}
              {user.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}

              {/* Localização */}
              {(user.city || user.country) && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm">
                    {[user.city, user.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-2">
              {user.document && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                  Doc: {user.document}
                </span>
              )}
              {user.cargo && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                  {user.cargo}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito - Documentos e Ação */}
        <div className="flex flex-col items-end space-y-3 ml-4">
          {/* Contador de Documentos */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg px-4 py-2 text-center">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{user.document_count || 0}</p>
                <p className="text-xs text-blue-600">documento{user.document_count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Botão de Ação */}
          <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:translate-x-1 transition-transform">
            <span>Ver detalhes</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Data de Cadastro */}
          <p className="text-xs text-gray-400">
            Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}

