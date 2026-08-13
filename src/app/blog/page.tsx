import Link from "next/link";
import MarketingLayout from "@/components/MarketingLayout";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Blog — SpotRise",
  description: "Practical local SEO and Google Business Profile guidance for owners, no agency jargon.",
};

const CATEGORY_STYLE: Record<string, string> = {
  "Local SEO": "bg-orange-light text-orange",
  "Reviews": "bg-blue-soft/15 text-blue-soft-dark",
  "Google Business Profile": "bg-emerald-100 text-emerald-700",
  "Marketing Strategy": "bg-rose-100 text-rose-600",
};

export default function BlogIndexPage() {
  return (
    <MarketingLayout>
      <section className="pt-16 pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-orange uppercase mb-4">The SpotRise Blog</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-4">Practical, not promotional.</h1>
          <p className="text-lg text-gray-warm leading-relaxed">
            Local SEO and Google Business Profile guidance written for owners who have five minutes, not a marketing degree.
          </p>
        </div>
      </section>

      <section className="pb-24 px-4">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group p-6 rounded-2xl bg-white border border-border-warm hover:border-orange/40 hover:shadow-md transition-all flex flex-col">
              <span className={`self-start px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide mb-4 ${CATEGORY_STYLE[post.category] || "bg-cream text-gray-warm"}`}>
                {post.category}
              </span>
              <h2 className="font-serif text-lg font-semibold mb-2 leading-snug group-hover:text-orange transition-colors">{post.title}</h2>
              <p className="text-sm text-gray-warm leading-relaxed mb-4 flex-1">{post.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-gray-warm pt-4 border-t border-border-warm">
                <span>{post.date} · {post.readTime}</span>
                <ArrowRight className="w-4 h-4 text-orange opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}