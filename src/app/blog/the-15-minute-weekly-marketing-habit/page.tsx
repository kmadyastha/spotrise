import { BlogPostLayout, Lead, P, H2, Callout } from "@/components/BlogPostLayout";
import { getPostBySlug } from "@/lib/blog-posts";

const meta = getPostBySlug("the-15-minute-weekly-marketing-habit")!;

export const metadata = { title: `${meta.title} — SpotRise Blog`, description: meta.excerpt };

export default function Post() {
  return (
    <BlogPostLayout meta={meta}>
      <Lead>Most small business marketing fails for a boring reason: it's a burst, not a habit. A big push for two weeks, then nothing for three months. Google — and customers — notice the gaps more than the bursts.</Lead>

      <P>You don't need a content calendar, a social media manager, or a quarterly campaign to keep a local business visible. You need one small thing, done every week, without exception. The businesses that consistently show up as active — recent posts, recent photos, recently replied-to reviews — are competing on a completely different level than the ones that set their profile up once and never touched it again.</P>

      <H2>What the 15 minutes actually looks like</H2>
      <P>Once a week, pick one of these — not all of them, just one:</P>
      <div className="my-6 grid gap-3">
        {[
          { time: "5 min", task: "Reply to any new reviews since last week" },
          { time: "5 min", task: "Post one update — an offer, a new arrival, a photo from the week" },
          { time: "5 min", task: "Add one current photo, replacing something outdated" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-cream border border-border-warm">
            <span className="text-xs font-bold text-orange bg-orange-light px-2.5 py-1 rounded-md shrink-0">{item.time}</span>
            <span className="text-sm text-charcoal">{item.task}</span>
          </div>
        ))}
      </div>

      <Callout>Fifteen minutes a week, done for a year, outperforms a single polished campaign that nobody follows up on.</Callout>

      <H2>Why consistency beats intensity here</H2>
      <P>A big one-time push — a full profile overhaul, a flurry of posts, a review-collection campaign — creates a spike. Then, without a habit behind it, activity drops back to zero, and the spike fades from relevance within weeks. Google's own signals favor recency: a profile that's been quietly active every week for six months reads as more trustworthy than one with a burst of activity from four months ago and silence since.</P>
      <P>Customers notice the same thing, just less consciously. A profile with a post from three days ago feels current. A profile whose last post is from eight months back feels like it might not even be open anymore — regardless of whether that's true.</P>

      <H2>Making it actually stick</H2>
      <P>The habit fails when it depends on remembering, or on finding a spare hour you don't have. It survives when it's small enough to do without thinking — a fixed day, a fixed 15 minutes, one task, not five. Attach it to something you already do weekly (closing out on a Friday, planning the week on a Monday) rather than treating it as a separate task competing for its own slot.</P>
    </BlogPostLayout>
  );
}