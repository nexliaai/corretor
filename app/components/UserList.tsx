'use client';

import { User } from '../types';
import { Trash2, User as UserIcon } from 'lucide-react';

interface UserListProps {
  users: User[];
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onUserDeleted: () => void;
}

export default function UserList({
  users,
  selectedUser,
  onSelectUser,
  onUserDeleted,
}: UserListProps) {
  const handleDelete = async (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir este usuário e todos os seus arquivos?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUserDeleted();
      } else {
        alert('Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum usuário cadastrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto">
      {users.map((user) => (
        <div
          key={user.id}
          onClick={() => onSelectUser(user)}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            selectedUser?.id === user.id
              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-md'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-1">
                <UserIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                {user.document && (
                  <p className="text-xs text-gray-400 mt-1">Doc: {user.document}</p>
                )}
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(user.id, e)}
              className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
              title="Excluir usuário"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

