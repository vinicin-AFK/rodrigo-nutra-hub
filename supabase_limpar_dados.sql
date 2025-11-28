-- ============================================
-- SCRIPT DE LIMPEZA DO BANCO DE DADOS
-- Execute este arquivo no SQL Editor do Supabase
-- ATENÇÃO: Isso vai DELETAR todos os dados!
-- Use apenas antes de começar a produção
-- ============================================

-- Desabilitar temporariamente RLS para limpeza
ALTER TABLE post_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Limpar todas as tabelas (em ordem de dependência)
DELETE FROM post_likes;
DELETE FROM comments;
DELETE FROM posts;
DELETE FROM community_messages;
DELETE FROM support_messages;
DELETE FROM achievements;
DELETE FROM user_stats;

-- Manter apenas perfis de usuários reais (não deletar profiles)
-- Se quiser deletar TODOS os perfis também, descomente a linha abaixo:
-- DELETE FROM profiles;

-- Reabilitar RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verificar contagem (deve retornar 0 para todas as tabelas, exceto profiles)
SELECT 
  'posts' as tabela, COUNT(*) as total FROM posts
UNION ALL
SELECT 
  'comments' as tabela, COUNT(*) as total FROM comments
UNION ALL
SELECT 
  'post_likes' as tabela, COUNT(*) as total FROM post_likes
UNION ALL
SELECT 
  'community_messages' as tabela, COUNT(*) as total FROM community_messages
UNION ALL
SELECT 
  'support_messages' as tabela, COUNT(*) as total FROM support_messages
UNION ALL
SELECT 
  'achievements' as tabela, COUNT(*) as total FROM achievements
UNION ALL
SELECT 
  'user_stats' as tabela, COUNT(*) as total FROM user_stats
UNION ALL
SELECT 
  'profiles' as tabela, COUNT(*) as total FROM profiles;

-- ✅ Limpeza concluída!
-- O banco está pronto para receber dados reais dos alunos.

