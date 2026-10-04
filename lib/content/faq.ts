// Help content (L07). Plain-language answers. Anything about registration, tax or fees is a pointer to the official body,
// not advice: those steps change, so they stay flagged for review (spec §0.2).
export type Faq = { q: string; a: string; verify?: boolean };
export const FAQS: Faq[] = [
  { q: "Who can see my sales and expenses?", a: "Only you. Your money records, debts, plans and what Spal remembers are private and are never shown in the community. You choose what to share, and posts never include your numbers unless you put them there." },
  { q: "What does Spal remember about me?", a: "Short facts about you and your business that you've told it, like what you sell. See every one under Me, then Privacy, then What Spal knows. You can edit or delete any of it, or pause learning." },
  { q: "Can I use Spal without network?", a: "Yes for recording sales and expenses. They're saved on your phone and sync when you're back online. Chatting with Spal needs a connection." },
  { q: "How do levels work?", a: "Spal places you at the level that fits your business now, and shows you what that level needs. You can move up when you finish the gateway milestone, and you can ask to change your level any time. Spal never moves you down by itself." },
  { q: "How do I post without my name?", a: "When you write a post or reply, switch on Post anonymously. Your name, photo and business don't show. Spal keeps who you are only so it can keep the community safe." },
  { q: "How do I register my business?", a: "Registration steps, fees and timelines change, so please confirm the current process with the Corporate Affairs Commission (CAC) directly before you pay anyone.", verify: true },
  { q: "How do I get a TIN or file taxes?", a: "Please check the current requirements with the Federal Inland Revenue Service (FIRS) or a qualified accountant. Spal can help you get organised, but it isn't a tax adviser.", verify: true },
  { q: "How do I delete my account?", a: "Me, then Privacy, then Delete account. Your profile and posts are hidden straight away and everything is permanently deleted after 30 days. You can cancel any time before then." },
];
