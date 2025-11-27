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
    // Limpar postagens antigas (manter apenas as 50 mais recentes)
    const postsKey = 'nutraelite_posts';
    const posts = safeGetItem(postsKey);
    if (posts) {
      try {
        const parsed = JSON.parse(posts);
        if (Array.isArray(parsed) && parsed.length > 50) {
          const recent = parsed.slice(0, 50); // Manter apenas as 50 mais recentes
          safeSetItem(postsKey, JSON.stringify(recent));
          console.log('✅ Limpou postagens antigas, manteve as 50 mais recentes');
        }
      } catch (e) {
        // Se não conseguir parsear, limpar tudo
        localStorage.removeItem(postsKey);
      }
    }

    // Limpar mensagens antigas (manter apenas as 100 mais recentes)
    const messagesKey = 'nutraelite_community_messages';
    const messages = safeGetItem(messagesKey);
    if (messages) {
      try {
        const parsed = JSON.parse(messages);
        if (Array.isArray(parsed) && parsed.length > 100) {
          const recent = parsed.slice(-100); // Manter apenas as 100 mais recentes
          safeSetItem(messagesKey, JSON.stringify(recent));
          console.log('✅ Limpou mensagens antigas, manteve as 100 mais recentes');
        }
      } catch (e) {
        localStorage.removeItem(messagesKey);
      }
    }

    // Limpar outros dados temporários se necessário
    const keysToCheck = ['nutraelite_temp', 'nutraelite_cache'];
    keysToCheck.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignorar
      }
    });
  } catch (error) {
    console.error('❌ Erro ao limpar dados antigos:', error);
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

