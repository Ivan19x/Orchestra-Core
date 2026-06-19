import {
  Wallet, TrendingUp, TrendingDown, FileText, Shield, BookOpen, BarChart3,
  Briefcase, Building2, Smartphone, Landmark, LineChart, CreditCard,
  Home, Brain, Rocket, Heart, Activity, Receipt, type LucideIcon,
} from 'lucide-react';

export interface Lesson {
  id?: string;
  title: string;
  module: string;
  readTime: string;
  summary?: string;
  premium?: boolean;
  icon: LucideIcon;
  slug?: string;
  tags?: string[];
}

export interface Series {
  id: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  color: string;
  lessons: Lesson[];
  comingSoon?: boolean;
}

export interface FlatLesson extends Lesson { seriesId: string; seriesName: string }

export const series: Series[] = [
  {
    id: 'series-1-money-basics',
    name: 'Money basics',
    tagline: 'The foundation. Free to everyone.',
    icon: BookOpen,
    color: '#7A2330',
    lessons: [
      {
        id: '1-1', module: 'Module 1', slug: '1-1-what-money-actually-is',
        title: 'What money actually is', readTime: '5 min read', icon: Wallet,
        summary: "Money isn't what most people think it is — and understanding the truth changes how you use it.",
        tags: ['foundation', 'money', 'beginners'],
      },
      {
        id: '1-2', module: 'Module 2', slug: '1-2-how-banks-create-money',
        title: 'How banks create money', readTime: '6 min read', icon: Building2,
        summary: "Banks don't just store your money — they multiply it. Here's the mechanism that runs the entire financial world.",
        tags: ['banks', 'money creation', 'beginners'],
      },
      {
        id: '1-3', module: 'Module 3', slug: '1-3-the-50-30-20-rule',
        title: 'The 50/30/20 rule', readTime: '5 min read', icon: Wallet,
        summary: 'The simplest budgeting framework in existence — and how to adapt it to a Kenyan salary.',
        tags: ['budgeting', 'practical', 'beginners'],
      },
      {
        id: '1-4', module: 'Module 4', slug: '1-4-compound-interest-the-eighth-wonder',
        title: 'Compound interest — the eighth wonder', readTime: '7 min read', icon: TrendingUp,
        summary: 'The one concept that makes the difference between being comfortable at 50 and struggling.',
        tags: ['compound interest', 'saving', 'investing', 'beginners'],
      },
      {
        id: '1-5', module: 'Module 5', slug: '1-5-good-debt-vs-bad-debt',
        title: 'Good debt vs bad debt', readTime: '6 min read', icon: CreditCard, premium: true,
        summary: "Not all debt is the enemy. The difference between debt that builds wealth and debt that destroys it.",
        tags: ['debt', 'loans', 'credit'],
      },
      {
        id: '1-6', module: 'Module 6', slug: '1-6-inflation-why-your-kes-shrinks',
        title: "Inflation — why your KES 1,000 shrinks", readTime: '6 min read', icon: TrendingDown, premium: true,
        summary: 'Inflation is the invisible tax on your savings. Understanding it changes how you think about holding cash.',
        tags: ['inflation', 'macro', 'purchasing power'],
      },
      {
        id: '1-7', module: 'Module 7', slug: '1-7-emergency-fund-the-boring-secret',
        title: 'The emergency fund — the boring secret', readTime: '5 min read', icon: Shield, premium: true,
        summary: "The most unsexy financial move that protects every other financial decision you'll ever make.",
        tags: ['emergency fund', 'saving', 'financial security'],
      },
      {
        id: '1-8', module: 'Module 8', slug: '1-8-net-worth-how-to-measure-yourself',
        title: 'Net worth — how to measure yourself', readTime: '6 min read', icon: BarChart3, premium: true,
        summary: 'Your salary tells you what you earn. Your net worth tells you where you actually stand.',
        tags: ['net worth', 'assets', 'liabilities'],
      },
      {
        id: '1-9', module: 'Module 9', slug: '1-9-reading-a-payslip',
        title: 'Reading a payslip line by line', readTime: '5 min read', icon: Receipt, premium: true,
        summary: 'Gross pay, net pay, and the deductions in between — PAYE, NSSF, SHIF, and the Housing Levy explained simply.',
        tags: ['payslip', 'tax', 'paye', 'nssf', 'shif', 'kenya'],
      },
    ],
  },
  {
    id: 'series-2-adult-life-money',
    name: 'Adult life money',
    tagline: "Everything you'll pay for that nobody told you about.",
    icon: Activity,
    color: '#185FA5',
    comingSoon: true,
    lessons: [],
  },
  {
    id: 'series-3-smart-money',
    name: 'Smart money',
    tagline: 'How the people who move markets actually think.',
    icon: BarChart3,
    color: '#0F6E56',
    lessons: [
      { module: 'Module 1', title: 'How Warren Buffett reads a balance sheet', readTime: '12 min read', icon: FileText, slug: 'smart-money/01-buffett-balance-sheet' },
      { module: 'Module 2', title: 'What a 13F filing tells you', readTime: '9 min read', icon: Briefcase, premium: true, slug: 'smart-money/02-13f-filings' },
      { module: 'Module 3', title: 'Why hedge funds short stocks', readTime: '10 min read', icon: LineChart, premium: true, slug: 'smart-money/03-why-hedge-funds-short' },
      { module: 'Module 4', title: 'How market-movers think about risk', readTime: '11 min read', icon: TrendingUp, premium: true, slug: 'smart-money/04-how-market-movers-think-about-risk' },
    ],
  },
  {
    id: 'series-4-kenya-money',
    name: 'Kenya money',
    tagline: 'The local financial landscape nobody maps for you.',
    icon: Landmark,
    color: '#854F0B',
    lessons: [
      { module: 'Module 1', title: 'M-Pesa fees demystified', readTime: '5 min read', icon: Smartphone, slug: 'kenya-money/01-mpesa-fees-demystified' },
      { module: 'Module 2', title: 'SACCOs vs banks — which is better for you?', readTime: '8 min read', icon: Building2, slug: 'kenya-money/02-saccos-vs-banks' },
      { module: 'Module 3', title: 'Buying NSE shares step-by-step', readTime: '10 min read', icon: LineChart, premium: true, slug: 'kenya-money/03-buying-nse-shares' },
      { module: 'Module 4', title: 'T-Bills via CBK DhowCSD', readTime: '9 min read', icon: Landmark, premium: true, slug: 'kenya-money/04-tbills-dhowcsd' },
    ],
  },
  {
    id: 'series-5-teenager-to-adult',
    name: 'Teenager to adult',
    tagline: 'The guide you should have been given at 18.',
    icon: Rocket,
    color: '#993556',
    comingSoon: true,
    lessons: [],
  },
  {
    id: 'series-6-psychology-of-money',
    name: 'Psychology of money',
    tagline: 'Why smart people make terrible money decisions.',
    icon: Brain,
    color: '#3C3489',
    comingSoon: true,
    lessons: [],
  },
  {
    id: 'series-7-home-household',
    name: 'Home & household money',
    tagline: 'Renting, owning, and running a home without going broke.',
    icon: Home,
    color: '#3B6D11',
    comingSoon: true,
    lessons: [],
  },
  {
    id: 'series-8-investing-saving',
    name: 'Investing & saving',
    tagline: 'Making your money work while you sleep.',
    icon: TrendingUp,
    color: '#185FA5',
    comingSoon: true,
    lessons: [],
  },
  {
    id: 'series-9-family-parenting',
    name: 'Family & parenting money',
    tagline: 'Raising financially smart children — and a stable home.',
    icon: Heart,
    color: '#993556',
    comingSoon: true,
    lessons: [],
  },
];

export function getAllLessons(): FlatLesson[] {
  return series.flatMap((s) =>
    s.lessons.map((l) => ({ ...l, seriesId: s.id, seriesName: s.name }))
  );
}
