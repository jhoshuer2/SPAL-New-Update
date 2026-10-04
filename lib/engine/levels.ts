// Level catalogue (spec Appendix A). Pure data, shared by UI and server.
import type { Level } from "./placement";

export type BeginOption = { key: string; title: string; outcome: string };
export type LevelDef = {
  level: Level;
  name: string;
  quote: string;
  blurb: string;
  begin: BeginOption[];
};

export const LEVELS: LevelDef[] = [
  { level: 0, name: "Dreamer", quote: "I want to start, but I don't know where.",
    blurb: "You have an idea, a skill or some money, and you haven't sold yet.",
    begin: [
      { key: "shape_idea", title: "Shape my idea", outcome: "Turn a rough idea into a clear offer" },
      { key: "find_idea", title: "Find an idea that fits me", outcome: "Spal asks about your skills, money and time, then suggests options" },
      { key: "startup_budget", title: "Plan my startup budget", outcome: "Know what you need and what you have" },
      { key: "learn_basics", title: "Learn the basics", outcome: "Short lessons for first-timers" },
    ] },
  { level: 1, name: "Starter", quote: "I'm selling, but it's still a hustle.",
    blurb: "You're making sales, often part-time, and business and personal money get mixed.",
    begin: [
      { key: "track_money", title: "Track my sales and spending", outcome: "See where the money goes" },
      { key: "price_right", title: "Price my products right", outcome: "Know your real profit per item" },
      { key: "get_customers", title: "Get more customers", outcome: "Ideas matched to what you sell" },
      { key: "separate_money", title: "Separate business and personal money", outcome: "Simple habits that make growth possible" },
    ] },
  { level: 2, name: "Builder", quote: "It's real now. I need structure.",
    blurb: "Your business is registered, sales are steady, and you're starting to organise.",
    begin: [
      { key: "records_order", title: "Get my records in order", outcome: "Clean books you can show a bank" },
      { key: "plan_growth", title: "Plan my growth", outcome: "A 6-month plan with targets" },
      { key: "tax_compliance", title: "Sort out tax and compliance", outcome: "TIN, returns and reminders" },
      { key: "build_brand", title: "Build my brand", outcome: "Name, look and voice that stick" },
    ] },
  { level: 3, name: "Team", quote: "I'm not alone in the business anymore.",
    blurb: "You pay at least one person and roles are forming.",
    begin: [
      { key: "hire_right", title: "Hire the right people", outcome: "Roles, job posts and interviews" },
      { key: "salaries", title: "Set up salaries", outcome: "Schedules and reminders" },
      { key: "clear_roles", title: "Give everyone clear roles", outcome: "Who does what, written down" },
      { key: "better_meetings", title: "Run better meetings", outcome: "Spal takes notes and tracks actions" },
    ] },
  { level: 4, name: "Scaling", quote: "It works. Now I want more of it.",
    blurb: "A growing team across several places or channels, and you're looking at funding.",
    begin: [
      { key: "expand", title: "Expand to a new location or market", outcome: "Test before you commit" },
      { key: "systems", title: "Build systems and SOPs", outcome: "So it runs without you" },
      { key: "funding_ready", title: "Get funding-ready", outcome: "Numbers and story for lenders or investors" },
      { key: "find_mentor", title: "Find a mentor", outcome: "Someone who has done it" },
    ] },
  { level: 5, name: "Established", quote: "I've built something. What's next?",
    blurb: "A mature company, maybe several businesses, thinking about investment and legacy.",
    begin: [
      { key: "portfolio", title: "Manage all my businesses in one place", outcome: "Portfolio view" },
      { key: "investment", title: "Prepare for investment", outcome: "Board-ready reporting" },
      { key: "mentor", title: "Give back as a mentor", outcome: "Guide the next generation" },
      { key: "legacy", title: "Plan the long term", outcome: "Succession and legacy" },
    ] },
];

export const levelDef = (l: Level): LevelDef => LEVELS[l];
