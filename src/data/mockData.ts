import { User, Post, Prize, RankingPlaque } from '@/types';

export const currentUser: User = {
  id: '1',
  name: 'Você',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  points: 2500,
  rank: 12,
  level: 'Prata',
  totalSales: 15000,
};

export const users: User[] = [
  { id: '2', name: 'Ana Silva', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', points: 8500, rank: 1, level: 'Diamante', totalSales: 85000 },
  { id: '3', name: 'Carlos Santos', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', points: 7200, rank: 2, level: 'Ouro', totalSales: 72000 },
  { id: '4', name: 'Marina Costa', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', points: 6800, rank: 3, level: 'Ouro', totalSales: 68000 },
  { id: '5', name: 'Pedro Lima', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', points: 5500, rank: 4, level: 'Prata', totalSales: 55000 },
  { id: '6', name: 'Julia Rocha', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face', points: 4900, rank: 5, level: 'Prata', totalSales: 49000 },
];

export const posts: Post[] = [
  {
    id: '1',
    author: users[0],
    content: '🔥 RESULTADO INSANO! Fechei mais uma venda de R$ 5.000 usando a estratégia do Rodrigo! O script de vendas está fazendo milagres! 💰',
    likes: 156,
    comments: 23,
    isLiked: false,
    createdAt: new Date(Date.now() - 3600000),
    resultValue: 5000,
    type: 'result',
    image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=600&h=600&fit=crop',
  },
  {
    id: '2',
    author: users[1],
    content: 'Alguém mais está testando os novos criativos? Meu CTR subiu 40% depois de aplicar as técnicas do módulo 3! 📈',
    likes: 89,
    comments: 45,
    isLiked: true,
    createdAt: new Date(Date.now() - 7200000),
    type: 'post',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=600&fit=crop',
  },
  {
    id: '3',
    author: users[2],
    content: '💎 META BATIDA! R$ 15.000 em vendas essa semana! Obrigada comunidade NutraElite pelo suporte! Vocês são incríveis! 🚀',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=600&fit=crop',
    likes: 234,
    comments: 67,
    isLiked: false,
    createdAt: new Date(Date.now() - 86400000),
    resultValue: 15000,
    type: 'result',
  },
  {
    id: '4',
    author: users[3],
    content: 'Novo produto chegando! Estou super animado para testar e compartilhar os resultados com vocês! 💪',
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&h=600&fit=crop',
    likes: 142,
    comments: 28,
    isLiked: false,
    createdAt: new Date(Date.now() - 10800000),
    type: 'post',
  },
  {
    id: '5',
    author: users[4],
    content: 'Mais um resultado incrível! R$ 8.500 em uma única semana seguindo o método! 🔥',
    image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&h=600&fit=crop',
    likes: 198,
    comments: 34,
    isLiked: true,
    createdAt: new Date(Date.now() - 14400000),
    resultValue: 8500,
    type: 'result',
  },
  {
    id: '6',
    author: users[5],
    content: 'A comunidade está crescendo cada vez mais! Obrigada a todos pelo apoio e motivação! 🙏✨',
    image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=600&h=600&fit=crop',
    likes: 312,
    comments: 89,
    isLiked: false,
    createdAt: new Date(Date.now() - 18000000),
    type: 'post',
  },
];

export const prizes: Prize[] = [
  { id: '1', name: 'Mentoria Individual', description: '1 hora de mentoria com Rodrigo Nutra', pointsCost: 5000, image: '🎯', category: 'experience' },
  { id: '2', name: 'Kit Premium', description: 'Kit completo de suplementos', pointsCost: 3000, image: '📦', category: 'physical' },
  { id: '3', name: 'Curso Avançado', description: 'Acesso ao curso de copy avançada', pointsCost: 2000, image: '📚', category: 'digital' },
  { id: '4', name: 'AirPods Pro', description: 'Apple AirPods Pro 2ª geração', pointsCost: 8000, image: '🎧', category: 'physical' },
  { id: '5', name: 'Viagem VIP', description: 'Viagem para evento exclusivo', pointsCost: 15000, image: '✈️', category: 'experience' },
];

export const rankingPlaques: RankingPlaque[] = [
  { id: '1', name: 'Bronze', minSales: 10000, color: '#CD7F32', icon: '🥉' },
  { id: '2', name: 'Prata', minSales: 30000, color: '#C0C0C0', icon: '🥈' },
  { id: '3', name: 'Ouro', minSales: 50000, color: '#FFD700', icon: '🥇' },
  { id: '4', name: 'Diamante', minSales: 100000, color: '#B9F2FF', icon: '💎' },
  { id: '5', name: 'Black', minSales: 250000, color: '#1a1a1a', icon: '🖤' },
];
