import { BlogPostLayout, Lead, P, H2, Callout } from "@/components/BlogPostLayout";
import { getPostBySlug } from "@/lib/blog-posts";

const meta = getPostBySlug("why-more-reviews-is-bad-advice")!;

export const metadata = { title: `${meta.title} — SpotRise Blog`, description: meta.excerpt };

export default function Post() {
  return (
    <BlogPostLayout meta={meta}>
      <Lead>"You just need more reviews" is the most common piece of local marketing advice — and for most businesses, it's solving the wrong problem.</Lead>

      <P>Review count matters, but it's rarely the actual bottleneck. A business with 40 reviews and a 4.6 rating, where every recent complaint gets a thoughtful reply, will consistently outperform a business with 400 reviews and a 3.9 rating where nothing's been answered in a year. Volume without quality just means more people have seen the unresolved problem.</P>

      <H2>The more useful — and less comfortable — question</H2>
      <P>Instead of "how do we get more reviews," the question worth sitting with is: what would someone have to actually experience to leave a bad one? If the honest answer is a specific, recurring thing — a wait time, a communication gap, an inconsistency between locations or staff — then more reviews won't fix that. It'll just create more visibility for the same problem.</P>

      <Callout>More reviews amplifies whatever's already true about the business. It doesn't change what's true.</Callout>

      <H2>What actually moves the needle first</H2>
      <P>Before running a review-generation push, three things are usually worth fixing first:</P>
      <P><strong className="text-charcoal">Reply rate.</strong> An unanswered negative review sits there indefinitely, doing damage to every person who reads it after. Clearing the backlog of old, unanswered reviews often does more for trust than fifty new five-star ones.</P>
      <P><strong className="text-charcoal">The pattern in existing complaints.</strong> If three reviews over six months mention the same specific issue, that's a signal worth acting on before asking happy customers to add their voices to a profile that still has the underlying problem unaddressed.</P>
      <P><strong className="text-charcoal">Recency.</strong> A steady trickle of new reviews — a few a month — reads as more trustworthy than either silence or an obvious cluster of reviews from the same week (which can look, fairly or not, like a paid push).</P>

      <H2>When asking for reviews does help</H2>
      <P>None of this means don't ask for reviews. It means ask after you've made sure the experience being reviewed is actually good, and after you've cleared the visible backlog of complaints that haven't been addressed. Asking happy customers to leave a review is a fine, normal practice — it's just not a substitute for fixing what the unhappy ones are already telling you, in public, for free.</P>
    </BlogPostLayout>
  );
}