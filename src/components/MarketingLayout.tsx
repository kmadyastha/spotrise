import Link from "next/link";
import { Zap } from "lucide-react";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <nav className="border-b border-border-warm px-4 sticky top-0 z-50 bg-cream/95 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight">SpotRise</span>
          </Link>
          <Link href="/" className="text-sm text-gray-warm hover:text-charcoal transition-colors">← Back to SpotRise</Link>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="border-t border-border-warm px-4">
        <div className="max-w-6xl mx-auto py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-full bg-orange flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" /></div>
                <span className="text-lg font-serif font-bold text-charcoal">SpotRise</span>
              </div>
              <p className="text-sm text-gray-warm">Built for owners who want to take control of their Google presence.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] text-orange uppercase mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-warm">
                <li><Link href="/#video-demo" className="hover:text-charcoal">Demo</Link></li>
                <li><Link href="/#features" className="hover:text-charcoal">Features</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-charcoal">How It Works</Link></li>
                <li><Link href="/#pricing" className="hover:text-charcoal">Pricing</Link></li>
                <li><Link href="/#faq" className="hover:text-charcoal">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] text-orange uppercase mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-warm">
                <li><Link href="/about" className="hover:text-charcoal">About</Link></li>
                <li><Link href="/blog" className="hover:text-charcoal">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] text-orange uppercase mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-warm">
                <li><Link href="/privacy" className="hover:text-charcoal">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-charcoal">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border-warm pt-6 text-sm text-gray-warm">© 2026 SpotRise, Inc.</div>
        </div>
      </footer>
    </div>
  );
}