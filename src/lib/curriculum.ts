// The full planned curriculum — the "skeleton" the lessons page shows so the
// whole programme is visible from day one. Modules listed here that DON'T yet
// have a content file in src/content/lessons/ render as "Soon" (locked). The
// moment you drop in the matching S<series>M<module>.md file, that module goes
// live automatically (the real lesson from the file takes over) — you do NOT
// edit this file to publish content.
//
// You only touch this file to change the PLAN itself: rename a planned module,
// add a brand-new module beyond the ones below, or reorder the plan. Day-to-day
// content publishing never needs it — see CONTENT-README.md.

export interface ModulePlan {
  module: number;
  title: string;
}

export interface SeriesPlan {
  series: number;
  title: string;
  modules: ModulePlan[];
}

export const CURRICULUM: SeriesPlan[] = [
  {
    series: 1,
    title: 'Money Basics',
    modules: [
      { module: 1, title: 'What Money Actually Is' },
      { module: 2, title: 'Budgeting: Where Your Money Goes' },
      { module: 3, title: 'Saving: How to Keep the Money You Make' },
      { module: 4, title: 'Needs vs Wants & Smart Spending' },
      { module: 5, title: 'Good Debt vs Bad Debt' },
      { module: 6, title: 'Understanding Inflation & the Cost of Living' },
      { module: 7, title: 'The Emergency Fund' },
      { module: 8, title: "Net Worth: Knowing What You're Worth" },
    ],
  },
  {
    series: 2,
    title: 'Adult Life Money',
    modules: [
      { module: 1, title: 'Your First Salary & Understanding Your Payslip' },
      { module: 2, title: 'Opening & Using Bank Accounts Wisely' },
      { module: 3, title: 'Rent & Moving Out: The Real Costs' },
      { module: 4, title: 'Managing Bills & Utilities' },
      { module: 5, title: 'Understanding Loans & Credit' },
      { module: 6, title: 'Insurance Basics' },
      { module: 7, title: 'Taxes for the Employed & Self-Employed' },
      { module: 8, title: 'Building & Protecting Your Credit Reputation' },
      { module: 9, title: 'Transport & Car Ownership Costs' },
      { module: 10, title: 'Avoiding Scams, Fraud & Get-Rich-Quick Schemes' },
    ],
  },
  {
    series: 3,
    title: 'Smart Money',
    modules: [
      { module: 1, title: 'How the Wealthy Think About Money' },
      { module: 2, title: 'Multiple Income Streams & Side Hustles' },
      { module: 3, title: 'Understanding Assets That Pay You' },
      { module: 4, title: 'Reading Financial News & Tracking Markets' },
      { module: 5, title: 'How Banks & Lenders Make Money' },
      { module: 6, title: 'Negotiation & Earning More' },
      { module: 7, title: 'Avoiding Lifestyle Inflation' },
      { module: 8, title: 'Money Habits of Financially Free People' },
    ],
  },
  {
    series: 4,
    title: 'Kenya Money',
    modules: [
      { module: 1, title: 'The Kenyan Financial System' },
      { module: 2, title: 'M-Pesa & Mobile Money Mastery' },
      { module: 3, title: 'SACCOs Deep Dive' },
      { module: 4, title: 'The Nairobi Securities Exchange' },
      { module: 5, title: 'Government Securities: T-Bills, T-Bonds & DhowCSD' },
      { module: 6, title: 'Kenyan Taxes in Full' },
      { module: 7, title: 'Land & Property in Kenya' },
      { module: 8, title: 'Chamas, Table Banking & Group Investing' },
    ],
  },
  {
    series: 5,
    title: 'Teenager to Adult',
    modules: [
      { module: 1, title: 'Your First Money: Pocket Money, Gifts & Earning Young' },
      { module: 2, title: 'Saving as a Student' },
      { module: 3, title: 'Avoiding Debt Traps Young' },
      { module: 4, title: 'Your First Job or Hustle as a Young Person' },
      { module: 5, title: 'HELB & Financing Your Education' },
      { module: 6, title: 'Opening Your First Accounts' },
      { module: 7, title: 'Building Good Money Habits Early' },
      { module: 8, title: 'Money Skills Before You Leave Home' },
    ],
  },
  {
    series: 6,
    title: 'Psychology of Money',
    modules: [
      { module: 1, title: 'Why We Spend: The Emotions Behind Money' },
      { module: 2, title: 'Instant Gratification vs Delayed Reward' },
      { module: 3, title: 'Money Beliefs & Where They Come From' },
      { module: 4, title: 'Peer Pressure, Status & Social Spending' },
      { module: 5, title: 'Behavioural Traps: Betting, Impulse & FOMO' },
      { module: 6, title: 'Building a Healthy Relationship with Money' },
    ],
  },
  {
    series: 7,
    title: 'Home & Household',
    modules: [
      { module: 1, title: 'Running a Household Budget' },
      { module: 2, title: 'The Real Cost of Living Alone vs Sharing' },
      { module: 3, title: 'Smart Grocery Shopping & Food Budgeting' },
      { module: 4, title: 'Managing Utility Bills' },
      { module: 5, title: 'Furnishing & Equipping a Home Affordably' },
      { module: 6, title: 'Household Debt & Shared Finances' },
      { module: 7, title: 'Saving on Everyday Expenses' },
      { module: 8, title: 'Planning for Household Emergencies' },
      { module: 9, title: 'Domestic Help & Household Services Costs' },
    ],
  },
  {
    series: 8,
    title: 'Investing & Saving',
    modules: [
      { module: 1, title: 'Saving vs Investing: The Difference' },
      { module: 2, title: 'The Power of Compound Interest' },
      { module: 3, title: 'Money Market Funds Explained' },
      { module: 4, title: 'SACCOs as an Investment' },
      { module: 5, title: 'The Stock Market & NSE' },
      { module: 6, title: 'Government Bonds & Treasury Bills' },
      { module: 7, title: 'Real Estate & Land Investing' },
      { module: 8, title: 'Risk, Return & Diversification' },
      { module: 9, title: 'Retirement Planning & Pensions' },
      { module: 10, title: 'Building a Long-Term Investment Plan' },
    ],
  },
  {
    series: 9,
    title: 'Family & Parenting',
    modules: [
      { module: 1, title: 'Money Conversations with Your Partner' },
      { module: 2, title: 'Budgeting as a Family' },
      { module: 3, title: "Saving for Your Children's Education" },
      { module: 4, title: 'Teaching Kids About Money' },
      { module: 5, title: 'Black Tax & Supporting Extended Family' },
      { module: 6, title: 'Life Insurance & Protecting Your Family' },
      { module: 7, title: 'Wills, Inheritance & Succession' },
      { module: 8, title: 'Major Family Expenses: Weddings, Funerals & Harambees' },
      { module: 9, title: 'Building Generational Wealth' },
    ],
  },
];
