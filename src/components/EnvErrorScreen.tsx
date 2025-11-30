import React from 'react';

type Props = {
  expectedUrl: string;
  keyPrefix?: string;
  onRetry?: () => void;
};

export default function EnvErrorScreen({ expectedUrl, keyPrefix = '', onRetry }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Conexão com o Supabase incorreta</h1>
        <p className="text-sm mb-4">
          O aplicativo detectou que a variável <code>VITE_SUPABASE_URL</code> ou <code>VITE_SUPABASE_ANON_KEY</code> está
          configurada de forma incorreta. Para garantir que todos os usuários acessem a mesma comunidade, o app foi bloqueado.
        </p>

        <div className="bg-gray-100 rounded p-3 mb-4">
          <p className="text-xs font-medium text-gray-600">URL esperada</p>
          <pre className="text-sm text-gray-800 break-words">{expectedUrl}</pre>
        </div>

        {keyPrefix ? (
          <div className="bg-gray-100 rounded p-3 mb-4">
            <p className="text-xs font-medium text-gray-600">Prefixo da ANON KEY detectado</p>
            <pre className="text-sm text-gray-800">{keyPrefix}...</pre>
          </div>
        ) : null}

        <div className="flex gap-3 mt-4">
          <button
            className="flex-1 py-2 px-4 rounded-lg border border-transparent bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            onClick={() => {
              navigator.clipboard?.writeText(expectedUrl);
              alert('URL copiada para a área de transferência');
            }}
          >
            Copiar URL correta
          </button>

          <button
            className="flex-1 py-2 px-4 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium"
            onClick={() => {
              if (onRetry) onRetry();
              else window.location.reload();
            }}
          >
            Tentar novamente / Reload
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Desenvolvedores: atualize o arquivo <code>.env</code> com a URL e a ANON KEY corretas antes de gerar um novo build.
        </p>
      </div>
    </div>
  );
}
