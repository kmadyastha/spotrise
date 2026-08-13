import Link from "next/link";
import MarketingLayout from "./MarketingLayout";

const CATEGORY_STYLE: Record<string, string> = {
  "Local SEO": "bg-orange-light text-orange",
  "Reviews": "bg-blue-soft/15 text-blue-soft-dark",
  "Google Business Profile": "bg-emerald-100 text-emerald-700",
  "Marketing Strategy": "bg-rose-100 text-rose-600",
};

export function BlogPostLayout({
  meta,
  children,
}: {
  meta: { title: string; category: string; date: string; readTime: string };
  children: React.ReactNode;
}) {
  return (
    <MarketingLayout>
      <article className="pt-16 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/blog" className="text-sm text-gray-warm hover:text-charcoal transition-colors">← All posts</Link>
          <span className={`inline-block mt-6 mb-4 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide ${CATEGORY_STYLE[meta.category] || "bg-cream text-gray-warm"}`}>
            {meta.category}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">{meta.title}</h1>
          <p className="text-sm text-gray-warm mb-10">{meta.date} · {meta.readTime}</p>
          <div className="space-y-5">{children}</div>
        </div>
      </article>
    </MarketingLayout>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-lg text-charcoal leading-relaxed">{children}</p>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-base text-gray-warm leading-relaxed">{children}</p>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal !mt-10 mb-2">{children}</h2>;
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 p-5 sm:p-6 rounded-2xl bg-orange-light border border-orange/20">
      <p className="text-charcoal font-serif text-lg sm:text-xl leading-snug italic">{children}</p>
    </div>
  );
}

export function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-base text-gray-warm leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0 mt-2.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}