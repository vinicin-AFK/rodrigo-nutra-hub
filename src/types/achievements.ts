export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'post' | 'like' | 'rank' | 'prize' | 'milestone';
  unlockedAt?: Date;
  progress?: number;
  target?: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Postagens
  {
    id: 'first_post',
    name: 'Primeira Publicação',
    description: 'Faça sua primeira postagem',
    icon: '📝',
    category: 'post',
    target: 1,
  },
  {
    id: '10_posts',
    name: 'Autor Ativo',
    description: 'Faça 10 postagens',
    icon: '✍️',
    category: 'post',
    target: 10,
  },
  {
    id: '50_posts',
    name: 'Influenciador',
    description: 'Faça 50 postagens',
    icon: '📢',
    category: 'post',
    target: 50,
  },
  {
    id: '100_posts',
    name: 'Criador de Conteúdo',
    description: 'Faça 100 postagens',
    icon: '🎬',
    category: 'post',
    target: 100,
  },
  
  // Curtidas
  {
    id: 'first_like',
    name: 'Primeira Curtida',
    description: 'Receba sua primeira curtida',
    icon: '❤️',
    category: 'like',
    target: 1,
  },
  {
    id: '10_likes',
    name: 'Popular',
    description: 'Receba 10 curtidas',
    icon: '🔥',
    category: 'like',
    target: 10,
  },
  {
    id: '50_likes',
    name: 'Famoso',
    description: 'Receba 50 curtidas',
    icon: '⭐',
    category: 'like',
    target: 50,
  },
  {
    id: '100_likes',
    name: 'Viral',
    description: 'Receba 100 curtidas',
    icon: '💫',
    category: 'like',
    target: 100,
  },
  {
    id: '500_likes',
    name: 'Lenda',
    description: 'Receba 500 curtidas',
    icon: '👑',
    category: 'like',
    target: 500,
  },
  
  // Ranks
  {
    id: 'rank_bronze',
    name: 'Bronze',
    description: 'Alcance o rank Bronze',
    icon: '🥉',
    category: 'rank',
  },
  {
    id: 'rank_silver',
    name: 'Prata',
    description: 'Alcance o rank Prata',
    icon: '🥈',
    category: 'rank',
  },
  {
    id: 'rank_gold',
    name: 'Ouro',
    description: 'Alcance o rank Ouro',
    icon: '🥇',
    category: 'rank',
  },
  {
    id: 'rank_platinum',
    name: 'Platina',
    description: 'Alcance o rank Platina',
    icon: '💎',
    category: 'rank',
  },
  {
    id: 'rank_diamond',
    name: 'Diamante',
    description: 'Alcance o rank Diamante',
    icon: '💠',
    category: 'rank',
  },
  
  // Prêmios
  {
    id: 'first_prize',
    name: 'Primeiro Prêmio',
    description: 'Resgate seu primeiro prêmio',
    icon: '🎁',
    category: 'prize',
    target: 1,
  },
  {
    id: '5_prizes',
    name: 'Colecionador',
    description: 'Resgate 5 prêmios',
    icon: '🏆',
    category: 'prize',
    target: 5,
  },
  
  // Marcos
  {
    id: '100_points',
    name: 'Centenário',
    description: 'Acumule 100 pontos',
    icon: '💯',
    category: 'milestone',
    target: 100,
  },
  {
    id: '500_points',
    name: 'Quinhentos',
    description: 'Acumule 500 pontos',
    icon: '🎯',
    category: 'milestone',
    target: 500,
  },
  {
    id: '1000_points',
    name: 'Mil Pontos',
    description: 'Acumule 1000 pontos',
    icon: '🌟',
    category: 'milestone',
    target: 1000,
  },
];

