# 🎧 Sistema de Suporte - Guia de Uso

## 📋 Visão Geral

O sistema de suporte permite que uma pessoa real (atendente) faça login e responda às mensagens dos alunos na comunidade.

## 🔐 Como Funciona

### Para o Atendente de Suporte

1. **Login com Email de Suporte**
   - Use um dos emails configurados como suporte (veja lista abaixo)
   - O sistema detecta automaticamente e atribui o role `support`
   - Você terá acesso à interface de suporte

2. **Interface de Suporte**
   - Ao acessar o chat de suporte, você verá uma lista de todas as conversas
   - Cada conversa mostra:
     - Nome do usuário
     - Última mensagem
     - Quantidade de mensagens não lidas
     - Horário da última mensagem

3. **Responder Mensagens**
   - Clique em uma conversa para abri-la
   - Digite sua resposta e envie
   - Suas respostas aparecerão com badge "support"

### Para os Alunos

1. **Enviar Mensagem**
   - Acesse o chat de suporte
   - Digite sua mensagem
   - A mensagem será salva e ficará aguardando resposta

2. **Receber Resposta**
   - Quando o suporte responder, a mensagem aparecerá no chat
   - Mensagens do suporte têm badge "support"

## 🔐 Credenciais de Suporte

**Login Fixo de Suporte:**
- **Email:** `suporte@gmail.com`
- **Senha:** `suporte123`

Este login sempre terá acesso de suporte, independente de estar no Supabase ou modo offline.

## 📧 Emails Configurados como Suporte

Além do login fixo acima, os seguintes emails também são automaticamente reconhecidos como suporte:

- `suporte@nutraelite.com`
- `support@nutraelite.com`
- `atendimento@nutraelite.com`
- `gustavo@nutraelite.com`
- `socio.gustavo@nutraelite.com`

**Ou qualquer email que contenha:**
- "suporte"
- "support"
- "atendimento"

## 🔧 Como Adicionar Novos Emails de Suporte

Edite o arquivo `src/contexts/AuthContext.tsx` e adicione o email na lista `SUPPORT_EMAILS`:

```typescript
const SUPPORT_EMAILS = [
  'suporte@nutraelite.com',
  'support@nutraelite.com',
  'atendimento@nutraelite.com',
  'gustavo@nutraelite.com',
  'socio.gustavo@nutraelite.com',
  'seu-email@nutraelite.com', // Adicione aqui
];
```

## 💾 Armazenamento

- **LocalStorage**: Mensagens são salvas localmente para funcionar offline
- **Supabase** (se configurado): Sincroniza mensagens entre dispositivos
- Tabela: `support_messages` (criar no Supabase se necessário)

## 🎯 Funcionalidades

✅ Login diferenciado para suporte  
✅ Lista de todas as conversas  
✅ Contador de mensagens não lidas  
✅ Interface diferenciada para suporte  
✅ Respostas em tempo real  
✅ Persistência de mensagens  
✅ Funciona offline  

## 📝 Próximos Passos (Opcional)

- [ ] Criar tabela `support_messages` no Supabase
- [ ] Adicionar notificações quando houver nova mensagem
- [ ] Adicionar status "online/offline" do suporte
- [ ] Adicionar histórico de conversas
- [ ] Adicionar busca de conversas

