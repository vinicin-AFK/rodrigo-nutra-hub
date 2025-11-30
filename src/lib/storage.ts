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
    // ⚠️ NÃO limpar posts e mensagens - são dados importantes
    // Apenas limpar dados temporários
    console.log('⚠️ localStorage cheio - limpando apenas dados temporários');
    
    // Limpar apenas dados temporários, NÃO posts/mensagens/auth
    const tempKeys = ['nutraelite_temp', 'nutraelite_cache', '__storage_test__'];
    tempKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignorar
      }
    });
    
    // Se ainda não tiver espaço, tentar reduzir posts/mensagens (mas não limpar completamente)
    const postsKey = 'nutraelite_posts';
    const posts = safeGetItem(postsKey);
    if (posts) {
      try {
        const parsed = JSON.parse(posts);
        if (Array.isArray(parsed) && parsed.length > 100) {
          // Manter apenas as 100 mais recentes (não 20)
          const recent = parsed.slice(0, 100);
          try {
            localStorage.setItem(postsKey, JSON.stringify(recent));
            console.log('✅ Reduziu postagens para 100 mais recentes');
          } catch (e) {
            // Se ainda não conseguir, manter como está (não limpar)
            console.warn('⚠️ Não foi possível reduzir posts, mantendo como está');
          }
        }
      } catch (e) {
        // Não limpar se não conseguir parsear
        console.warn('⚠️ Erro ao processar posts, mantendo como está');
      }
    }

    // Limpar mensagens antigas (manter apenas as 200 mais recentes, não 50)
    const messagesKey = 'nutraelite_community_messages';
    const messages = safeGetItem(messagesKey);
    if (messages) {
      try {
        const parsed = JSON.parse(messages);
        if (Array.isArray(parsed) && parsed.length > 200) {
          // Manter apenas as 200 mais recentes (não 50)
          const recent = parsed.slice(-200);
          try {
            localStorage.setItem(messagesKey, JSON.stringify(recent));
            console.log('✅ Reduziu mensagens para 200 mais recentes');
          } catch (e) {
            // Se ainda não conseguir, manter como está (não limpar)
            console.warn('⚠️ Não foi possível reduzir mensagens, mantendo como está');
          }
        }
      } catch (e) {
        // Não limpar se não conseguir parsear
        console.warn('⚠️ Erro ao processar mensagens, mantendo como está');
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
    // ⚠️ ÚLTIMO RECURSO: Apenas se realmente necessário
    // Preservar auth, posts e mensagens
    try {
      const auth = localStorage.getItem('nutraelite_auth');
      const posts = localStorage.getItem('nutraelite_posts');
      const messages = localStorage.getItem('nutraelite_community_messages');
      
      // Limpar apenas temporários
      localStorage.removeItem('nutraelite_temp');
      localStorage.removeItem('nutraelite_cache');
      localStorage.removeItem('__storage_test__');
      
      // Restaurar dados importantes
      if (auth) {
        localStorage.setItem('nutraelite_auth', auth);
      }
      if (posts) {
        localStorage.setItem('nutraelite_posts', posts);
      }
      if (messages) {
        localStorage.setItem('nutraelite_community_messages', messages);
      }
      
      console.log('⚠️ Limpeza parcial do localStorage (preservou auth, posts e mensagens)');
    } catch (e) {
      console.error('❌ Erro crítico ao limpar localStorage:', e);
      // Não fazer nada - manter dados como estão
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

