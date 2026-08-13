import MarketingLayout from "@/components/MarketingLayout";
import { CheckCircle2, MessageSquare, Target, Sparkles } from "lucide-react";

export const metadata = {
  title: "About — SpotRise",
  description: "Why SpotRise exists, and how we think about helping local businesses win on Google.",
};

export default function AboutPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-orange uppercase mb-6">About SpotRise</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Most Google Business Profiles aren't neglected on purpose.
          </h1>
          <p className="mt-6 text-lg text-gray-warm leading-relaxed">
            They're neglected because nobody handed the owner a clear list of what to actually fix — just a login screen, a stack of unanswered reviews, and a vague sense that something's wrong.
          </p>
        </div>
      </section>

      {/* The gap */}
      <section className="pb-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6 text-gray-warm leading-relaxed">
          <p>
            Local business owners are stuck between two bad options. Hire an agency, and you're paying a monthly retainer for work that's often generic — the same templated report, the same three tips, regardless of what your actual customers are saying. Or do it yourself, and you're staring at a review that says "machines have been broken for weeks" with no idea whether that's the thing costing you customers, or just noise.
          </p>
          <p>
            Neither option gives you what a good consultant would: someone who's actually read your reviews, noticed the pattern, and told you the one thing to fix first — in plain language, this week, not "eventually."
          </p>
        </div>
      </section>

      {/* Signature visual: gauge motif + pull quote */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-[2.5rem] bg-charcoal text-cream p-10 sm:p-16 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 opacity-[0.08]">
              <svg width="360" height="360" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#F2EBE0" strokeWidth="6" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#D4652A" strokeWidth="6" strokeLinecap="round" strokeDasharray="185 264" transform="rotate(-90 50 50)" />
              </svg>
            </div>
            <div className="relative max-w-xl">
              <p className="text-xs font-semibold tracking-[0.2em] text-orange uppercase mb-6">Our approach</p>
              <p className="font-serif text-2xl sm:text-3xl leading-snug">
                A score is only useful if it comes with a reason. So every number SpotRise shows you traces back to something a real customer actually wrote.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-center mb-12">What that means in practice</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "We read the reviews, not just the star rating",
                desc: "A 4.2 average can hide a real problem or mean nothing at all — the difference is always in the text. SpotRise's audit score is weighted by what reviews actually describe, not just how many stars they left.",
              },
              {
                icon: Target,
                title: "Prioritized, not just listed",
                desc: "A wall of 20 suggestions is the same as none. We surface the 3-5 things worth fixing first, ranked by how much they're likely costing you — the way a consultant would triage, not a checklist tool.",
              },
              {
                icon: Sparkles,
                title: "Specific to your business, every time",
                desc: "Generic advice ('post more often!') is easy to generate and useless to act on. Every recommendation SpotRise gives references something real — a review, a rating pattern, a gap versus a named competitor.",
              },
              {
                icon: CheckCircle2,
                title: "You stay in control",
                desc: "SpotRise drafts replies, posts, and descriptions — it never publishes anything on your behalf. You read it, you edit it if you want to, you decide what goes live.",
              },
            ].map((p, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-border-warm">
                <div className="w-10 h-10 rounded-xl bg-orange-light flex items-center justify-center mb-4"><p.icon className="w-5 h-5 text-orange" /></div>
                <h3 className="font-serif text-lg font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-gray-warm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="pb-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-4">Built for the owner, not the agency</h2>
          <p className="text-gray-warm leading-relaxed">
            SpotRise exists so that fixing your Google presence doesn't require hiring anyone, or becoming an expert yourself. Just a clear answer to "what should I actually do about this," every time you check in.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}