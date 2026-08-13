import MarketingLayout from "@/components/MarketingLayout";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — SpotRise",
  description: "How SpotRise collects, uses, and protects your information.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="font-serif text-xl font-bold mb-3">{title}</h2>
      <div className="text-sm text-gray-warm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <section className="pt-16 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] text-orange uppercase mb-4">Legal</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-sm text-gray-warm mb-8">Last updated: August 2026</p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-12">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 leading-relaxed">
              This policy describes SpotRise's data practices in plain language and is a solid starting draft — but it has not yet been reviewed by a lawyer. Treat it as a working document, not final legal advice, until it's had proper legal review.
            </p>
          </div>

          <Section title="What this covers">
            <p>This policy explains what information SpotRise collects when you use our Google Business Profile audit and optimization tools, how we use it, who we share it with, and the choices you have.</p>
          </Section>

          <Section title="Information we collect">
            <p><strong className="text-charcoal">Account information.</strong> When you sign in, we collect your email address. SpotRise uses passwordless sign-in — we never see or store a password.</p>
            <p><strong className="text-charcoal">Your Google Business Profile data.</strong> When you link a business, we pull publicly available information from Google — your business name, address, phone number, rating, review count, and photo count — via the Google Places API.</p>
            <p><strong className="text-charcoal">Review content.</strong> We retrieve the text, rating, author name, and date of your business's public Google reviews, so we can analyze sentiment and draft replies. These reviews are already public on Google; we don't collect anything private.</p>
            <p><strong className="text-charcoal">Usage data.</strong> We keep a record of which tools you use and how often — for example, how many AI replies you've generated this month — to enforce plan limits fairly.</p>
          </Section>

          <Section title="How we use your information">
            <ul className="list-disc pl-5 space-y-2">
              <li>To generate your audit score, sentiment breakdown, and prioritized action items</li>
              <li>To draft review replies, posts, descriptions, and other content you can choose to use</li>
              <li>To send you sign-in links and, if you're on a paid plan, periodic account emails</li>
              <li>To enforce free and paid plan limits</li>
              <li>To improve SpotRise's own audit accuracy and features over time</li>
            </ul>
          </Section>

          <Section title="Who we share it with">
            <p>We rely on a small number of service providers to run SpotRise. We don't sell your data to anyone.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-charcoal">Google (Places API)</strong> — to look up and verify your business details</li>
              <li><strong className="text-charcoal">Outscraper</strong> — to retrieve your business's public Google reviews</li>
              <li><strong className="text-charcoal">Anthropic (Claude API)</strong> — to analyze reviews and generate audit content, draft replies, and other AI-written text. Review text and business details are sent to Anthropic for this purpose</li>
              <li><strong className="text-charcoal">Supabase</strong> — our database and authentication provider, where your account and business data is stored</li>
              <li><strong className="text-charcoal">Resend</strong> — to deliver sign-in and account emails</li>
              <li><strong className="text-charcoal">Stripe</strong> — for billing, once paid subscriptions go live. Stripe handles your payment details directly; SpotRise never stores your card number</li>
            </ul>
          </Section>

          <Section title="Data retention">
            <p>We retain your account and business data for as long as your account is active. Pro accounts can permanently delete their account at any time from the account menu — this immediately and permanently removes your linked business, reviews, AI-generated content, competitor tracking, and usage history from our systems. Free accounts can request deletion by emailing us; we'll process it manually rather than instantly, to prevent automated abuse of free-tier limits. Some records may be kept longer where we're required to by law or for legitimate business record-keeping (for example, billing records for a Pro subscription).</p>
          </Section>

          <Section title="Your rights">
            <p>You can request a copy of the data we hold about you, ask us to correct it, or ask us to delete your account and associated data, by contacting us at the email below. Depending on where you live, you may have additional rights under local law.</p>
          </Section>

          <Section title="Cookies">
            <p>SpotRise uses only the minimal cookies needed to keep you signed in and remember your session. We don't use advertising or third-party tracking cookies.</p>
          </Section>

          <Section title="Children's privacy">
            <p>SpotRise is intended for business owners and is not directed at children. We don't knowingly collect information from anyone under 18.</p>
          </Section>

          <Section title="Changes to this policy">
            <p>If we make material changes to this policy, we'll update the date at the top of this page and, where appropriate, let you know directly.</p>
          </Section>

          <Section title="Contact">
            <p>Questions about this policy or your data? Reach us at <span className="text-charcoal font-medium">privacy@spotrise.app</span>.</p>
          </Section>
        </div>
      </section>
    </MarketingLayout>
  );
}