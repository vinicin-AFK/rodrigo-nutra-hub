export interface User {
  id: string;
  name: string;
  avatar: string;
  points: number;
  rank: number;
  level: string;
  totalSales: number;
  role?: 'user' | 'support' | 'admin';
  email?: string;
}

export interface Comment {
  id: string;
  postId: string; // OBRIGATÓRIO - não pode existir sem publicação
  author: User; // OBRIGATÓRIO - não pode existir sem usuário
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  status?: 'active' | 'hidden' | 'deleted'; // Para moderação
}

export interface Post {
  id: string;
  author: User; // OBRIGATÓRIO - não pode existir sem usuário
  content: string;
  image?: string;
  video?: string;
  links?: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: Date;
  updatedAt?: Date;
  resultValue?: number;
  type: 'post' | 'result';
  status?: 'active' | 'hidden' | 'deleted'; // Para moderação
  commentsList?: Comment[];
  engagement?: {
    likes: number;
    comments: number;
    reactions: number;
  };
}

export interface Prize {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  image: string;
  category: 'physical' | 'digital' | 'experience';
}

export interface RankingPlaque {
  id: string;
  name: string;
  minSales: number;
  color: string;
  icon: string;
}

export interface Message {
  id: string;
  author: {
    id: string; // OBRIGATÓRIO - sempre ligado a usuário
    name: string;
    avatar: string;
    role?: string;
  }; // OBRIGATÓRIO - não pode existir sem usuário
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'audio' | 'emoji' | 'image';
  audioDuration?: number;
  audioUrl?: string;
  image?: string;
  status?: 'active' | 'hidden' | 'deleted'; // Para moderação
  // Independente de publicações - sempre ligado apenas aos usuários
}

export interface Reaction {
  id: string;
  contentId: string; // ID da publicação ou comentário
  contentType: 'post' | 'comment'; // Tipo de conteúdo
  author: User; // OBRIGATÓRIO
  type: 'like' | 'emoji';
  emoji?: string; // Se type for 'emoji'
  createdAt: Date;
}
