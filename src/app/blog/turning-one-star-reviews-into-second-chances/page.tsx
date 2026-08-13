import { BlogPostLayout, Lead, P, H2, Callout, List } from "@/components/BlogPostLayout";
import { getPostBySlug } from "@/lib/blog-posts";
import { X, CheckCircle2 } from "lucide-react";

const meta = getPostBySlug("turning-one-star-reviews-into-second-chances")!;

export const metadata = { title: `${meta.title} — SpotRise Blog`, description: meta.excerpt };

export default function Post() {
  return (
    <BlogPostLayout meta={meta}>
      <Lead>A one-star review doesn't scare people off. A one-star review with no reply does.</Lead>

      <P>Most customers reading reviews before they book or buy aren't looking for a perfect record — a business with only five-star reviews can actually read as suspicious. What they're really checking is how you handle it when something goes wrong. The bad review is data. Your reply is the actual pitch.</P>

      <H2>The reply that makes things worse</H2>
      <div className="my-6 p-5 rounded-2xl bg-red-50 border border-red-200">
        <div className="flex items-center gap-2 mb-2"><X className="w-4 h-4 text-red-500" /><span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Avoid</span></div>
        <p className="text-sm text-charcoal italic leading-relaxed">"We're sorry you feel that way. We've never had this complaint before and stand by our service."</p>
      </div>
      <P>This reply does three things wrong at once: it implies the customer is being unreasonable ("feel that way"), it calls them a liar by omission ("never had this complaint"), and it defends the business instead of the customer. Anyone reading it afterward learns that complaining here gets you dismissed.</P>

      <H2>The reply that works</H2>
      <div className="my-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
        <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Better</span></div>
        <p className="text-sm text-charcoal italic leading-relaxed">"You're right that a 45-minute wait isn't what we aim for, especially on a weeknight. We've added an extra person to our evening shift starting this week. I'd like to make this right — please call and ask for the manager."</p>
      </div>
      <P>This version does the opposite: it agrees with the specific complaint, states a concrete fix (not a vague promise), and offers a real next step. It's not written for the unhappy customer alone — it's written for the hundred people who'll read it before they book.</P>

      <Callout>Nobody expects a business to be perfect. They're checking whether you take responsibility when you're not.</Callout>

      <H2>A short checklist for replies that actually help</H2>
      <List items={[
        "Address the specific thing they mentioned — not a generic apology that could apply to any complaint",
        "Never argue with the review in the reply, even if you think it's unfair — take that conversation offline",
        "State what you're doing about it, not just that you're sorry",
        "Keep it short — three sentences beats a defensive paragraph every time",
        "Reply fast. A reply posted the same week reads very differently than one posted three months later",
      ]} />

      <P>The goal isn't to convince the unhappy customer to change their review — sometimes they won't. The goal is to make sure everyone who reads it afterward trusts you a little more, not less.</P>
    </BlogPostLayout>
  );
}