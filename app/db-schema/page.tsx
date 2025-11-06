'use client';

import { useEffect, useState } from 'react';
import { Database, Table, Copy, CheckCircle } from 'lucide-react';

interface Column {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface TableInfo {
  table_name: string;
  columns: Column[];
}

export default function DbSchemaPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      const response = await fetch('/api/db-schema');
      if (!response.ok) throw new Error('Erro ao buscar schema');
      const data = await response.json();
      setTables(data.tables);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateCreateTable = (table: TableInfo) => {
    const columns = table.columns.map(col => {
      let def = `  ${col.column_name} ${col.data_type}`;
      if (col.character_maximum_length) {
        def += `(${col.character_maximum_length})`;
      }
      if (col.is_nullable === 'NO') {
        def += ' NOT NULL';
      }
      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`;
      }
      return def;
    }).join(',\n');

    return `CREATE TABLE ${table.table_name} (\n${columns}\n);`;
  };

  const generateMarkdownTable = (table: TableInfo) => {
    let md = `## Tabela: ${table.table_name}\n\n`;
    md += `| Coluna | Tipo | Nullable | Default |\n`;
    md += `|--------|------|----------|----------|\n`;
    table.columns.forEach(col => {
      const type = col.data_type + (col.character_maximum_length ? `(${col.character_maximum_length})` : '');
      const nullable = col.is_nullable === 'YES' ? 'Sim' : 'Não';
      const defaultVal = col.column_default || '-';
      md += `| ${col.column_name} | ${type} | ${nullable} | ${defaultVal} |\n`;
    });
    return md;
  };

  const copyAllTables = () => {
    let allTables = '# Estrutura do Banco de Dados\n\n';
    tables.forEach(table => {
      allTables += generateMarkdownTable(table) + '\n\n';
    });
    copyToClipboard(allTables, 'all');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Erro: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Database className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Database Schema</h1>
              <p className="text-gray-600">Estrutura completa do banco de dados PostgreSQL</p>
            </div>
          </div>
          <button
            onClick={copyAllTables}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all"
          >
            {copied === 'all' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Todas as Tabelas Copiadas!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copiar TODAS as Tabelas
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          {tables.map((table) => (
            <div
              key={table.table_name}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Table className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">{table.table_name}</h2>
                  <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                    {table.columns.length} colunas
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(generateMarkdownTable(table), `md-${table.table_name}`)}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {copied === `md-${table.table_name}` ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Tabela
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(generateCreateTable(table), table.table_name)}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {copied === table.table_name ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        SQL
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Coluna
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Nullable
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Default
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {table.columns.map((col) => (
                      <tr key={col.column_name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-semibold text-gray-900">
                            {col.column_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-blue-600">
                            {col.data_type}
                            {col.character_maximum_length && `(${col.character_maximum_length})`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              col.is_nullable === 'YES'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-gray-600">
                            {col.column_default || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SQL CREATE TABLE */}
              <div className="bg-gray-900 p-4">
                <pre className="text-green-400 text-sm font-mono overflow-x-auto">
                  {generateCreateTable(table)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

