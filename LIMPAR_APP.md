# 🧹 Limpeza do App para Produção

## Scripts de Limpeza

### 1. Limpar Banco de Dados Supabase

Execute o arquivo `supabase_limpar_dados.sql` no SQL Editor do Supabase:

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de `supabase_limpar_dados.sql`
4. Execute o script

⚠️ **ATENÇÃO**: Isso vai deletar TODOS os dados de:
- Posts
- Comentários
- Curtidas
- Mensagens da comunidade
- Mensagens de suporte
- Conquistas
- Estatísticas

Os perfis de usuários serão mantidos (mas você pode deletá-los também se necessário).

### 2. Limpar localStorage no Navegador

Para limpar os dados locais dos usuários, você pode:

**Opção 1: Limpar manualmente no navegador**
- Chrome/Edge: F12 → Application → Local Storage → Limpar
- Firefox: F12 → Storage → Local Storage → Limpar
- Safari: Desenvolvedor → Web Inspector → Storage → Local Storage → Limpar

**Opção 2: Adicionar botão de limpeza no app (recomendado para desenvolvimento)**

### 3. Dados Mock Removidos

Os seguintes dados mock foram removidos ou tornados opcionais:
- Posts de exemplo (agora vêm apenas do Supabase)
- Usuários de exemplo (agora vêm apenas do Supabase)
- Dados mock mantidos apenas para fallback quando não há dados reais

## ✅ Checklist de Produção

- [ ] Executar script de limpeza do Supabase
- [ ] Verificar que não há dados de teste no banco
- [ ] Testar criação de post (deve funcionar normalmente)
- [ ] Testar criação de mensagem (deve funcionar normalmente)
- [ ] Verificar que o feed está vazio (normal, será preenchido pelos alunos)
- [ ] Verificar que o chat está vazio (normal, será preenchido pelos alunos)

## 🚀 Pronto para Produção!

Após a limpeza, o app está pronto para receber dados reais dos alunos. Todos os dados serão criados pelos próprios usuários através do app.

