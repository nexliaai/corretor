'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, UserFile } from '../types';
import FileUpload from './FileUpload';
import FileList from './FileList';

interface FileManagerProps {
  user: User;
}

export default function FileManager({ user }: FileManagerProps) {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/files?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileUploaded = () => {
    loadFiles();
  };

  const handleFileDeleted = () => {
    loadFiles();
  };

  return (
    <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-200">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Arquivos de {user.first_name} {user.last_name}
        </h2>
        <p className="text-sm text-gray-600">{user.email}</p>
      </div>

      <div className="mb-6">
        <FileUpload userId={user.id} onFileUploaded={handleFileUploaded} />
      </div>

      <div className="border-t pt-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando arquivos...</div>
        ) : (
          <FileList files={files} onFileDeleted={handleFileDeleted} />
        )}
      </div>
    </div>
  );
}

