import MarketingLayout from "@/components/MarketingLayout";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Terms of Service — SpotRise",
  description: "The terms that govern your use of SpotRise.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="font-serif text-xl font-bold mb-3">{title}</h2>
      <div className="text-sm text-gray-warm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <MarketingLayout>
      <section className="pt-16 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] text-orange uppercase mb-4">Legal</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-3">Terms of Service</h1>
          <p className="text-sm text-gray-warm mb-8">Last updated: August 2026</p>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-12">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 leading-relaxed">
              These terms are a solid starting draft but haven't yet been reviewed by a lawyer. Treat them as a working document, not final legal advice, until they've had proper legal review.
            </p>
          </div>

          <Section title="1. Agreement to terms">
            <p>By creating an account or using SpotRise, you agree to these terms. If you don't agree, please don't use the service.</p>
          </Section>

          <Section title="2. What SpotRise does">
            <p>SpotRise audits your Google Business Profile, analyzes your public reviews, and generates suggested content — review replies, posts, descriptions, and related tools — using AI. SpotRise draws on data from Google and from your own reviews to produce this content, but it does not manage, edit, or post to your Google Business Profile on your behalf; you choose what to copy and publish.</p>
          </Section>

          <Section title="3. Your account">
            <p>You're responsible for keeping access to your account secure and for anything that happens under it. You must provide a valid email address and, if you link a business, you confirm that you're authorized to manage that business's Google Business Profile.</p>
          </Section>

          <Section title="4. Plans and billing">
            <p><strong className="text-charcoal">Free plan.</strong> Includes a limited number of audits and restricted access to reviews, posts, and tools, as described on our pricing page.</p>
            <p><strong className="text-charcoal">Pro plan.</strong> A paid monthly subscription unlocking full access, billed on a recurring basis until canceled. Pricing is shown at the time of upgrade. You can cancel anytime; access continues through the end of your current billing period.</p>
            <p>Feature limits (such as monthly generation caps on individual tools) are described in-product and may be adjusted from time to time; we'll make a reasonable effort to communicate material changes.</p>
          </Section>

          <Section title="5. AI-generated content">
            <p>SpotRise uses AI to draft review replies, posts, descriptions, and other content based on real information about your business and reviews. This content is a starting point, not a guarantee of accuracy — you're responsible for reviewing anything before you publish it. SpotRise isn't liable for content you choose to publish without reviewing it.</p>
          </Section>

          <Section title="6. Accuracy of third-party data">
            <p>Audit scores, ratings, and business details shown in SpotRise are pulled from Google and other third-party sources at the time of your audit or refresh. This data can change or be inaccurate at the source, and SpotRise doesn't guarantee its completeness or real-time accuracy.</p>
          </Section>

          <Section title="7. Acceptable use">
            <p>Please don't use SpotRise to link a business you're not authorized to represent, attempt to circumvent plan limits, or use the service in a way that violates Google's own terms for Business Profiles.</p>
          </Section>

          <Section title="8. Intellectual property">
            <p>SpotRise and its underlying technology belong to us. Content SpotRise generates specifically for your business — your drafted replies, posts, and descriptions — is yours to use however you like.</p>
          </Section>

          <Section title="9. Limitation of liability">
            <p>SpotRise is provided "as is." To the extent permitted by law, we aren't liable for indirect, incidental, or consequential damages arising from your use of the service, including decisions made based on audit scores or AI-generated content.</p>
          </Section>

          <Section title="10. Termination">
            <p>You can stop using SpotRise and delete your account at any time. We may suspend or terminate accounts that violate these terms.</p>
          </Section>

          <Section title="11. Changes to these terms">
            <p>We may update these terms from time to time. If we make material changes, we'll update the date above and, where appropriate, let you know directly.</p>
          </Section>

          <Section title="12. Contact">
            <p>Questions about these terms? Reach us at <span className="text-charcoal font-medium">support@spotrise.app</span>.</p>
          </Section>
        </div>
      </section>
    </MarketingLayout>
  );
}