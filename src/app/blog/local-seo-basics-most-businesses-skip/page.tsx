import { BlogPostLayout, Lead, P, H2, Callout, List } from "@/components/BlogPostLayout";
import { getPostBySlug } from "@/lib/blog-posts";
import { MapPin, Tag, Clock, MessageSquare, FileText } from "lucide-react";

const meta = getPostBySlug("local-seo-basics-most-businesses-skip")!;

export const metadata = { title: `${meta.title} — SpotRise Blog`, description: meta.excerpt };

const BASICS = [
  { icon: MapPin, title: "NAP consistency", desc: "Your Name, Address, and Phone number should be identical — same abbreviations, same formatting — everywhere they appear online: your website, Facebook, Yelp, Google. Google cross-checks these to decide how much to trust your listing." },
  { icon: Tag, title: "The right category, not the closest one", desc: "\"Gym\" and \"Fitness Center\" sound interchangeable but rank for different searches. Pick the category your actual customers search, not the one that sounds most impressive." },
  { icon: Clock, title: "Hours that are actually right, including holidays", desc: "Wrong hours don't just annoy the one customer who shows up to a locked door — a pattern of \"closed when marked open\" quietly damages how much Google trusts the rest of your listing." },
  { icon: MessageSquare, title: "Review recency and response rate", desc: "A profile with reviews from three years ago and none since reads as inactive, to both customers and Google. Recent reviews, and recent replies to them, signal a business that's actually running." },
  { icon: FileText, title: "A complete profile, not a partial one", desc: "Services, an actual description, attributes, Q&A — every empty field is a small signal that this listing isn't being maintained. Complete profiles get more weight than sparse ones with a good rating alone." },
];

export default function Post() {
  return (
    <BlogPostLayout meta={meta}>
      <Lead>Before you think about backlinks, blog content, or anything that sounds like "real SEO" — check these five things. Most local businesses have gotten at least two of them wrong for years without knowing it.</Lead>

      <P>Local SEO gets treated like a mysterious discipline, something you need to hire an agency to understand. Mostly, it isn't. The businesses that show up first in local search aren't running clever campaigns — they've just correctly filled in the basics that everyone else left half-done.</P>

      <div className="space-y-5 my-8">
        {BASICS.map((b, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-border-warm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-orange-light flex items-center justify-center shrink-0"><b.icon className="w-4.5 h-4.5 text-orange" /></div>
              <p className="font-serif font-semibold text-charcoal">{b.title}</p>
            </div>
            <p className="text-sm text-gray-warm leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      <Callout>Local SEO isn't a campaign you run once. It's a handful of details that either stay accurate, or slowly drift out of date while nobody notices.</Callout>

      <H2>Why these five, specifically</H2>
      <P>Each one maps to a real signal Google uses to decide how much to trust — and how prominently to show — a local listing. None of them require technical skill. They require someone actually checking, on a regular basis, instead of setting the profile up once and never returning.</P>

      <H2>Where to start</H2>
      <List items={[
        "Search your business name and check that the address format matches exactly across every platform you're listed on",
        "Look at your category — would a first-time customer search that exact term, or does it just sound professional?",
        "Walk through your hours for the next two holidays on the calendar",
        "Check the date of your most recent review reply",
        "Open your profile and count how many fields are actually filled in",
      ]} />

      <P>None of this takes an agency. It takes twenty minutes and the willingness to actually look.</P>
    </BlogPostLayout>
  );
}