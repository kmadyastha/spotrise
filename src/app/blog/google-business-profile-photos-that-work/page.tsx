import { BlogPostLayout, Lead, P, H2, Callout } from "@/components/BlogPostLayout";
import { getPostBySlug } from "@/lib/blog-posts";

const meta = getPostBySlug("google-business-profile-photos-that-work")!;

export const metadata = { title: `${meta.title} — SpotRise Blog`, description: meta.excerpt };

const PHOTOS = [
  { rank: 1, title: "The entrance, from the street", why: "This is what someone sees when they're standing outside looking for you. Without it, first-time visitors second-guess whether they've found the right place." },
  { rank: 2, title: "A wide shot of the space, during business hours", why: "Shows scale and atmosphere — whether it's cozy or spacious, quiet or busy. People are picturing themselves there before they walk in." },
  { rank: 3, title: "The team, actually working", why: "Posed staff photos read as stock images. A candid shot of someone mid-task builds more trust than a lineup ever will." },
  { rank: 4, title: "Your best-reviewed product or service, close up", why: "If reviews keep mentioning one dish, one service, one product — that's the photo to lead with. Let the thing people already love do the selling." },
  { rank: 5, title: "Parking or access, if it's ever a question", why: "If your reviews ever mention parking, easy to miss, or hard to find — a simple photo showing exactly where to go removes real friction." },
];

export default function Post() {
  return (
    <BlogPostLayout meta={meta}>
      <Lead>"Add more photos" is true but useless advice. Twelve blurry photos of the same angle don't help anyone. Here's what actually earns a click.</Lead>

      <P>Google rewards profiles with more recent, higher-quality photos — but the real reason to care isn't the algorithm, it's the customer standing outside deciding whether to walk in, or scrolling on their phone deciding whether you're worth the drive. Photos answer questions words can't: what does this actually look like, and do I want to be there.</P>

      <H2>The five that matter most</H2>
      <div className="space-y-4 my-8">
        {PHOTOS.map((p) => (
          <div key={p.rank} className="flex gap-4 p-4 rounded-2xl bg-cream border border-border-warm">
            <div className="w-8 h-8 rounded-lg bg-orange text-white flex items-center justify-center font-bold text-sm shrink-0">{p.rank}</div>
            <div>
              <p className="font-medium text-charcoal mb-1">{p.title}</p>
              <p className="text-sm text-gray-warm leading-relaxed">{p.why}</p>
            </div>
          </div>
        ))}
      </div>

      <Callout>The best photo strategy isn't "more." It's the five specific shots that answer the five questions a first-time visitor actually has.</Callout>

      <H2>What to skip</H2>
      <P>Stock photos, generic logo graphics, and anything more than a year old do more harm than good — Google and customers can both tell. A slightly imperfect real photo, taken on a phone this month, beats a polished stock image every time. Authenticity is the whole point.</P>

      <H2>How often to update</H2>
      <P>You don't need a monthly photoshoot. But if your most recent photo is from a season that's already passed — old menu, old decor, an event that happened last year — that's worth refreshing. A quick monthly habit of adding one current photo does more for a profile than a single big batch once a year.</P>
    </BlogPostLayout>
  );
}