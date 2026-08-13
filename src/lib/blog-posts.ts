export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "google-business-profile-vs-website",
    title: "Your Google Business Profile Is Your Website Now",
    excerpt: "Most local customers never click through to your site. They decide from the Maps panel alone — which means that panel is doing the job your homepage used to do.",
    category: "Local SEO",
    date: "August 3, 2026",
    readTime: "6 min read",
  },
  {
    slug: "turning-one-star-reviews-into-second-chances",
    title: "How to Turn a One-Star Review Into a Second Chance",
    excerpt: "The reply matters more than the review. Here's what actually changes a bad review from a liability into proof you handle problems well.",
    category: "Reviews",
    date: "July 27, 2026",
    readTime: "5 min read",
  },
  {
    slug: "google-business-profile-photos-that-work",
    title: "The Google Photos Nobody Tells You to Take",
    excerpt: "Everyone says 'add more photos.' Almost nobody says which ones. Here's the actual list, ranked by what drives clicks.",
    category: "Google Business Profile",
    date: "July 20, 2026",
    readTime: "5 min read",
  },
  {
    slug: "local-seo-basics-most-businesses-skip",
    title: "Local SEO Isn't Complicated. Most Businesses Just Skip the Basics",
    excerpt: "Before you think about backlinks or blog content, there are five things Google actually checks — and most local businesses have gotten at least two of them wrong for years.",
    category: "Local SEO",
    date: "July 13, 2026",
    readTime: "7 min read",
  },
  {
    slug: "what-competitor-reviews-are-telling-you",
    title: "What Your Competitors' Reviews Are Telling You (That You're Not Reading)",
    excerpt: "Their one-star reviews are a map of their weaknesses. Here's how to actually read a competitor's reviews like a consultant would, not a rival.",
    category: "Marketing Strategy",
    date: "July 6, 2026",
    readTime: "6 min read",
  },
  {
    slug: "the-15-minute-weekly-marketing-habit",
    title: "The 15-Minute Weekly Habit That Beats Most Marketing Plans",
    excerpt: "You don't need a content calendar or a marketing budget. You need one small, consistent habit — and most businesses that win locally are already doing it without calling it a strategy.",
    category: "Marketing Strategy",
    date: "June 29, 2026",
    readTime: "5 min read",
  },
  {
    slug: "why-more-reviews-is-bad-advice",
    title: "Why \"Just Get More Reviews\" Is Bad Advice",
    excerpt: "Volume isn't the problem most businesses have. Here's the more useful — and less comfortable — question to ask instead.",
    category: "Reviews",
    date: "June 22, 2026",
    readTime: "6 min read",
  },
  {
    slug: "word-of-mouth-went-digital",
    title: "Word of Mouth Went Digital. Here's Where It Lives Now",
    excerpt: "The recommendation your customer used to give a friend over coffee now happens in a Google search at 9pm. Same trust, different room.",
    category: "Marketing Strategy",
    date: "June 15, 2026",
    readTime: "5 min read",
  },
];

export function getPostBySlug(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}