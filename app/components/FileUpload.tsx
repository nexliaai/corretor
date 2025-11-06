'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  userId: string; // UUID
  onFileUploaded: () => void;
}

const DOCUMENT_CATEGORIES = [
  { value: '', label: 'Selecione a categoria do documento' },
  { value: 'apolice', label: 'Apólice de Seguro' },
  { value: 'boletos', label: 'Boletos' },
  { value: 'certificados', label: 'Certificados' },
  { value: 'endossos', label: 'Endossos' },
  { value: 'propostas', label: 'Propostas' },
  { value: 'avisos_sinistro', label: 'Avisos de Sinistro' },
  { value: 'condicoes_gerais', label: 'Condições Gerais' },
  { value: 'tabelas_cobertura', label: 'Tabelas de Cobertura' },
  { value: 'cnh_digital', label: 'CNH Digital' },
  { value: 'cnh_escaneada', label: 'CNH Escaneada' },
  { value: 'carta_verde', label: 'Carta Verde' },
  { value: 'comprovante_residencia', label: 'Comprovante de Residência' },
  { value: 'outros', label: 'Outros' },
];

export default function FileUpload({ userId, onFileUploaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [origem, setOrigem] = useState('');
  const [description, setDescription] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId); // UUID já é string
        if (origem) {
          formData.append('origem', origem);
        }
        if (description) {
          formData.append('description', description);
        }

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Erro ao fazer upload de ${file.name}`);
        }
      }

      setSelectedFiles([]);
      setOrigem('');
      setDescription('');
      onFileUploaded();
      alert('Arquivos enviados com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload dos arquivos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg scale-105'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Solte os arquivos aqui...</p>
        ) : (
          <div>
            <p className="text-gray-600">Arraste arquivos aqui ou clique para selecionar</p>
            <p className="text-sm text-gray-500 mt-2">
              Suporta: Imagens, PDF, Word, Excel
            </p>
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Arquivos selecionados ({selectedFiles.length})
            </h3>
          </div>

          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                <span className="text-xs text-gray-500 mx-2">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria do Documento *
              </label>
              <select
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
                required
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Apólice Residencial 2024"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:border-gray-400 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !origem}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {uploading ? 'Enviando...' : `Enviar ${selectedFiles.length} arquivo(s)`}
          </button>
          
          {!origem && selectedFiles.length > 0 && (
            <p className="text-xs text-red-600 text-center">
              * Selecione a categoria do documento antes de enviar
            </p>
          )}
        </div>
      )}
    </div>
  );
}

