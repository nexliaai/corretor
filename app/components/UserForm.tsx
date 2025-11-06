'use client';

import { useState } from 'react';

interface UserFormProps {
  onUserCreated: () => void;
}

export default function UserForm({ onUserCreated }: UserFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    document: '',
    city: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ 
          first_name: '', 
          last_name: '', 
          email: '', 
          phone: '', 
          document: '',
          city: '',
          country: ''
        });
        onUserCreated();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar usuário');
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-b pb-4 mb-4">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Nome *"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm hover:border-gray-400 transition-colors"
          required
        />
        <input
          type="text"
          placeholder="Sobrenome *"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm hover:border-gray-400 transition-colors"
          required
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Email *"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Telefone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm hover:border-gray-400 transition-colors"
        />
        <input
          type="text"
          placeholder="Documento"
          value={formData.document}
          onChange={(e) => setFormData({ ...formData, document: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm hover:border-gray-400 transition-colors"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Cidade"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm hover:border-gray-400 transition-colors"
        />
        <input
          type="text"
          placeholder="País"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm hover:border-gray-400 transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 rounded-lg font-medium transition-all disabled:opacity-50 text-sm shadow-md hover:shadow-lg"
      >
        {loading ? 'Salvando...' : 'Salvar Usuário'}
      </button>
    </form>
  );
}

