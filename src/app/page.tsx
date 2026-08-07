'use client';

import { useState } from 'react';
import { 
  Search, MapPin, Star, TrendingUp, MessageSquare, Calendar, 
  Copy, Check, Loader2, ChevronDown, ChevronUp, ArrowRight,
  Shield, Zap, BarChart3, Globe, CheckCircle2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ─── */
interface BusinessMatch {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
}

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  aiReplies: { professional: string; warm: string; apologetic: string };
}

interface WeeklyPost {
  id: string;
  type: string;
  title: string;
  content: string;
}

/* ─── FAQ Data ─── */
const faqs = [
  {
    q: "What is SpotRise and how can it help my business?",
    a: "SpotRise is an AI-powered Google Business Profile optimizer built for local businesses. We audit your profile, draft smart replies to reviews, generate weekly posts, and track your competitors — so you rank higher on Google Maps without hiring an agency."
  },
  {
    q: "Do I need any tech skills?",
    a: "Not at all. SpotRise is built for business owners, not marketers. Just enter your business name, and our AI handles the rest. Everything is copy-paste ready for your Google Business Profile."
  },
  {
    q: "Will this actually improve my Google ranking?",
    a: "Yes. Google rewards active, complete profiles with regular posts and prompt review replies. SpotRise automates exactly those signals that push you higher in local search results."
  },
  {
    q: "What if I already have a website?",
    a: "SpotRise complements your website by optimizing your Google Business Profile — the #1 factor for local search visibility. We don't replace your site; we make sure customers find you on Google Maps first."
  },
  {
    q: "How does the review reply AI work?",
    a: "Our AI reads each review and drafts three tone options: Professional, Warm, and Apologetic. You pick the one that fits your brand voice, copy it, and paste it into your Google Business Profile. Auto-posting coming soon for Pro users."
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. No contracts, no setup fees. Upgrade or downgrade whenever you want. Your audit history stays saved even on the free plan."
  }
];

/* ─── Main Component ─── */
export default function Home() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [appStep, setAppStep] = useState<'search' | 'loading' | 'matches' | 'dashboard'>('search');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [matches, setMatches] = useState<BusinessMatch[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessMatch | null>(null);
  const [auditScore, setAuditScore] = useState(65);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<WeeklyPost[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  /* ─── App Flow Handlers ─── */
  const handleSearch = async () => {
    if (!businessName || !city) return;
    setAppStep('loading');
    setTimeout(() => {
      setMatches([
        { id: '1', name: businessName, address: `${businessName}, Main Street, ${city}`, rating: 4.2, reviewCount: 234 },
        { id: '2', name: `${businessName} (Downtown)`, address: `${businessName}, Downtown, ${city}`, rating: 3.8, reviewCount: 89 },
      ]);
      setAppStep('matches');
    }, 1500);
  };

  const handleSelectBusiness = async (business: BusinessMatch) => {
    setSelectedBusiness(business);
    setAppStep('loading');
    setTimeout(() => {
      setAuditScore(Math.floor(Math.random() * 30) + 55);
      setReviews([
        {
          id: '1', author: 'Sarah M.', rating: 2, text: 'Waited 45 minutes for a table. Food was cold when it finally arrived. Very disappointing experience.', date: '2 days ago',
          aiReplies: {
            professional: 'Thank you for your feedback, Sarah. We sincerely apologize for the wait and food quality issues. We would like to make this right. Please contact us directly so we can address your concerns.',
            warm: 'Hi Sarah, we are so sorry to hear about your experience. That is not the standard we hold ourselves to. We would love to invite you back for a meal on us. Please reach out!',
            apologetic: 'Sarah, we are truly sorry. You deserved better, and we failed you. We have addressed this with our team and would appreciate the chance to earn back your trust.'
          }
        },
        {
          id: '2', author: 'Mike R.', rating: 5, text: 'Amazing food and great service! Will definitely be coming back.', date: '1 week ago',
          aiReplies: {
            professional: 'Thank you so much for your kind words, Mike! We are thrilled you enjoyed your experience and look forward to welcoming you back soon.',
            warm: 'Mike, you just made our day! Thank you for the love. We cannot wait to see you again!',
            apologetic: 'Thank you for the wonderful review, Mike! We are so happy you had a great time.'
          }
        }
      ]);
      setPosts([
        { id: '1', type: 'Offer', title: 'Weekend Special', content: '🍕 This weekend only! Buy one large pizza, get one free. Valid Saturday & Sunday. Mention this post at checkout. #WeekendSpecial #PizzaLovers' },
        { id: '2', type: 'Update', title: 'New Hours', content: 'We are now open until 11 PM on Fridays and Saturdays! Come by for late-night bites. 🌙' },
        { id: '3', type: 'Event', title: 'Live Music Friday', content: '🎵 Join us this Friday for live jazz from 7-10 PM. Reserve your table now! #LiveMusic #FridayNight' },
      ]);
      setAppStep('dashboard');
    }, 2000);
  };

  const copyReply = (id: string, reply: string) => {
    navigator.clipboard.writeText(reply);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getScoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-orange-500' : 'text-red-500';
  const getScoreLabel = (s: number) => s >= 80 ? 'Excellent' : s >= 60 ? 'Average' : 'Needs Work';

  /* ─── Render ─── */
  return (
    <main className="min-h-screen bg-cream">
      
      {/* ═══════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-border-warm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-charcoal tracking-tight">SpotRise</span>
          </div>
          
          {view === 'landing' ? (
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-warm">
              <a href="#features" className="hover:text-charcoal transition-colors">Features</a>
              <a href="#pricing" className="hover:text-charcoal transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-charcoal transition-colors">FAQ</a>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-warm">
              <span className="text-charcoal">Audit Dashboard</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button className="text-sm font-medium text-gray-warm hover:text-charcoal transition-colors">
              Sign in
            </button>
            <button 
              onClick={() => { setView('app'); setAppStep('search'); }}
              className="text-sm font-medium bg-orange text-white px-5 py-2.5 rounded-full hover:bg-orange-hover transition-colors"
            >
              Get started →
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════
          LANDING PAGE
      ═══════════════════════════════════════ */}
      {view === 'landing' && (
        <div className="animate-in fade-in duration-500">
          
          {/* ─── Hero ─── */}
          <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-orange uppercase mb-6">
              Built for Owners
            </p>
            <h1 className="font-serif text-5xl md:text-7xl text-charcoal leading-[1.1] mb-6">
              Take control of your business's{' '}
              <span className="italic text-orange">Google presence.</span>
            </h1>
            <p className="text-lg text-gray-warm max-w-2xl mx-auto mb-10 leading-relaxed">
              AI-powered audits, smart review replies, and weekly posts — all in one dashboard. 
              Watch your Google Business Profile start generating more local leads.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button 
                onClick={() => { setView('app'); setAppStep('search'); }}
                className="bg-orange text-white px-8 py-3.5 rounded-full font-medium hover:bg-orange-hover transition-all"
              >
                Get started
              </button>
              <button className="border-2 border-charcoal text-charcoal px-8 py-3.5 rounded-full font-medium hover:bg-charcoal hover:text-white transition-all">
                Schedule a Demo
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-warm">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-orange" /> Cancel anytime</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-orange" /> No code required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-orange" /> Live in under 2 minutes</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-orange" /> Runs on autopilot</span>
            </div>
          </section>

          {/* ─── Industries ─── */}
          <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
            <p className="text-sm text-gray-warm mb-5">
              Built specifically for business owners in the following industries.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Restaurants','Home Services','Automotive','Medical & Healthcare','Legal','Real Estate','Beauty & Personal Care','Fitness & Wellness'].map((ind) => (
                <span key={ind} className="px-5 py-2.5 bg-white border border-border-warm rounded-full text-sm text-charcoal hover:border-orange hover:text-orange transition-colors cursor-default">
                  {ind}
                </span>
              ))}
            </div>
          </section>

          {/* ─── Features ─── */}
          <section id="features" className="max-w-5xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold tracking-[0.2em] text-orange uppercase text-center mb-4">
              Features
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal text-center mb-16">
              Everything you need.
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: <BarChart3 className="w-6 h-6 text-orange" />, title: 'AI-Powered GBP Audit', desc: 'Our AI analyzes your Google Business Profile and gives you a clear 0-100 score with actionable fixes. Know exactly what is hurting your visibility.' },
                { icon: <MessageSquare className="w-6 h-6 text-orange" />, title: 'Smart Review Replies', desc: 'Never stare at a blank screen again. AI drafts Professional, Warm, and Apologetic replies to every review. Just copy, paste, and post.' },
                { icon: <Calendar className="w-6 h-6 text-orange" />, title: 'Weekly Post Generator', desc: 'Get three ready-to-publish Google Business Posts every week — offers, updates, and events tailored to your industry and local audience.' },
                { icon: <Globe className="w-6 h-6 text-orange" />, title: 'Competitor Tracking', desc: 'See how you stack up against nearby competitors. Track their photo count, post frequency, and review ratings side by side.' },
              ].map((f, i) => (
                <div key={i} className="bg-white border border-border-warm rounded-3xl p-8 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-orange-light rounded-2xl flex items-center justify-center mb-5">
                    {f.icon}
                  </div>
                  <h3 className="font-serif text-2xl text-charcoal mb-3">{f.title}</h3>
                  <p className="text-gray-warm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ─── Pricing ─── */}
          <section id="pricing" className="max-w-4xl mx-auto px-6 py-20 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-orange uppercase mb-4">
              Pricing
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-4">
              Dominate local search{' '}
              <span className="italic text-orange">without breaking the bank.</span>
            </h2>
            <p className="text-gray-warm mb-12 max-w-xl mx-auto">
              One simple plan. No credit pools, no hidden fees. Everything you need to grow your Google presence.
            </p>

            <div className="bg-white border-2 border-charcoal rounded-3xl p-10 max-w-md mx-auto relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-charcoal text-white text-xs font-semibold px-4 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="font-serif text-3xl text-charcoal mb-2">Growth</h3>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="font-serif text-6xl text-charcoal">$9</span>
                <span className="text-gray-warm text-lg">/mo</span>
              </div>
              <p className="text-sm text-gray-warm mb-8">For businesses ready to own their Google presence.</p>
              
              <ul className="text-left space-y-4 mb-8">
                {[
                  'Unlimited AI review reply drafts',
                  'Weekly post generator (3 posts/week)',
                  'Full GBP audit with score tracking',
                  'Competitor snapshot (3 competitors)',
                  'Weekly email reports',
                  'Export audit as PDF'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-charcoal">
                    <CheckCircle2 className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => { setView('app'); setAppStep('search'); }}
                className="w-full bg-orange text-white py-3.5 rounded-full font-medium hover:bg-orange-hover transition-colors"
              >
                Get started
              </button>
              <p className="text-xs text-gray-warm mt-4">
                By subscribing you agree to our Terms of Service.
              </p>
            </div>
          </section>

          {/* ─── FAQ ─── */}
          <section id="faq" className="max-w-3xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold tracking-[0.2em] text-orange uppercase text-center mb-4">
              FAQ
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal text-center mb-12">
              Your questions, answered.
            </h2>
            
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div 
                  key={i} 
                  className={`border rounded-2xl overflow-hidden transition-all ${openFaq === i ? 'border-charcoal bg-white shadow-md' : 'border-border-warm bg-white/50'}`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="font-medium text-charcoal pr-4">{faq.q}</span>
                    {openFaq === i ? (
                      <ChevronUp className="w-5 h-5 text-orange flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-warm flex-shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-gray-warm leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>

          {/* ─── CTA ─── */}
          <section className="max-w-5xl mx-auto px-6 pb-20">
            <div className="bg-blue-soft rounded-[2.5rem] p-12 md:p-16 text-center relative overflow-hidden">
              <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-4 relative z-10">
                Are you ready to dominate{' '}
                <span className="italic text-orange">local search</span> and generate more leads for your business?
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                <button 
                  onClick={() => { setView('app'); setAppStep('search'); }}
                  className="bg-orange text-white px-8 py-3.5 rounded-full font-medium hover:bg-orange-hover transition-colors"
                >
                  Get started
                </button>
                <button className="bg-white text-charcoal px-8 py-3.5 rounded-full font-medium hover:bg-cream transition-colors">
                  Schedule a demo
                </button>
              </div>
            </div>
          </section>

          {/* ─── Footer ─── */}
          <footer className="border-t border-border-warm bg-cream">
            <div className="max-w-6xl mx-auto px-6 py-12">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div className="md:col-span-1">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 bg-orange rounded-full flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-charcoal">SpotRise</span>
                  </div>
                  <p className="text-sm text-gray-warm">
                    Built for owners who want to take control of their Google presence.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold tracking-[0.15em] text-orange uppercase mb-4">Product</h4>
                  <ul className="space-y-2 text-sm text-gray-warm">
                    <li><a href="#features" className="hover:text-charcoal">Features</a></li>
                    <li><a href="#pricing" className="hover:text-charcoal">Pricing</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold tracking-[0.15em] text-orange uppercase mb-4">Company</h4>
                  <ul className="space-y-2 text-sm text-gray-warm">
                    <li><span className="hover:text-charcoal cursor-pointer">Blog</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold tracking-[0.15em] text-orange uppercase mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm text-gray-warm">
                    <li><span className="hover:text-charcoal cursor-pointer">Privacy</span></li>
                    <li><span className="hover:text-charcoal cursor-pointer">Terms</span></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-border-warm pt-6 text-sm text-gray-warm">
                © 2026 SpotRise, Inc.
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* ═══════════════════════════════════════
          APP / DASHBOARD VIEW
      ═══════════════════════════════════════ */}
      {view === 'app' && (
        <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-300">
          
          {/* App Header */}
          <div className="flex items-center justify-between mb-10">
            <button 
              onClick={() => setView('landing')}
              className="text-sm text-gray-warm hover:text-charcoal flex items-center gap-1 transition-colors"
            >
              ← Back to home
            </button>
            <button 
              onClick={() => { setAppStep('search'); setSelectedBusiness(null); }}
              className="text-sm text-gray-warm hover:text-charcoal transition-colors"
            >
              Audit another business →
            </button>
          </div>

          <AnimatePresence mode="wait">
            
            {/* ─── Search Step ─── */}
            {appStep === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-xl mx-auto text-center pt-12"
              >
                <h2 className="font-serif text-4xl text-charcoal mb-4">Run your free audit</h2>
                <p className="text-gray-warm mb-10">Enter your business details and we'll analyze your Google presence in seconds.</p>
                
                <div className="bg-white border border-border-warm rounded-3xl p-8 shadow-sm">
                  <div className="space-y-5 text-left">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Business Name</label>
                      <div className="relative">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-warm" />
                        <input
                          type="text"
                          placeholder="e.g., Joe's Pizza"
                          className="w-full pl-12 pr-4 py-3.5 bg-cream border border-border-warm rounded-2xl focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">City or Area</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-warm" />
                        <input
                          type="text"
                          placeholder="e.g., Austin, TX"
                          className="w-full pl-12 pr-4 py-3.5 bg-cream border border-border-warm rounded-2xl focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={!businessName || !city}
                      className="w-full bg-orange text-white py-4 rounded-2xl font-medium hover:bg-orange-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      <Search className="w-5 h-5" />
                      Run Free Audit
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── Loading Step ─── */}
            {appStep === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[50vh]"
              >
                <Loader2 className="w-10 h-10 text-orange animate-spin mb-4" />
                <h3 className="font-serif text-2xl text-charcoal">
                  {selectedBusiness ? 'Analyzing your profile...' : 'Finding your business...'}
                </h3>
                <p className="text-gray-warm mt-2">
                  {selectedBusiness ? 'Scanning reviews, photos, and competitors...' : 'Searching Google Maps...'}
                </p>
              </motion.div>
            )}

            {/* ─── Matches Step ─── */}
            {appStep === 'matches' && (
              <motion.div
                key="matches"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-xl mx-auto pt-8"
              >
                <h2 className="font-serif text-3xl text-charcoal mb-2">We found {matches.length} matches</h2>
                <p className="text-gray-warm mb-8">Select your business to run the full audit.</p>
                
                <div className="space-y-4">
                  {matches.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => handleSelectBusiness(match)}
                      className="w-full bg-white border border-border-warm rounded-2xl p-5 hover:border-orange hover:shadow-md transition-all text-left flex items-center gap-5 group"
                    >
                      <div className="w-14 h-14 bg-cream rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-orange-light transition-colors">
                        <MapPin className="w-6 h-6 text-orange" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-charcoal text-lg">{match.name}</h3>
                        <p className="text-sm text-gray-warm">{match.address}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-sm font-medium">
                            <Star className="w-4 h-4 text-orange fill-orange" />
                            {match.rating}
                          </span>
                          <span className="text-sm text-gray-warm">{match.reviewCount} reviews</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-warm group-hover:text-orange transition-colors" />
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setAppStep('search')}
                  className="mt-6 text-sm text-gray-warm hover:text-charcoal transition-colors"
                >
                  ← Search again
                </button>
              </motion.div>
            )}

            {/* ─── Dashboard Step ─── */}
            {appStep === 'dashboard' && selectedBusiness && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Business Header */}
                <div className="mb-8">
                  <h2 className="font-serif text-3xl text-charcoal mb-1">{selectedBusiness.name}</h2>
                  <p className="text-gray-warm">{selectedBusiness.address}</p>
                </div>

                {/* Audit Score Card */}
                <div className="bg-white border border-border-warm rounded-3xl p-8 md:p-10 mb-8">
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    {/* Gauge */}
                    <div className="relative w-44 h-44 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#E8DFD1" strokeWidth="10" />
                        <circle
                          cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10"
                          strokeLinecap="round" strokeDasharray={`${auditScore * 2.64} 264`}
                          className={auditScore >= 80 ? 'text-green-600' : auditScore >= 60 ? 'text-orange' : 'text-red-500'}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold ${getScoreColor(auditScore)}`}>{auditScore}%</span>
                        <span className="text-xs text-gray-warm">out of 100</span>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex-1 w-full">
                      <h3 className="font-serif text-2xl text-charcoal mb-1">Google Audit Score</h3>
                      <p className={`text-lg font-medium ${getScoreColor(auditScore)} mb-6`}>{getScoreLabel(auditScore)}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-cream rounded-2xl p-4">
                          <div className="text-2xl font-bold text-charcoal">{selectedBusiness.reviewCount}</div>
                          <div className="text-sm text-gray-warm">Total Reviews</div>
                        </div>
                        <div className="bg-cream rounded-2xl p-4">
                          <div className="text-2xl font-bold text-charcoal">3</div>
                          <div className="text-sm text-gray-warm">Photos (avg: 23)</div>
                        </div>
                        <div className="bg-cream rounded-2xl p-4">
                          <div className="text-2xl font-bold text-charcoal">1</div>
                          <div className="text-sm text-gray-warm">Posts This Month</div>
                        </div>
                        <div className="bg-cream rounded-2xl p-4">
                          <div className="text-2xl font-bold text-red-500">15</div>
                          <div className="text-sm text-gray-warm">Unreplied Reviews</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two Column: Reviews + Posts */}
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Review Inbox */}
                  <div className="bg-white border border-border-warm rounded-3xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <MessageSquare className="w-5 h-5 text-orange" />
                      <h3 className="font-serif text-xl text-charcoal">Review Inbox</h3>
                      <span className="bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {reviews.length} pending
                      </span>
                    </div>
                    
                    <div className="space-y-5">
                      {reviews.map((review) => (
                        <div key={review.id} className="border border-border-warm rounded-2xl p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-medium text-charcoal">{review.author}</span>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-orange fill-orange' : 'text-border-warm'}`} />
                                ))}
                                <span className="text-xs text-gray-warm ml-2">{review.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-warm mb-4 leading-relaxed">{review.text}</p>
                          
                          <div className="space-y-3">
                            {(['professional', 'warm', 'apologetic'] as const).map((tone) => (
                              <div key={tone} className="bg-cream rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-orange uppercase tracking-wider">{tone}</span>
                                  <button
                                    onClick={() => copyReply(`${review.id}-${tone}`, review.aiReplies[tone])}
                                    className="text-xs text-orange hover:text-orange-hover flex items-center gap-1 font-medium"
                                  >
                                    {copiedId === `${review.id}-${tone}` ? (
                                      <><Check className="w-3.5 h-3.5" /> Copied</>
                                    ) : (
                                      <><Copy className="w-3.5 h-3.5" /> Copy</>
                                    )}
                                  </button>
                                </div>
                                <p className="text-sm text-charcoal leading-relaxed">{review.aiReplies[tone]}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Posts */}
                  <div className="bg-white border border-border-warm rounded-3xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Calendar className="w-5 h-5 text-orange" />
                      <h3 className="font-serif text-xl text-charcoal">This Week's Posts</h3>
                    </div>
                    
                    <div className="space-y-5">
                      {posts.map((post) => (
                        <div key={post.id} className="border border-border-warm rounded-2xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-orange-light text-orange text-xs font-semibold px-3 py-1 rounded-full">
                              {post.type}
                            </span>
                            <span className="font-medium text-charcoal">{post.title}</span>
                          </div>
                          <p className="text-sm text-gray-warm mb-4 leading-relaxed">{post.content}</p>
                          <div className="flex gap-3">
                            <button className="flex-1 text-sm bg-cream text-charcoal py-2.5 rounded-xl hover:bg-cream-dark transition-colors font-medium">
                              Copy Text
                            </button>
                            <button className="flex-1 text-sm bg-orange text-white py-2.5 rounded-xl hover:bg-orange-hover transition-colors font-medium">
                              Generate Image
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-5 bg-blue-soft/20 rounded-2xl border border-blue-soft/30">
                      <p className="text-sm font-medium text-charcoal mb-1">🚀 Pro Feature</p>
                      <p className="text-sm text-gray-warm">
                        Connect your Google Business Profile to auto-post these directly. 
                        <button className="text-orange font-medium ml-1 hover:underline">Upgrade for $9.99/mo →</button>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}