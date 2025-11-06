'use client';

import { UserFile, DOCUMENT_CATEGORIES_MAP } from '../types';
import { Download, Trash2, File, Image, FileText } from 'lucide-react';

interface FileListProps {
  files: UserFile[];
  onFileDeleted: () => void;
}

export default function FileList({ files, onFileDeleted }: FileListProps) {
  const handleDownload = async (file: UserFile) => {
    try {
      const response = await fetch(
        `/api/files/download?userId=${file.user_id}&fileName=${encodeURIComponent(file.nome_arquivo)}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.nome_arquivo;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erro ao baixar arquivo');
      }
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      alert('Erro ao baixar arquivo');
    }
  };

  const handleDelete = async (file: UserFile) => {
    if (!confirm(`Deseja realmente excluir ${file.nome_arquivo}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/files/${file.id}?userId=${file.user_id}&fileName=${encodeURIComponent(file.nome_arquivo)}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        onFileDeleted();
      } else {
        alert('Erro ao excluir arquivo');
      }
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      alert('Erro ao excluir arquivo');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else {
      return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <File className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p>Nenhum arquivo cadastrado</p>
        <p className="text-sm mt-2">Faça upload de documentos ou imagens acima</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Arquivos ({files.length})
      </h3>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all hover:shadow-md hover:border-blue-300"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getFileIcon(file.tipo)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.nome_arquivo}
                </p>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatFileSize(file.tamanho_bytes)}</span>
                    <span>•</span>
                    <span>{formatDate(file.criado_em)}</span>
                  </div>
                  {file.origem && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {DOCUMENT_CATEGORIES_MAP[file.origem] || file.origem}
                      </span>
                      {file.metadata && typeof file.metadata === 'object' && file.metadata.description && (
                        <span className="text-xs text-gray-600 italic">
                          {file.metadata.description}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => handleDownload(file)}
                className="p-2 text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                title="Baixar arquivo"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(file)}
                className="p-2 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-600 hover:to-red-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                title="Excluir arquivo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

