// Utilitários para gerenciar localStorage com tratamento de quota

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
      console.warn('⚠️ localStorage cheio, limpando dados antigos...');
      // Limpar dados antigos e tentar novamente
      clearOldData();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        console.error('❌ Ainda não foi possível salvar após limpeza:', retryError);
        return false;
      }
    }
    console.error('❌ Erro ao salvar no localStorage:', error);
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('❌ Erro ao ler do localStorage:', error);
    return null;
  }
}

function clearOldData() {
  try {
    // Limpar postagens antigas (manter apenas as 20 mais recentes)
    const postsKey = 'nutraelite_posts';
    const posts = safeGetItem(postsKey);
    if (posts) {
      try {
        const parsed = JSON.parse(posts);
        if (Array.isArray(parsed) && parsed.length > 20) {
          const recent = parsed.slice(0, 20); // Manter apenas as 20 mais recentes
          try {
            localStorage.setItem(postsKey, JSON.stringify(recent));
            console.log('✅ Limpou postagens antigas, manteve as 20 mais recentes');
          } catch (e) {
            // Se ainda não conseguir, limpar tudo
            localStorage.removeItem(postsKey);
            console.log('⚠️ Limpou todas as postagens devido a falta de espaço');
          }
        }
      } catch (e) {
        // Se não conseguir parsear, limpar tudo
        try {
          localStorage.removeItem(postsKey);
        } catch (e2) {
          // Ignorar
        }
      }
    }

    // Limpar mensagens antigas (manter apenas as 50 mais recentes)
    const messagesKey = 'nutraelite_community_messages';
    const messages = safeGetItem(messagesKey);
    if (messages) {
      try {
        const parsed = JSON.parse(messages);
        if (Array.isArray(parsed) && parsed.length > 50) {
          const recent = parsed.slice(-50); // Manter apenas as 50 mais recentes
          try {
            localStorage.setItem(messagesKey, JSON.stringify(recent));
            console.log('✅ Limpou mensagens antigas, manteve as 50 mais recentes');
          } catch (e) {
            // Se ainda não conseguir, limpar tudo
            localStorage.removeItem(messagesKey);
            console.log('⚠️ Limpou todas as mensagens devido a falta de espaço');
          }
        }
      } catch (e) {
        try {
          localStorage.removeItem(messagesKey);
        } catch (e2) {
          // Ignorar
        }
      }
    }

    // Limpar outros dados temporários
    const keysToCheck = ['nutraelite_temp', 'nutraelite_cache', '__storage_test__'];
    keysToCheck.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignorar
      }
    });
  } catch (error) {
    console.error('❌ Erro ao limpar dados antigos:', error);
    // Último recurso - limpar tudo exceto auth
    try {
      const auth = localStorage.getItem('nutraelite_auth');
      localStorage.clear();
      if (auth) {
        localStorage.setItem('nutraelite_auth', auth);
      }
      console.log('⚠️ Limpeza completa do localStorage (exceto auth)');
    } catch (e) {
      console.error('❌ Erro crítico ao limpar localStorage:', e);
    }
  }
}

// Função para verificar e limpar automaticamente se necessário
export function ensureStorageSpace(): void {
  try {
    // Tentar salvar um item de teste
    const testKey = '__storage_test__';
    const testValue = 'test';
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
      console.warn('⚠️ Espaço no localStorage insuficiente, limpando...');
      clearOldData();
    }
  }
}

/**
 * Limpa todo o cache do aplicativo
 * @param preserveAuth - Se true, preserva os dados de autenticação (login)
 * @returns Objeto com informações sobre o que foi limpo
 */
export function clearAppCache(preserveAuth: boolean = true): {
  cleared: string[];
  preserved: string[];
  totalCleared: number;
} {
  const cleared: string[] = [];
  const preserved: string[] = [];
  
  try {
    // Lista de todas as chaves do localStorage relacionadas ao app
    const appKeys = [
      'nutraelite_posts',
      'nutraelite_community_messages',
      'nutraelite_support_messages',
      'nutraelite_users',
      'nutraelite_stats',
      'nutraelite_achievements',
      'nutraelite_user_achievements',
      'nutraelite_temp',
      'nutraelite_cache',
      '__storage_test__',
    ];
    
    // Preservar autenticação se solicitado
    let authData: string | null = null;
    if (preserveAuth) {
      authData = localStorage.getItem('nutraelite_auth');
      if (authData) {
        preserved.push('nutraelite_auth');
      }
    }
    
    // Limpar todas as chaves do app
    appKeys.forEach(key => {
      try {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          cleared.push(key);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao limpar ${key}:`, error);
      }
    });
    
    // Se não preservar auth, limpar tudo
    if (!preserveAuth) {
      try {
        localStorage.clear();
        console.log('✅ Cache completamente limpo (incluindo autenticação)');
      } catch (error) {
        console.error('❌ Erro ao limpar completamente:', error);
      }
    } else {
      // Restaurar autenticação se foi preservada
      if (authData) {
        try {
          localStorage.setItem('nutraelite_auth', authData);
        } catch (error) {
          console.warn('⚠️ Erro ao restaurar autenticação:', error);
        }
      }
    }
    
    console.log(`✅ Cache limpo: ${cleared.length} itens removidos`);
    if (preserved.length > 0) {
      console.log(`ℹ️ Preservado: ${preserved.join(', ')}`);
    }
    
    return {
      cleared,
      preserved,
      totalCleared: cleared.length,
    };
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    return {
      cleared: [],
      preserved: preserveAuth ? ['nutraelite_auth'] : [],
      totalCleared: 0,
    };
  }
}

