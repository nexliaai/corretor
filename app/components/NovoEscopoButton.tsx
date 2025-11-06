'use client';

import { useState, useRef } from 'react';
import { Sparkles, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface NovoEscopoButtonProps {
  userId: string;
  onComplete?: () => void;
}

const DOCUMENT_TYPES = [
  { value: '', label: 'Selecione o tipo de documento' },
  { value: 'apolice', label: 'Apólice de Seguro' },
  { value: 'proposta', label: 'Proposta Comercial' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'nota_fiscal', label: 'Nota Fiscal' },
  { value: 'relatorio', label: 'Relatório' },
  { value: 'declaracao', label: 'Declaração' },
  { value: 'outros', label: 'Outros' },
];

export default function NovoEscopoButton({ userId, onComplete }: NovoEscopoButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      alert('Por favor, selecione o tipo de documento e um arquivo');
      return;
    }

    setUploading(true);
    setStatus('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', userId);
      formData.append('documentType', documentType);

      const response = await fetch('/api/escopo/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const data = await response.json();
      setDocumentId(data.document_id);
      setStatus('processing');
      setUploading(false);
      setProcessing(true);

      // Polling para verificar status
      pollStatus(data.document_id);
    } catch (error) {
      console.error('Erro no upload:', error);
      setStatus('error');
      setErrorMessage('Erro ao fazer upload do documento');
      setUploading(false);
    }
  };

  const pollStatus = async (docId: number) => {
    const maxAttempts = 60; // 5 minutos (60 * 5s)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/escopo/status/${docId}`);
        let shouldContinue = false;
        
        if (response.ok) {
          const data = await response.json();

          if (data.status === 'completed') {
            setStatus('completed');
            setProcessing(false);
            setExtractedData(data.extracted_data);
            if (onComplete) onComplete();
            return;
          }

          if (data.status === 'error' || data.status === 'failed') {
            setStatus('error');
            setProcessing(false);
            setErrorMessage(data.error_message || 'Erro no processamento');
            return;
          }

          if (data.status === 'processing') {
            shouldContinue = true;
          }
        } else {
          shouldContinue = true;
        }

        attempts++;
        if (attempts < maxAttempts && shouldContinue) {
          setTimeout(checkStatus, 5000); // Verifica a cada 5 segundos
        } else if (attempts >= maxAttempts) {
          setStatus('error');
          setProcessing(false);
          setErrorMessage('Timeout: processamento demorou muito');
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setStatus('error');
          setProcessing(false);
          setErrorMessage('Erro ao verificar status');
        }
      }
    };

    checkStatus();
  };

  const resetState = () => {
    setStatus('idle');
    setDocumentId(null);
    setExtractedData(null);
    setErrorMessage('');
    setDocumentType('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="space-y-4">
        {/* Tipo de Documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Documento *
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            disabled={uploading || processing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Seletor de Arquivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecionar Arquivo *
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            disabled={uploading || processing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm hover:border-gray-400 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {selectedFile && (
            <p className="text-sm text-gray-600 mt-2">
              📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Botão de Upload */}
        <button
          onClick={handleUpload}
          disabled={uploading || processing || !documentType || !selectedFile}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando com IA...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              PROCESSAR COM IA
            </>
          )}
        </button>
      </div>

      {/* Status do Processamento */}
      {status !== 'idle' && (
        <div className="mt-4 p-4 rounded-lg border">
          {status === 'uploading' && (
            <div className="flex items-center text-blue-600">
              <Upload className="w-5 h-5 mr-2 animate-pulse" />
              <span>Enviando documento para processamento...</span>
            </div>
          )}

          {status === 'processing' && (
            <div className="flex items-center text-purple-600">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <div>
                <p className="font-medium">Processando com IA...</p>
                <p className="text-sm text-gray-600 mt-1">
                  A inteligência artificial está analisando o documento. Isso pode levar alguns minutos.
                </p>
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div>
              <div className="flex items-center text-green-600 mb-3">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Processamento concluído!</span>
              </div>
              {extractedData && (
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Dados extraídos:</p>
                  <pre className="text-xs text-gray-600 overflow-auto">
                    {JSON.stringify(extractedData, null, 2)}
                  </pre>
                </div>
              )}
              <button
                onClick={resetState}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Processar novo documento
              </button>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="flex items-center text-red-600 mb-2">
                <XCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Erro no processamento</span>
              </div>
              <p className="text-sm text-gray-600">{errorMessage}</p>
              <button
                onClick={resetState}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

