import { BlogPostLayout, Lead, P, H2, Callout } from "@/components/BlogPostLayout";
import { getPostBySlug } from "@/lib/blog-posts";

const meta = getPostBySlug("word-of-mouth-went-digital")!;

export const metadata = { title: `${meta.title} — SpotRise Blog`, description: meta.excerpt };

export default function Post() {
  return (
    <BlogPostLayout meta={meta}>
      <Lead>The recommendation your customer used to give a friend over coffee — "you have to try this place, I go every week" — still happens constantly. It just doesn't happen over coffee anymore. It happens in a Google search, at 9pm, from someone who's never met either of you.</Lead>

      <P>Word of mouth didn't disappear when local search took over. It moved. The trust that used to travel between two people who knew each other now travels through a review, a reply, a photo — read by a stranger who has to decide, in about thirty seconds, whether to believe it.</P>

      <H2>Same mechanism, different room</H2>
      <P>What made word of mouth powerful was never really the recommendation itself — it was that it came from someone with nothing to gain by lying. A five-star review works the same way, when it reads as genuine: specific, a little imperfect, clearly written by someone who actually went. A generic "great service, five stars" does almost nothing, for the same reason a friend's flat "yeah, it's fine" wouldn't convince you either.</P>
      <P>And the reverse is true too. A friend telling you "the one thing is the wait can be long on weekends" isn't a reason to avoid a place — it's useful, specific, trustworthy information. That's exactly what a well-handled negative review does for a stranger reading it later: not a red flag, just honest context, especially when the business replied to it well.</P>

      <Callout>A Google Business Profile is a room full of thousands of small conversations happening without you in them. The question is whether you're part of the conversation, or just the subject of it.</Callout>

      <H2>What this means practically</H2>
      <P>It means the instinct to treat your profile like an ad — polished, controlled, only showing the best angle — works against you. Word of mouth was never polished. It was specific and a little messy, and that's exactly what made it believable. The businesses that do well here aren't the ones with a flawless five-star record; they're the ones that show up, specifically and honestly, in enough of these small digital conversations that a stranger reading them comes away trusting the place the way they'd trust a friend's recommendation.</P>
      <P>That's really all a Google Business Profile is, underneath the interface: the room where word of mouth happens now. Worth treating it that way.</P>
    </BlogPostLayout>
  );
}