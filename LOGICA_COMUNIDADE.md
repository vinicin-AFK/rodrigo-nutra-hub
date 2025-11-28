# 📌 Lógica de Funcionamento da Comunidade

## Estrutura da Comunidade

A Comunidade possui:

- **Usuários** - Membros da plataforma
- **Publicações** - Posts criados pelos usuários
- **Comentários** - Respostas vinculadas a publicações
- **Reações** - Likes, emojis e outras interações
- **Chat comunitário** - Espaço de conversa aberto
- **Sistema de moderação** - Controle de conteúdo
- **Feed público** - Visualização de publicações
- **Feed por tópicos** - Organização por categorias

## Regras de Funcionamento

### Publicações
- Cada usuário pode criar publicações
- Publicações podem conter: texto, imagem, vídeo ou links
- Uma publicação **não pode existir sem um usuário**
- Cada publicação registra: autor, data, horário, tipo, status e engajamento

### Comentários
- Usuários podem comentar em publicações
- Comentários ficam **vinculados a uma publicação específica**
- Um comentário **não pode existir sem uma publicação**
- Cada comentário registra: autor, data, horário, tipo, status

### Reações
- Reações podem ser feitas em **publicações** e **comentários**
- Tipos de reações: likes, emojis, etc.
- Cada reação registra: autor, data, tipo de reação, conteúdo relacionado

### Chat Comunitário
- Espaço aberto para conversas
- **Independente das publicações**, mas sempre ligado ao conjunto de usuários
- Regras de moderação aplicáveis
- Cada mensagem registra: autor, data, horário, tipo, status

### Feed
- Mostra publicações recentes, relevantes e de usuários seguidos/interessantes
- Feed público: todas as publicações visíveis
- Feed por tópicos: organizado por categorias

### Moderação
- Pode ocultar, apagar ou marcar conteúdos impróprios
- Alterações de estado (ocultar, deletar, denunciar) devem ser **rastreáveis**
- Todos os usuários devem ver o mesmo conteúdo (salvo regras de moderação)

## Regras Internas do Sistema

### Dependências Obrigatórias
1. **Publicação → Usuário**: Uma publicação não pode existir sem um usuário
2. **Comentário → Publicação**: Um comentário não pode existir sem uma publicação
3. **Reação → Conteúdo**: Uma reação precisa estar vinculada a uma publicação ou comentário

### Independências
- **Chat é independente das publicações**, mas sempre ligado aos usuários

### Rastreabilidade
- Todas as alterações de estado devem ser registradas
- Histórico de moderação deve ser mantido
- Logs de ações (ocultar, deletar, denunciar) devem existir

## Problemas que o Sistema Deve Tratar

### Inconsistências a Resolver
1. **Publicações sumindo** - Garantir persistência e sincronização
2. **Comentários não aparecendo** - Atualização imediata e consistente
3. **Divergência de visualização de chat entre usuários** - Sincronização em tempo real
4. **Instabilidade do feed ou chat** - Tratamento de erros e fallbacks

## Objetivos da Comunidade

1. ✅ Facilitar interação entre os membros
2. ✅ Criar um ambiente ativo e organizado
3. ✅ Manter estabilidade e consistência dos dados
4. ✅ Garantir que todos vejam o mesmo conteúdo (salvo regras de moderação)

## Aplicação da Lógica

Sempre que trabalhar com a Comunidade, considerar:

- ✅ **Correções**: Verificar dependências e regras
- ✅ **Explicações**: Usar este modelo mental
- ✅ **Ajustes de código**: Garantir alinhamento com as regras
- ✅ **Melhoria de lógica**: Seguir a estrutura definida
- ✅ **Criação de endpoints**: Respeitar dependências
- ✅ **Modelagem de banco**: Implementar relacionamentos corretos
- ✅ **Solução de bugs**: Tratar inconsistências listadas
- ✅ **Organização de fluxo**: Seguir a hierarquia de dependências

## Estrutura de Dados Esperada

### Publicação
```typescript
{
  id: string;
  author: User; // OBRIGATÓRIO - não pode existir sem usuário
  content: string;
  image?: string;
  video?: string;
  links?: string[];
  createdAt: Date;
  updatedAt?: Date;
  type: 'text' | 'image' | 'video' | 'link';
  status: 'active' | 'hidden' | 'deleted';
  engagement: {
    likes: number;
    comments: number;
    reactions: number;
  };
}
```

### Comentário
```typescript
{
  id: string;
  postId: string; // OBRIGATÓRIO - não pode existir sem publicação
  author: User;
  content: string;
  createdAt: Date;
  status: 'active' | 'hidden' | 'deleted';
  reactions?: Reaction[];
}
```

### Reação
```typescript
{
  id: string;
  contentId: string; // ID da publicação ou comentário
  contentType: 'post' | 'comment';
  author: User;
  type: 'like' | 'emoji';
  createdAt: Date;
}
```

### Mensagem do Chat
```typescript
{
  id: string;
  author: User; // OBRIGATÓRIO - sempre ligado a usuário
  content: string;
  type: 'text' | 'image' | 'audio';
  createdAt: Date;
  status: 'active' | 'hidden' | 'deleted';
  // Independente de publicações
}
```

