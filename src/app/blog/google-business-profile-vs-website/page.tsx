import { BlogPostLayout, Lead, P, H2, Callout, List } from "@/components/BlogPostLayout";
import { getPostBySlug } from "@/lib/blog-posts";

const meta = getPostBySlug("google-business-profile-vs-website")!;

export const metadata = { title: `${meta.title} — SpotRise Blog`, description: meta.excerpt };

export default function Post() {
  return (
    <BlogPostLayout meta={meta}>
      <Lead>Someone searches "gym near me" at 7am before work. They see three results with photos, ratings, and hours. They pick one. They never see your website — because they never needed to.</Lead>

      <P>That's not a hypothetical. It's the default path for most local searches now: search, glance at the map panel, decide, go. Your website is still important — for the customer who wants to dig deeper, check your full menu, or read your story. But the decision itself, the moment where someone chooses you over the business two doors down, increasingly happens entirely inside the Google Maps panel.</P>

      <H2>What's actually in that panel</H2>
      <P>When someone taps your listing, here's everything they see without leaving Google: your name, your rating and review count, your hours (and whether you're open right now), a handful of photos, your most recent reviews, and — if you've filled it in — your services, your Q&A section, and your latest posts.</P>
      <P>Compare that to what a website typically leads with: a hero banner, a mission statement, maybe a slideshow. None of it answers the question the customer actually has, which is usually some version of "is this place good, and is it open."</P>

      <Callout>The Maps panel isn't a directory listing anymore. It's the first — and often only — page a local customer reads before deciding.</Callout>

      <H2>Where this actually costs you</H2>
      <P>The businesses that lose customers here rarely lose them dramatically. It's quieter than that. A search happens, your listing shows an outdated photo or an unanswered one-star review from eight months ago, and the customer's attention just... moves to the next result. No complaint, no way to know it happened. It just didn't convert.</P>

      <H2>What to actually check</H2>
      <List items={[
        "Is your rating and review count visible and current — and are your most recent reviews replied to?",
        "Do your photos look like they were taken this year, not five years ago?",
        "Are your hours accurate, including holidays? Nothing kills trust faster than \"closed\" on a business that's actually open.",
        "Does your profile description say something specific about you, or could it describe any business in your category?",
      ]} />

      <P>None of this replaces a good website. But if you only have time to make one of the two genuinely excellent, make it the one your customers are actually looking at first.</P>
    </BlogPostLayout>
  );
}