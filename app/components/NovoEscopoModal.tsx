'use client';

import { useState, useRef } from 'react';
import { Sparkles, Upload, Loader2, CheckCircle, XCircle, X, User as UserIcon, FileText, Edit2 } from 'lucide-react';

interface NovoEscopoModalProps {
  onClose: () => void;
  onComplete?: () => void;
}

const DOCUMENT_TYPES = [
  { value: '', label: 'Selecione o tipo de documento' },
  { value: 'apolice_auto', label: '🚗 Apólice de Seguro Auto' },
  { value: 'proposta', label: 'Proposta Comercial' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'nota_fiscal', label: 'Nota Fiscal' },
  { value: 'relatorio', label: 'Relatório' },
  { value: 'declaracao', label: 'Declaração' },
  { value: 'outros', label: 'Outros' },
];

export default function NovoEscopoModal({ onClose, onComplete }: NovoEscopoModalProps) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'review' | 'completed' | 'error'>('idle');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [potentialClient, setPotentialClient] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
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
      formData.append('documentType', documentType);

      console.log('📤 Enviando para webhook...');

      const response = await fetch('/api/escopo/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const data = await response.json();
      
      console.log('📥 RESPOSTA RECEBIDA DA API:', JSON.stringify(data, null, 2));
      console.log('📊 data.status =', data.status);
      console.log('🆔 data.apolice_id =', data.apolice_id);
      console.log('✅ data.success =', data.success);
      
      // Se o webhook retornou o ID da apólice (processamento concluído)
      if (data.status === 'completed' && data.apolice_id) {
        console.log('🎉 ENTRANDO NO FLUXO DE SUCESSO! Apólice ID:', data.apolice_id);
        setStatus('completed');
        setUploading(false);
        setProcessing(false);
        
        // Redirecionar para a página da apólice após 2 segundos
        setTimeout(() => {
          console.log('🚀 REDIRECIONANDO para /apolice/' + data.apolice_id);
          window.location.href = `/apolice/${data.apolice_id}`;
        }, 2000);
        return;
      }
      
      console.log('⚠️ NÃO entrou no fluxo de sucesso, verificando outras condições...');
      
      // Se o webhook retornou dados extraídos em formato detalhado
      if (data.webhook_response && data.webhook_response.extracted_data) {
        setExtractedData(data.webhook_response.extracted_data);
        setPotentialClient(data.webhook_response.potential_client || null);
        setStatus('review');
        setUploading(false);
        setProcessing(false);
      } else if (data.status === 'processing') {
        // Aguardar processamento assíncrono
        setDocumentId(data.document_id);
        setStatus('processing');
        setUploading(false);
        setProcessing(true);
        console.log('⏳ Aguardando processamento do N8N...');
        
        // Iniciar verificação de status
        checkProcessingStatus(data.document_id);
      } else {
        throw new Error('Resposta inesperada do webhook');
      }
    } catch (error: any) {
      console.error('❌ Erro no upload:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Erro ao fazer upload do documento');
      setUploading(false);
      setProcessing(false);
    }
  };

  const checkProcessingStatus = async (docId: string) => {
    const totalTime = 60; // 60 segundos
    const checkInterval = 2000; // Verificar a cada 2 segundos
    const maxAttempts = 30; // 30 tentativas (60 segundos)
    let attempts = 0;
    let progressInterval: NodeJS.Timeout;

    // Iniciar barra de progresso
    const startProgress = () => {
      setProgress(0);
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress += (100 / (totalTime * 1000 / 100)); // Incrementa suavemente
        if (currentProgress >= 98) {
          currentProgress = 98; // Parar em 98% até completar
        }
        setProgress(currentProgress);
      }, 100); // Atualiza a cada 100ms para suavidade
    };

    startProgress();

    const checkStatus = async (): Promise<void> => {
      try {
        attempts++;
        console.log(`🔍 Verificando status... (${attempts}/${maxAttempts})`);

        const response = await fetch(`/api/escopo/status/${docId}`);
        
        if (!response.ok) {
          throw new Error('Erro ao verificar status');
        }

        const data = await response.json();

        if (data.status === 'completed' && data.extracted_data) {
          clearInterval(progressInterval);
          setProgress(100);
          console.log('✅ Processamento concluído!');
          
          // Aguardar animação completar
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setStatus('review');
          setExtractedData(data.extracted_data);
          setPotentialClient(data.potential_client);
          setProcessing(false);
          return;
        }

        if (data.status === 'error') {
          clearInterval(progressInterval);
          throw new Error(data.error_message || 'Erro no processamento');
        }

        if (attempts >= maxAttempts) {
          clearInterval(progressInterval);
          throw new Error('Timeout: Processamento demorou muito tempo');
        }

        // Aguardar intervalo e tentar novamente
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        return checkStatus();
      } catch (error: any) {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        console.error('❌ Erro ao verificar status:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Erro ao processar documento');
        setProcessing(false);
      }
    };

    await checkStatus();
  };

  const handleConfirmAndSave = async () => {
    if (!documentId || !extractedData) {
      alert('Dados insuficientes para confirmar');
      return;
    }

    setConfirming(true);

    try {
      // Se não encontrou cliente, criar um novo
      let userId = potentialClient?.id;
      let userDocument = potentialClient?.document || '';

      if (!userId) {
        console.log('🆕 Criando novo cliente...');
        const doc = extractedData.dados_documento || {};
        const pessoal = extractedData.dados_pessoais || {};
        
        const cleanCpf = (str: string) => str ? str.replace(/\D/g, '') : '';
        const cpfCnpj = cleanCpf(doc.cnpj || pessoal.document || '');
        const nome = doc.segurado || pessoal.nome || 'Cliente Importado';
        userDocument = cpfCnpj;

        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nome || 'Cliente Importado',
            email: pessoal.email || `cliente${cpfCnpj}@temp.com`,
            phone: (pessoal.telefone || '0000000000').replace(/\D/g, ''),
            document: cpfCnpj,
            city: pessoal.cidade || '',
            country: 'BR',
            active: true,
          }),
        });

        if (!createResponse.ok) {
          throw new Error('Erro ao criar novo cliente');
        }

        const newUser = await createResponse.json();
        userId = newUser.id;
        console.log('✅ Novo cliente criado:', userId);
      }

      // Confirmar e salvar
      console.log('💾 Salvando dados confirmados...');
      const confirmResponse = await fetch('/api/escopo/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId,
          user_id: userId,
          extracted_data: extractedData,
          document_type: documentType,
        }),
      });

      if (!confirmResponse.ok) {
        throw new Error('Erro ao salvar dados confirmados');
      }

      const confirmData = await confirmResponse.json();
      console.log('✅ Dados salvos com sucesso!');
      setStatus('completed');
      setConfirming(false);
      setCreatedUserId(userId);

      // Redirecionar após 2 segundos
      setTimeout(() => {
        // Se o webhook retornou ID da apólice, redirecionar para ela
        if (confirmData.apolice_id) {
          window.location.href = `/apolice/${confirmData.apolice_id}`;
        } else {
          // Senão, redirecionar para perfil do cliente/empresa
          const cleanDoc = userDocument.replace(/\D/g, '');
          const isEmpresa = cleanDoc.length === 14;
          const url = isEmpresa ? `/empresa/${userId}` : `/cliente/${userId}`;
          window.location.href = url;
        }
      }, 2000);
    } catch (error: any) {
      console.error('❌ Erro ao confirmar:', error);
      setErrorMessage(error.message || 'Erro ao salvar dados');
      setConfirming(false);
    }
  };

  const resetState = () => {
    setStatus('idle');
    setDocumentId(null);
    setExtractedData(null);
    setPotentialClient(null);
    setErrorMessage('');
    setDocumentType('');
    setSelectedFile(null);
    setProgress(0);
    setCreatedUserId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">NOVO ESCOPO - Análise com IA</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Section - Apenas se não estiver em revisão */}
          {status !== 'review' && status !== 'completed' && (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <p className="text-purple-900 text-sm font-medium">
                  <strong>🤖 Processamento Automático:</strong> O documento será analisado pelo nosso sistema interno de IA,
                  que irá extrair automaticamente os dados do cliente e do contrato.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  disabled={status === 'uploading' || status === 'processing'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar Arquivo *
                </label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    disabled={status === 'uploading' || status === 'processing'}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={status === 'uploading' || status === 'processing'}
                    className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-700"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5" />
                      <span className="font-medium">
                        {selectedFile ? selectedFile.name : 'Clique para selecionar'}
                      </span>
                    </div>
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Formatos aceitos: PDF, JPG, PNG, WebP
                </p>
              </div>
            </>
          )}

          {/* Status Messages */}
          {status === 'uploading' && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <span className="text-lg text-gray-700">Fazendo upload do documento...</span>
            </div>
          )}

          {status === 'processing' && (
            <div className="py-8 px-6">
              <div className="flex flex-col items-center gap-4 mb-6">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                <div className="text-center">
                  <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                    Processando com IA
                  </h3>
                  <p className="text-gray-600">
                    Nosso sistema está analisando o documento...
                  </p>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progresso</span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Estimativa: {Math.max(0, 60 - Math.round((progress / 100) * 60))}s restantes
                </p>
              </div>
            </div>
          )}

          {/* Review Section */}
          {status === 'review' && extractedData && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">Documento Processado com Sucesso!</h3>
                    <p className="text-sm text-green-700">
                      Por favor, revise os dados extraídos abaixo antes de confirmar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cliente Identificado */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-4">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-blue-900">
                    {potentialClient ? '✅ Cliente Existente Encontrado' : '🆕 Novo Cliente Será Criado'}
                  </h3>
                </div>

                {potentialClient ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700"><strong>Nome:</strong> {potentialClient.first_name} {potentialClient.last_name}</p>
                    <p className="text-gray-700"><strong>Email:</strong> {potentialClient.email}</p>
                    <p className="text-gray-700"><strong>CPF/CNPJ:</strong> {potentialClient.document}</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      <strong>Nome:</strong> {extractedData.dados_documento?.segurado || 'Cliente Importado'}
                    </p>
                    <p className="text-gray-700">
                      <strong>CPF/CNPJ:</strong> {extractedData.dados_documento?.cnpj || '-'}
                    </p>
                    <p className="text-gray-700">
                      <strong>Email:</strong> {extractedData.dados_pessoais?.email || 'A definir'}
                    </p>
                    <p className="text-xs text-blue-600 mt-3">
                      💡 Um novo cliente será criado automaticamente ao confirmar
                    </p>
                  </div>
                )}
              </div>

              {/* Dados da Apólice (se for apolice_auto) */}
              {documentType === 'apolice_auto' && extractedData.dados_documento && (
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Dados da Apólice</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Número da Apólice</p>
                      <p className="font-semibold text-gray-900">{extractedData.dados_documento.apolice_numero || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Vigência</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(extractedData.dados_documento.data_vigencia_inicio)} até{' '}
                        {formatDate(extractedData.dados_documento.data_vigencia_fim)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Veículo</p>
                      <p className="font-semibold text-gray-900">{extractedData.dados_documento.veiculo_marca_modelo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Placa</p>
                      <p className="font-semibold text-gray-900">{extractedData.dados_documento.veiculo_placa || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Chassi</p>
                      <p className="font-semibold text-gray-900">{extractedData.dados_documento.veiculo_chassi || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Ano/Modelo</p>
                      <p className="font-semibold text-gray-900">{extractedData.dados_documento.veiculo_ano_modelo || '-'}</p>
                    </div>
                    <div className="col-span-2 pt-4 border-t">
                      <p className="text-gray-500 text-xs mb-1">Prêmio Total</p>
                      <p className="font-bold text-2xl text-purple-600">
                        {formatCurrency(extractedData.dados_documento.premio_total || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Coberturas */}
                  {extractedData.dados_documento.coberturas && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Coberturas:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(extractedData.dados_documento.coberturas).map(([key, value]) => (
                          <div key={key} className="flex justify-between bg-gray-50 p-2 rounded">
                            <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="font-medium text-gray-900">{formatCurrency(value as number)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dados Pessoais */}
              {extractedData.dados_pessoais && (
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h3 className="text-md font-bold text-gray-900 mb-3">Dados de Contato</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {extractedData.dados_pessoais.telefone && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Telefone</p>
                        <p className="font-medium text-gray-900">{extractedData.dados_pessoais.telefone}</p>
                      </div>
                    )}
                    {extractedData.dados_pessoais.email && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Email</p>
                        <p className="font-medium text-gray-900">{extractedData.dados_pessoais.email}</p>
                      </div>
                    )}
                    {extractedData.dados_pessoais.endereco && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs mb-1">Endereço</p>
                        <p className="font-medium text-gray-900">{extractedData.dados_pessoais.endereco}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'completed' && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="relative">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                <CheckCircle className="w-20 h-20 text-green-500 relative" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-gray-900 mb-2">
                  🎉 Apólice criada com sucesso!
                </p>
                <p className="text-gray-600">
                  Redirecionando para a página da apólice...
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Aguarde...
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Erro no Processamento</h3>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-between items-center rounded-b-xl">
          {status === 'review' ? (
            <>
              <button
                onClick={resetState}
                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAndSave}
                disabled={confirming}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirmar e Salvar
                  </>
                )}
              </button>
            </>
          ) : status === 'idle' || status === 'error' ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !documentType || uploading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Processar com IA
                  </>
                )}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
