// Static content for the dashboard's "Quick tools" row. Each entry is a
// jumping-off point into Ask Orchestra-Core — the tool frames the question,
// the chat (grounded in the lesson library) does the explaining.

export interface Scenario {
  title: string;
  blurb: string;
  question: string;
}

export const whatWouldTheyDoScenarios: Scenario[] = [
  {
    title: 'Reading a balance sheet like Buffett',
    blurb: 'Before buying any share, value investors check a handful of numbers on the balance sheet first.',
    question: 'How would a value investor like Warren Buffett read a company\'s balance sheet before deciding whether it\'s a good business?',
  },
  {
    title: 'What a 13F filing actually tells you',
    blurb: 'Headlines love "Famous Investor just bought X" — but the filing behind that headline is older than it looks.',
    question: 'What is a 13F filing, and what are its real limitations as a source of information?',
  },
  {
    title: 'Why hedge funds short stocks',
    blurb: 'Shorting sounds like betting against a company — but it plays a specific role in how markets price risk.',
    question: 'Why do hedge funds short stocks, and what risks does that strategy carry?',
  },
  {
    title: 'How market-movers think about risk',
    blurb: 'Professional investors size positions and think about downside very differently from how most people invest.',
    question: 'How do professional investors think about risk differently from how beginners usually do?',
  },
];

export interface MoodConcept {
  title: string;
  blurb: string;
  question: string;
}

export const marketMoodConcepts: MoodConcept[] = [
  {
    title: 'Anchoring',
    blurb: 'The first number you hear — a price, a forecast, a target — tends to stick with you longer than it should.',
    question: 'What is anchoring bias, and how does it affect financial decisions?',
  },
  {
    title: 'Loss aversion',
    blurb: 'Losing KES 1,000 tends to feel worse than gaining KES 1,000 feels good — and that shapes how people invest and save.',
    question: 'What is loss aversion, and how does it show up in everyday financial decisions?',
  },
  {
    title: 'Herd behavior',
    blurb: 'When everyone seems to be piling into the same investment, it can feel risky to be the one who isn\'t.',
    question: 'What is herd behavior in markets, and why does it tend to happen near the top or bottom of a price move?',
  },
  {
    title: 'Recency bias',
    blurb: 'After a crash or a rally, it\'s tempting to assume whatever just happened will keep happening.',
    question: 'What is recency bias, and how can it lead investors astray?',
  },
  {
    title: 'Confirmation bias',
    blurb: 'Once you believe a stock or idea is good, it\'s easy to notice the news that agrees with you and skip the rest.',
    question: 'What is confirmation bias, and how can it affect the way someone researches an investment?',
  },
];

/** Day-of-year, used to rotate "today's" scenario/concept without any backend. */
export function dayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
