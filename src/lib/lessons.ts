import { Wallet, TrendingUp, FileText, Shield, BookOpen, BarChart3, Briefcase, Building2, Smartphone, Landmark, LineChart, Receipt, type LucideIcon } from 'lucide-react';

export interface Lesson { title: string; module: string; readTime: string; premium?: boolean; icon: LucideIcon }
export interface Series { id: string; name: string; description: string; icon: LucideIcon; lessons: Lesson[] }

export interface FlatLesson extends Lesson { seriesId: string; seriesName: string }

export const series: Series[] = [
  {
    id: 'basics',
    name: 'Money basics',
    description: 'The fundamentals nobody actually teaches you in school.',
    icon: BookOpen,
    lessons: [
      { module: 'Module 1', title: 'Budgeting in plain English', readTime: '6 min read', icon: Wallet },
      { module: 'Module 2', title: 'What compound interest actually does', readTime: '8 min read', icon: TrendingUp },
      { module: 'Module 3', title: 'Reading a payslip line by line', readTime: '5 min read', icon: Receipt },
      { module: 'Module 4', title: 'Emergency funds — how much and where', readTime: '7 min read', icon: Shield, premium: true },
    ],
  },
  {
    id: 'smart',
    name: 'Smart money',
    description: 'How the people who move markets actually think.',
    icon: BarChart3,
    lessons: [
      { module: 'Module 1', title: 'How Warren Buffett reads a balance sheet', readTime: '12 min read', icon: FileText },
      { module: 'Module 2', title: 'What a 13F filing tells you', readTime: '9 min read', icon: Briefcase, premium: true },
      { module: 'Module 3', title: 'Why hedge funds short stocks', readTime: '10 min read', icon: LineChart, premium: true },
      { module: 'Module 4', title: 'How market-movers think about risk', readTime: '11 min read', icon: TrendingUp, premium: true },
    ],
  },
  {
    id: 'kenya',
    name: 'Kenya money',
    description: 'The accounts, tools, and rules that govern money in Kenya.',
    icon: Landmark,
    lessons: [
      { module: 'Module 1', title: 'M-Pesa fees demystified', readTime: '5 min read', icon: Smartphone },
      { module: 'Module 2', title: 'SACCOs vs banks — which is better for you?', readTime: '8 min read', icon: Building2 },
      { module: 'Module 3', title: 'Buying NSE shares step-by-step', readTime: '10 min read', icon: LineChart, premium: true },
      { module: 'Module 4', title: 'T-Bills via CBK DhowCSD', readTime: '9 min read', icon: Landmark, premium: true },
    ],
  },
];

export function getAllLessons(): FlatLesson[] {
  return series.flatMap((s) => s.lessons.map((l) => ({ ...l, seriesId: s.id, seriesName: s.name })));
}
