export interface User {
  id: string;
  name: string;
  avatar: string;
  points: number;
  rank: number;
  level: string;
  totalSales: number;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: Date;
  resultValue?: number;
  type: 'post' | 'result';
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
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'audio' | 'emoji' | 'image';
  audioDuration?: number;
  audioUrl?: string;
  image?: string;
  author?: {
    name: string;
    avatar: string;
    role?: string;
  };
}
