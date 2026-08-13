import { BlogPostLayout, Lead, P, H2, Callout, List } from "@/components/BlogPostLayout";
import { getPostBySlug } from "@/lib/blog-posts";

const meta = getPostBySlug("what-competitor-reviews-are-telling-you")!;

export const metadata = { title: `${meta.title} — SpotRise Blog`, description: meta.excerpt };

export default function Post() {
  return (
    <BlogPostLayout meta={meta}>
      <Lead>Most business owners check a competitor's rating and stop there. The number is the least useful part. The reviews underneath it are a map of exactly where that business is winning and losing customers.</Lead>

      <P>A competitor sitting at 4.5 stars with 200 reviews isn't just "better than you." Read the actual text and you'll usually find a specific, narrow thing they're good at — and often, right next to it, a specific thing they're consistently bad at. Both are useful. Neither shows up in the star rating alone.</P>

      <H2>What to actually look for</H2>
      <P>Skip the five-star reviews that just say "great service!" — they don't tell you anything actionable. The useful ones are more specific, in both directions.</P>

      <List items={[
        "Reviews that name a specific staff member — that's a sign of genuinely differentiated service, not just \"friendly staff\" as a category",
        "Recurring complaints across multiple reviews — one person mentioning slow service is an anecdote; five people over three months is a pattern",
        "What people compare them to — sometimes a reviewer will directly say \"better than [competitor]\" and name names",
        "The gap between what they advertise and what reviewers actually mention — if their profile leads with ambiance but every review talks about the food, that tells you what customers actually value",
      ]} />

      <Callout>A competitor's one-star reviews are the closest thing to a free consulting report on where you could beat them.</Callout>

      <H2>Turning it into something useful</H2>
      <P>If a nearby competitor's negative reviews keep mentioning long waits during peak hours, and your own reviews don't have that complaint — that's not just reassuring, it's marketing material. A Google Post or a review reply that quietly reinforces "no wait, even on weekends" speaks directly to something customers in your area are already worried about.</P>
      <P>If their positive reviews keep praising something specific — a particular service, a particular person, a particular detail — that's not necessarily something to copy. It's a signal about what your shared customer base actually cares about, which you can address in your own way.</P>

      <H2>What not to do with this</H2>
      <P>This isn't about matching a competitor feature-for-feature or getting defensive about a rating gap. The businesses that actually improve are the ones that read competitor reviews the way a consultant would — looking for patterns and gaps, not scorekeeping. The goal is a sharper sense of what your local customers actually value, not a rivalry.</P>
    </BlogPostLayout>
  );
}