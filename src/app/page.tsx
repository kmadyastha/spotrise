"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Search, Star, TrendingUp, TrendingDown, Minus, Lock, Zap, ChevronRight, ChevronDown, ChevronUp, X, User, Mail,
  ArrowRight, Play, CheckCircle2, AlertCircle, MessageSquare, Calendar, BarChart3, Target,
  FileText, MapPin, KeyRound, HelpCircle, Image as ImageIcon, Plus, Trash2, Eye, EyeOff,
  RefreshCw, Copy, ThumbsUp, ThumbsDown, Clock, Camera, Phone, Globe, Award, Sparkles, Shield,
} from "lucide-react";

/* ================================================================
   TYPES
   ================================================================ */
type UserState = "anonymous" | "free" | "pro";

interface Review {
  id: number; author: string; rating: number; text: string; date: string;
  sentiment: "positive" | "neutral" | "negative"; aiReply?: string;
}
interface Post {
  id: number; title: string; content: string; date: string; type: string;
}
interface Competitor {
  id: string; name: string; score: number; reviewsCount: number; rating: number;
  photoCount: number; gapInsights: { type: string; text: string }[];
}
interface BusinessSlot {
  id: number; businessName: string | null; location: string | null; changed: boolean;
}
interface ActionItem {
  id: number; priority: "high" | "medium" | "low"; title: string;
  description: string; impact: string;
}
interface WeeklyChange {
  metric: string; current: number; previous: number; change: number; unit: string;
}

/* ================================================================
   MOCK DATA
   ================================================================ */
const MOCK_REVIEWS: Review[] = [
  { id: 1, author: "Sarah M.", rating: 5, text: "Absolutely loved the service! The team went above and beyond. Will definitely recommend to friends.", date: "2 days ago", sentiment: "positive", aiReply: "Thank you so much, Sarah! We're thrilled you had a great experience. Looking forward to serving you again!" },
  { id: 2, author: "James K.", rating: 2, text: "Waited 45 minutes for my order. Staff seemed overwhelmed. Food was okay but not worth the wait.", date: "5 days ago", sentiment: "negative", aiReply: "Hi James, we sincerely apologize for the long wait. We're actively hiring more staff for peak hours. We'd love to make this right — please DM us." },
  { id: 3, author: "Priya R.", rating: 4, text: "Great ambiance and friendly staff. The pasta was delicious but dessert menu could use more options.", date: "1 week ago", sentiment: "positive", aiReply: "Thanks Priya! So glad you enjoyed the pasta. We're actually expanding our dessert menu next month — stay tuned!" },
  { id: 4, author: "Mike T.", rating: 1, text: "Rude manager. Refused to honor the coupon. Never coming back.", date: "2 weeks ago", sentiment: "negative", aiReply: "Mike, we're truly sorry about your experience. This doesn't reflect our values. Our GM would like to speak with you personally — please call us at (555) 123-4567." },
  { id: 5, author: "Lisa W.", rating: 5, text: "Hidden gem! Best brunch spot in the city. The avocado toast is a must-try.", date: "3 weeks ago", sentiment: "positive", aiReply: "Lisa, you just made our day! The avocado toast is our chef's pride. See you again soon!" },
];

const MOCK_POSTS: Post[] = [
  { id: 1, title: "Weekend Special", content: "🍕 This weekend only: Buy any large pizza, get a free garlic bread! Valid Sat-Sun. Walk-ins welcome.", date: "Mon, Aug 4", type: "Offer" },
  { id: 2, title: "New Menu Item", content: "🥑 Introducing our Truffle Avocado Toast — chef's special with poached eggs and microgreens. Available starting today!", date: "Wed, Aug 6", type: "Update" },
  { id: 3, title: "Customer Spotlight", content: "❤️ Thank you to everyone who joined our anniversary celebration! Here are some highlights from the evening.", date: "Fri, Aug 8", type: "Event" },
  { id: 4, title: "Behind the Scenes", content: "👨‍🍳 Meet Chef Marco! With 15 years of experience, he's the mastermind behind our signature dishes. Swipe to see his story.", date: "Sun, Aug 10", type: "Story" },
];


const MOCK_ACTION_ITEMS: ActionItem[] = [
  { id: 1, priority: "high", title: "Response Rate Critical", description: "You're responding to only 23% of reviews. Top performers in your category reply within 24 hours to ALL reviews.", impact: "+15% customer trust" },
  { id: 2, priority: "high", title: "Photo Gap Hurting Visibility", description: "You added 0 photos this month. Businesses with 10+ recent photos get 42% more direction requests.", impact: "+42% direction requests" },
  { id: 3, priority: "medium", title: "Negative Review Pattern", description: "3 recent reviews mention 'slow service' and 'long wait times'. Consider adding staff during 12-2pm peak hours.", impact: "-30% negative reviews" },
  { id: 4, priority: "medium", title: "Missing Business Description", description: "Your GBP description is under 100 characters. Optimized descriptions (750 chars) with keywords boost search by 28%.", impact: "+28% search visibility" },
  { id: 5, priority: "low", title: "Q&A Section Empty", description: "You have 0 answered questions. Proactively adding Q&As improves engagement and captures long-tail searches.", impact: "+12% profile engagement" },
];

const MOCK_WEEKLY_CHANGES: WeeklyChange[] = [
  { metric: "New Reviews", current: 8, previous: 5, change: 60, unit: "" },
  { metric: "Avg Rating", current: 4.2, previous: 4.0, change: 5, unit: "★" },
  { metric: "Response Rate", current: 23, previous: 35, change: -34, unit: "%" },
  { metric: "Profile Views", current: 342, previous: 298, change: 15, unit: "" },
  { metric: "Photo Count", current: 12, previous: 12, change: 0, unit: "" },
];

const FAQS = [
  { q: "What is SpotRise and how can it help my business?", a: "SpotRise is an AI-powered Google Business Profile optimizer built for local businesses. We audit your profile, draft smart replies to reviews, generate weekly posts, and track your competitors — so you rank higher on Google Maps without hiring an agency." },
  { q: "Do I need any tech skills?", a: "Not at all. Just enter your business name and city. Our AI handles the rest. Everything is copy-paste ready for your Google Business Profile." },
  { q: "Will this actually improve my Google ranking?", a: "Yes. Google rewards active, complete profiles with regular posts and prompt review replies. SpotRise automates exactly those signals that push you higher in local search." },
  { q: "What if I already have a website?", a: "SpotRise complements your website by optimizing your Google Business Profile — the #1 factor for local search visibility. We make sure customers find you on Google Maps first." },
  { q: "How does the review reply AI work?", a: "Our AI reads each review and drafts three tone options: Professional, Warm, and Apologetic. You pick the one that fits your brand voice, copy it, and paste it into your Google Business Profile." },
  { q: "Can I cancel anytime?", a: "Absolutely. No contracts, no setup fees. Upgrade or downgrade whenever you want." },
];

const INDUSTRIES = [
  { label: "Restaurants & Cafes", icon: "🍽️" },
  { label: "Home Services", icon: "🔧" },
  { label: "Automotive", icon: "🚗" },
  { label: "Medical & Healthcare", icon: "🩺" },
  { label: "Legal", icon: "⚖️" },
  { label: "Real Estate", icon: "🏠" },
  { label: "Beauty & Personal Care", icon: "💇" },
  { label: "Fitness & Wellness", icon: "🏋️" },
];

const POST_TYPE_STYLE: Record<string, string> = {
  Offer: "bg-orange-light text-orange",
  Update: "bg-blue-soft/15 text-blue-soft-dark",
  Event: "bg-emerald-100 text-emerald-700",
  Story: "bg-rose-100 text-rose-600",
};

const PRO_TOOLS = [
  { id: "description", name: "Description Writer", description: "AI-optimized Google Business Profile description with local SEO keywords", icon: FileText, iconBg: "bg-orange-light", iconColor: "text-orange" },
  { id: "nap", name: "NAP Checker", description: "Verify Name, Address, Phone consistency across 50+ directories", icon: MapPin, iconBg: "bg-blue-soft/15", iconColor: "text-blue-soft-dark" },
  { id: "keywords", name: "Keyword Finder", description: "Discover what your customers actually search for in your area", icon: KeyRound, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  { id: "qa", name: "Q&A Generator", description: "Generate common customer questions and AI-optimized answers", icon: HelpCircle, iconBg: "bg-rose-50", iconColor: "text-rose-500" },
  { id: "posts", name: "Post Generator", description: "AI-generated weekly posts tailored to your business and local events", icon: Sparkles, iconBg: "bg-violet-50", iconColor: "text-violet-500" },
  { id: "photos", name: "Photo Strategy", description: "AI recommendations on what photos to add and why they matter", icon: ImageIcon, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
];

/* ================================================================
   COMPONENT
   ================================================================ */
export default function SpotRisePage() {
  const supabase = useMemo(() => createClient(), []);
  const [userState, setUserState] = useState<UserState>("anonymous");
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");

  // Real search flow state
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "confirming" | "locked" | "error">("idle");
  const [searchMatches, setSearchMatches] = useState<{ placeId: string; name: string; address: string; rating: number | null; reviewCount: number }[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [liveSnapshot, setLiveSnapshot] = useState<{
    score: number; reviewsCount: number; rating: number; photoCount: number; name: string; address: string;
    sentiment: { positive: number; neutral: number; negative: number };
    analysisReviewCount: number;
    businessId: string;
  } | null>(null);
  const [liveActionItems, setLiveActionItems] = useState<{ id: number; priority: string; title: string; description: string; impact: string }[]>([]);
  const [livePosts, setLivePosts] = useState<{ id: number; type: string; title: string; content: string; date: string }[]>([]);
  const [weeklyPulse, setWeeklyPulse] = useState<{ hasEnoughData: boolean; current?: any; changes?: any; lastRefreshed?: string } | null>(null);
  const [refreshingAudit, setRefreshingAudit] = useState(false);
  const [openTool, setOpenTool] = useState<string | null>(null);
  const [liveReviews, setLiveReviews] = useState<{ id: number; dbId: string; author: string; rating: number; text: string; date: string; sentiment: "positive" | "neutral" | "negative"; aiReply?: string }[]>([]);

  const [businessSlots, setBusinessSlots] = useState<BusinessSlot[]>([
    { id: 1, businessName: null, location: null, changed: false },
    { id: 2, businessName: null, location: null, changed: false },
  ]);
  const [currentSlot, setCurrentSlot] = useState(1);

  /* Modals */
  const [showLogin, setShowLogin] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAuditLimit, setShowAuditLimit] = useState(false);
  const [showBusinessLimit, setShowBusinessLimit] = useState(false);
  const [showFinalChange, setShowFinalChange] = useState(false);
  const [showAlreadyChanged, setShowAlreadyChanged] = useState(false);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [showCompetitorUpgrade, setShowCompetitorUpgrade] = useState(false);
  const [showManageSubscription, setShowManageSubscription] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmingUpgrade, setConfirmingUpgrade] = useState(false);
  // Geo-based pricing: India gets real Razorpay checkout in INR;
  // everywhere else sees $ pricing with a waitlist capture until
  // Stripe (pending invite) or Razorpay's international add-on is live.
  const [visitorCountry, setVisitorCountry] = useState<string | null>(null);
  const isIndia = visitorCountry ? visitorCountry === "IN" : true; // default to India while geo is still loading — the common case for now
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [cancelSubLoading, setCancelSubLoading] = useState(false);
  const [cancelSubError, setCancelSubError] = useState<string | null>(null);
  const [cancelSubSuccess, setCancelSubSuccess] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  // Lets a logged-in Pro/Free user with a linked business (who otherwise
  // never sees anything but the dashboard) view the full marketing site
  // — Demo, Features, How It Works, Pricing, FAQ — without losing their
  // session or business data. Reached via the dashboard footer.
  const [showMarketingSite, setShowMarketingSite] = useState(false);

  /* Competitors */
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [confirmRemoveCompetitor, setConfirmRemoveCompetitor] = useState<{ id: string; name: string; message: string } | null>(null);
  const [compSearchName, setCompSearchName] = useState("");
  const [compSearchLoc, setCompSearchLoc] = useState("");
  const [compSearchStatus, setCompSearchStatus] = useState<"idle" | "searching" | "confirming" | "analyzing">("idle");
  const [compMatches, setCompMatches] = useState<{ placeId: string; name: string; address: string; rating: number | null; reviewCount: number }[]>([]);
  const [compError, setCompError] = useState<string | null>(null);

  /* Reviews */
  const [reviewFilter, setReviewFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
  const [loadMoreReviewsError, setLoadMoreReviewsError] = useState<string | null>(null);

  /* UI */
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "posts" | "competitors" | "tools">("overview");
  const [copiedPost, setCopiedPost] = useState<number | null>(null);
  const [copiedReview, setCopiedReview] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  /* Derived */
  // Real reviews once a search has been confirmed; falls back to mock
  // data only when nothing real has loaded yet.
  const reviewSource = liveReviews.length > 0 ? liveReviews : MOCK_REVIEWS;
  const postSource = livePosts.length > 0 ? livePosts : MOCK_POSTS;
  const filteredReviews = reviewSource.filter((r) => reviewFilter === "all" ? true : r.sentiment === reviewFilter);
  // Real score/stats once a search has been confirmed; falls back to
  // mock numbers only for the locked teaser (nothing real to show there).
  const score = liveSnapshot?.score ?? 67;
  const positivePct = liveSnapshot?.sentiment.positive ?? 62;
  const neutralPct = liveSnapshot?.sentiment.neutral ?? 18;
  const negativePct = liveSnapshot?.sentiment.negative ?? 20;
  const usedSlots = businessSlots.filter((s) => s.businessName !== null).length;
  const currentBusiness = businessSlots.find((s) => s.id === currentSlot);

  /* Handlers */
  const runSearch = useCallback(async (name: string, loc: string) => {
    setSearchStatus("searching");
    setSearchError(null);
    try {
      const res = await fetch("/api/search-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: name, location: loc }),
      });

      if (res.status === 401) {
        // Not logged in — the business name/location are already in
        // state, so we don't need to stash them anywhere. Just show
        // the login modal; it reads them directly and encodes them
        // into the magic-link URL itself (see LoginModal below) so
        // they survive even if the link opens in a brand new tab.
        setSearchStatus("idle");
        setShowLogin(true);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        console.error("search-business error:", data);
        setSearchStatus("error");
        setSearchError(
          data.error === "already_linked" ? "You already have a linked business. Manage it from your dashboard." :
          data.error === "places_api_error" ? "Google search failed. Try again in a moment." :
          data.error === "unexpected_error" ? `Unexpected error: ${data.details}` :
          "Something went wrong. Try again."
        );
        return;
      }

      if (data.locked) {
        // Clear out anything left over from a previous successful confirm
        // — otherwise Reviews/Posts/etc keep showing old data forever,
        // since they don't independently know the account is now locked.
        setLiveSnapshot(null);
        setLiveActionItems([]);
        setLiveReviews([]);
        setSearchStatus("locked");
        setHasSearched(true);
        return;
      }

      setSearchMatches(data.matches);
      setSearchStatus("confirming");
    } catch {
      setSearchStatus("error");
      setSearchError("Something went wrong. Try again.");
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (!businessName.trim() || !location.trim()) return;
    runSearch(businessName, location);
  }, [businessName, location, runSearch]);

  const handleConfirmBusiness = useCallback(async (placeId: string, name: string, address: string) => {
    setSearchStatus("searching");
    try {
      const res = await fetch("/api/confirm-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("confirm-business error:", data);
        setSearchStatus("error");
        setSearchError(
          data.error === "locked" ? "You've used both free audits — upgrade to link a business." :
          data.error === "places_details_error" ? "Couldn't fetch details from Google for that business. Try a different match." :
          data.error === "db_error" ? `Save failed: ${data.details}` :
          data.error === "unexpected_error" ? `Unexpected error: ${data.details}` :
          "Something went wrong confirming that business."
        );
        return;
      }

      setLiveSnapshot({
        score: data.snapshot.score,
        reviewsCount: data.snapshot.reviews_count,
        rating: data.snapshot.rating,
        photoCount: data.snapshot.photo_count,
        name,
        address,
        sentiment: data.snapshot.sentiment ?? { positive: 0, neutral: 0, negative: 0 },
        analysisReviewCount: data.analysisReviewCount ?? 0,
        businessId: data.business.id,
      });
      setLiveActionItems(
        (data.actionItems ?? []).map((item: any, i: number) => ({ id: i, ...item }))
      );
      setLiveReviews(
        (data.reviews ?? []).map((r: any, i: number) => ({
          id: i,
          dbId: r.id,
          author: r.author,
          rating: r.rating,
          text: r.text,
          date: r.review_date ? new Date(r.review_date).toLocaleDateString() : "Recently",
          sentiment: r.sentiment,
          aiReply: r.ai_reply || undefined,
        }))
      );
      setLivePosts(
        (data.posts ?? []).map((p: any, i: number) => ({
          id: i,
          type: p.type,
          title: p.title,
          content: p.content,
          date: new Date(p.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        }))
      );
      setWeeklyPulse(null); // reset — will fetch fresh below if Pro
      setSearchStatus("idle");
      setHasSearched(true);
      setActiveTab("overview");
      if (data.business?.is_linked) {
        fetch(`/api/weekly-pulse?businessId=${data.business.id}`)
          .then((r) => r.json())
          .then((wp) => setWeeklyPulse(wp))
          .catch(() => {});
      }
    } catch {
      setSearchStatus("error");
      setSearchError("Something went wrong confirming that business.");
    }
  }, []);

  // Resume a search that was interrupted by the login prompt. Rather
  // than rely on sessionStorage (which doesn't survive the email link
  // opening in a new tab), the pending search is encoded directly in
  // the URL the magic link redirects back to — see LoginModal for
  // where that URL gets built.
  const resumePendingSearch = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("resumeName");
    const loc = params.get("resumeLoc");
    if (name && loc) {
      window.history.replaceState({}, "", window.location.pathname);
      setBusinessName(name);
      setLocation(loc);
      runSearch(name, loc);
    }
  }, [runSearch]);

  // Real auth: check for an existing session on load, then keep listening
  // for sign-in / sign-out so the whole app reacts automatically —
  // no page refresh needed after clicking the magic link.
  const loadMySession = useCallback(async () => {
    try {
      const res = await fetch("/api/my-business");
      if (!res.ok) return;
      const data = await res.json();
      setUserState(data.plan === "pro" ? "pro" : "free");

      if (data.hasBusiness && data.business) {
        setLiveSnapshot({
          score: data.snapshot?.score ?? 0,
          reviewsCount: data.snapshot?.reviews_count ?? 0,
          rating: data.snapshot?.rating ?? 0,
          photoCount: data.snapshot?.photo_count ?? 0,
          name: data.business.name,
          address: data.business.address,
          sentiment: data.snapshot?.sentiment ?? { positive: 0, neutral: 0, negative: 0 },
          analysisReviewCount: data.reviews?.length ?? 0,
          businessId: data.business.id,
        });
        setLiveActionItems((data.actionItems ?? []).map((item: any, i: number) => ({ id: i, priority: item.priority, title: item.title, description: item.description, impact: item.impact })));
        setLiveReviews((data.reviews ?? []).map((r: any, i: number) => ({
          id: i, dbId: r.id, author: r.author, rating: r.rating, text: r.text,
          date: r.review_date ? new Date(r.review_date).toLocaleDateString() : "Recently",
          sentiment: r.sentiment, aiReply: r.ai_reply || undefined,
        })));
        setLivePosts((data.posts ?? []).map((p: any, i: number) => ({
          id: i, type: p.type, title: p.title, content: p.content,
          date: new Date(p.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        })));
        setCompetitors((data.competitors ?? []).map((c: any) => ({
          id: c.id, name: c.name, score: c.score ?? 0, reviewsCount: c.reviews_count ?? 0,
          rating: c.rating ?? 0, photoCount: c.photo_count ?? 0, gapInsights: c.gap_insights ?? [],
        })));
        setHasSearched(true);
        setActiveTab("overview");
      }
    } catch (err) {
      console.error("loadMySession failed:", err);
    }
  }, []);

  // After a successful Stripe Checkout, Stripe redirects back here with
  // ?checkout=success — but the webhook that actually flips the plan to
  // "pro" can take a moment to arrive. Poll briefly rather than showing
  // stale "Free" state right after payment.
  const pollForProPlan = useCallback(async (attemptsLeft: number) => {
    try {
      const res = await fetch("/api/my-business");
      const data = await res.json();
      if (data.plan === "pro" || attemptsLeft <= 0) {
        await loadMySession();
        setConfirmingUpgrade(false);
        return;
      }
    } catch (err) {
      console.error("pollForProPlan failed:", err);
    }
    setTimeout(() => pollForProPlan(attemptsLeft - 1), 1500);
  }, [loadMySession]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      setConfirmingUpgrade(true);
      pollForProPlan(6);
    }
  }, [pollForProPlan]);

  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then((data) => setVisitorCountry(data.country ?? null))
      .catch(() => setVisitorCountry(null));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? null);
        // Wait for the real plan + business data to load before ever
        // rendering anything — otherwise the landing page renders first
        // (userState still defaults to "anonymous" for that instant),
        // which can open the login modal on a field click even though
        // the person is already logged in, right before the dashboard
        // swaps in underneath it.
        await loadMySession();
        resumePendingSearch();
      }
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? null);
        loadMySession();
        if (event === "SIGNED_IN") resumePendingSearch();
      } else {
        setUserEmail(null);
        setUserState("anonymous");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase, resumePendingSearch, loadMySession]);

  // Belt-and-suspenders: if the login modal is somehow open when the
  // person turns out to already be logged in (any remaining race, or a
  // stale click that landed a moment before state updated), close it
  // automatically instead of leaving it stuck over the dashboard.
  useEffect(() => {
    if (userState !== "anonymous" && showLogin) {
      setShowLogin(false);
    }
  }, [userState, showLogin]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserState("anonymous");
    setUserEmail(null);
    setHasSearched(false);
    setLiveSnapshot(null);
    setLiveActionItems([]);
    setLiveReviews([]);
    setLivePosts([]);
    setCompetitors([]);
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      const res = await fetch("/api/delete-account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        console.error("delete-account error:", data);
        setDeleteAccountError(
          data.error === "pro_only" ? "Account deletion is available for Pro accounts. Free accounts can request deletion by emailing support@spotrise.app." :
          "Something went wrong deleting your account. Try again, or contact support if this keeps happening."
        );
        return;
      }
      // The account is gone server-side — clear the local session and
      // all in-memory state the same way sign-out does.
      await supabase.auth.signOut();
      setShowDeleteAccount(false);
      setUserState("anonymous");
      setUserEmail(null);
      setHasSearched(false);
      setShowMarketingSite(false);
      setLiveSnapshot(null);
      setLiveActionItems([]);
      setLiveReviews([]);
      setLivePosts([]);
      setCompetitors([]);
    } catch (err) {
      console.error("delete-account failed:", err);
      setDeleteAccountError("Something went wrong deleting your account. Try again, or contact support if this keeps happening.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/create-razorpay-subscription", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        console.error("create-razorpay-subscription error:", data);
        setCheckoutError(
          data.error === "already_pro" ? "You're already on Pro." :
          `Something went wrong starting checkout (${data.error ?? "unknown_error"}). ${data.details ? String(data.details).slice(0, 200) : "Try again in a moment."}`
        );
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error("create-razorpay-subscription failed:", err);
      setCheckoutError("Something went wrong starting checkout. Try again in a moment.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleJoinWaitlist = async (email: string) => {
    setWaitlistLoading(true);
    setWaitlistError(null);
    try {
      const res = await fetch("/api/international-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("international-waitlist error:", data);
        setWaitlistError("Something went wrong. Try again in a moment.");
        return;
      }
      setWaitlistSubmitted(true);
    } catch (err) {
      console.error("international-waitlist failed:", err);
      setWaitlistError("Something went wrong. Try again in a moment.");
    } finally {
      setWaitlistLoading(false);
    }
  };

  // Razorpay has no hosted self-service billing portal the way Stripe
  // does — this just opens our own modal, which now contains the real
  // cancel-subscription action instead of redirecting anywhere.
  const handleManageSubscription = () => setShowManageSubscription(true);

  const handleCancelSubscription = async () => {
    setCancelSubLoading(true);
    setCancelSubError(null);
    try {
      const res = await fetch("/api/cancel-razorpay-subscription", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        console.error("cancel-razorpay-subscription error:", data);
        setCancelSubError(
          data.error === "no_subscription" ? "This account has no real Razorpay subscription on file (likely set to Pro manually for earlier testing) — nothing to cancel." :
          `Something went wrong cancelling (${data.error ?? "unknown_error"}). ${data.details ? String(data.details).slice(0, 200) : "Try again, or contact support@spotrise.app."}`
        );
        return;
      }
      setCancelSubSuccess(true);
    } catch (err) {
      console.error("cancel-razorpay-subscription failed:", err);
      setCancelSubError("Something went wrong cancelling your subscription. Try again, or contact support@spotrise.app.");
    } finally {
      setCancelSubLoading(false);
    }
  };

  // Shows the marketing site (reusing the same landing-page content
  // anonymous visitors see) on top of an active session, then scrolls to
  // the requested section once it's rendered. Pure client-state — no
  // navigation, so the dashboard and business data stay intact underneath.
  const goToMarketingSection = (anchorId: string) => {
    setShowMarketingSite(true);
    setTimeout(() => document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  const handleChangeBusiness = (slotId: number) => {
    const slot = businessSlots.find((s) => s.id === slotId);
    if (!slot) return;
    if (slot.changed) { setShowAlreadyChanged(true); return; }
    setShowFinalChange(true);
  };

  const confirmChangeBusiness = () => {
    setBusinessSlots((slots) => slots.map((s) => s.id === currentSlot ? { ...s, businessName: null, location: null, changed: true } : s));
    setShowFinalChange(false);
    setHasSearched(false);
    setBusinessName("");
    setLocation("");
    setCompetitors([]);
  };

  const handleAddCompetitor = () => {
    if (userState !== "pro") { setShowCompetitorUpgrade(true); return; }
    if (competitors.length >= 2) return;
    setCompMatches([]);
    setCompSearchStatus("idle");
    setShowAddCompetitor(true);
  };

  const searchCompetitor = async () => {
    if (!compSearchName.trim() || !compSearchLoc.trim() || !liveSnapshot?.businessId) return;
    setCompSearchStatus("searching");
    setCompError(null);
    try {
      const res = await fetch("/api/search-competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: liveSnapshot.businessId, competitorName: compSearchName, location: compSearchLoc }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCompError(data.error === "competitor_limit_reached" ? "You've already got 2 competitors tracked — remove one first." : "Something went wrong searching. Try again.");
        setCompSearchStatus("idle");
        return;
      }
      setCompMatches(data.matches ?? []);
      setCompSearchStatus("confirming");
    } catch {
      setCompError("Something went wrong searching. Try again.");
      setCompSearchStatus("idle");
    }
  };

  const confirmAddCompetitor = async (placeId: string, name: string) => {
    if (!liveSnapshot?.businessId) return;
    setCompSearchStatus("analyzing");
    setCompError(null);
    try {
      const res = await fetch("/api/confirm-competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: liveSnapshot.businessId, placeId, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCompError(
          data.error === "competitor_limit_reached" ? "You've already got 2 competitors tracked — remove one first." :
          data.error === "monthly_action_limit_reached" ? "You've used all 5 competitor changes for this membership month. More available once your next membership month starts." :
          "Something went wrong analyzing this competitor."
        );
        setCompSearchStatus("confirming");
        return;
      }
      const c = data.competitor;
      setCompetitors((prev) => [...prev, {
        id: c.id, name: c.name, score: c.score, reviewsCount: c.reviews_count,
        rating: c.rating, photoCount: c.photo_count, gapInsights: c.gap_insights ?? [],
      }]);
      setCompSearchName(""); setCompSearchLoc(""); setCompMatches([]);
      setShowAddCompetitor(false);
      setCompSearchStatus("idle");
    } catch {
      setCompError("Something went wrong analyzing this competitor.");
      setCompSearchStatus("confirming");
    }
  };

  const requestRemoveCompetitor = async (id: string, name: string) => {
    // Fetch current quota usage first so the confirmation message is
    // accurate ("3 of 5 used"), and gets a distinct warning on the
    // last available action. Shown in our own styled modal below —
    // not the native browser confirm() dialog.
    let used = 0, limit = 5;
    try {
      const quotaRes = await fetch("/api/competitor-quota");
      const quota = await quotaRes.json();
      used = quota.used ?? 0;
      limit = quota.limit ?? 5;
    } catch (err) {
      console.error("competitor-quota failed:", err);
    }

    const message = used >= limit - 1
      ? `This will use your last competitor change for this membership month (${used} of ${limit} already used). You won't be able to add or remove any more competitors until your next membership month starts.`
      : `Removing this competitor will use ${used + 1} of ${limit} competitor changes for this membership month.`;

    setConfirmRemoveCompetitor({ id, name, message });
  };

  const doRemoveCompetitor = async () => {
    if (!confirmRemoveCompetitor) return;
    const { id } = confirmRemoveCompetitor;
    setConfirmRemoveCompetitor(null);
    setCompetitors((c) => c.filter((comp) => comp.id !== id));
    try {
      await fetch(`/api/remove-competitor?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("remove-competitor failed:", err);
    }
  };

  const copyPost = (id: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedPost(id);
    setTimeout(() => setCopiedPost(null), 2000);
  };

  const copyReviewReply = (id: number, reply: string) => {
    navigator.clipboard.writeText(reply);
    setCopiedReview(id);
    setTimeout(() => setCopiedReview(null), 2000);
  };

  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [regenerateErrors, setRegenerateErrors] = useState<Record<number, string>>({});
  const handleRegenerateReply = async (displayId: number, dbId: string, text: string, rating: number) => {
    setRegeneratingId(displayId);
    setRegenerateErrors((prev) => { const next = { ...prev }; delete next[displayId]; return next; });
    try {
      const res = await fetch("/api/regenerate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: dbId, businessName: liveSnapshot?.name ?? "", reviewText: text, reviewRating: rating }),
      });
      const data = await res.json();
      if (res.ok) {
        setLiveReviews((prev) => prev.map((r) => r.id === displayId ? { ...r, aiReply: data.reply } : r));
      } else {
        console.error("regenerate-reply error:", data);
        setRegenerateErrors((prev) => ({
          ...prev,
          [displayId]:
            data.error === "not_found" ? "Couldn't verify this review belongs to your account — try refreshing the page." :
            data.error === "claude_error" ? "The AI reply generator is temporarily unavailable. Try again in a moment." :
            "Something went wrong generating a reply. Try again.",
        }));
      }
    } catch (err) {
      console.error("regenerate-reply failed:", err);
      setRegenerateErrors((prev) => ({ ...prev, [displayId]: "Something went wrong generating a reply. Try again." }));
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleRefreshAudit = async () => {
    if (!liveSnapshot?.businessId) return;
    setRefreshingAudit(true);
    try {
      const res = await fetch("/api/refresh-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: liveSnapshot.businessId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("refresh-audit error:", data);
        return;
      }
      setLiveSnapshot((prev) => prev ? {
        ...prev,
        score: data.snapshot.score,
        reviewsCount: data.snapshot.reviews_count,
        rating: data.snapshot.rating,
        photoCount: data.snapshot.photo_count,
        sentiment: data.snapshot.sentiment,
        analysisReviewCount: data.analysisReviewCount ?? prev.analysisReviewCount,
      } : prev);
      setLiveActionItems((data.actionItems ?? []).map((item: any, i: number) => ({ id: i, ...item })));
      setLiveReviews((data.reviews ?? []).map((r: any, i: number) => ({
        id: i, dbId: r.id, author: r.author, rating: r.rating, text: r.text,
        date: r.review_date ? new Date(r.review_date).toLocaleDateString() : "Recently",
        sentiment: r.sentiment, aiReply: r.ai_reply || undefined,
      })));
      const wpRes = await fetch(`/api/weekly-pulse?businessId=${liveSnapshot.businessId}`);
      setWeeklyPulse(await wpRes.json());
    } catch (err) {
      console.error("refresh-audit failed:", err);
    } finally {
      setRefreshingAudit(false);
    }
  };

  const handleLoadMoreReviews = async () => {
    if (!liveSnapshot?.businessId) return;
    setLoadingMoreReviews(true);
    setLoadMoreReviewsError(null);
    try {
      const res = await fetch("/api/load-more-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: liveSnapshot.businessId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("load-more-reviews error:", data);
        setLoadMoreReviewsError(
          data.error === "max_reached" ? "You've loaded the maximum of 80 reviews." :
          data.error === "outscraper_error" ? "Couldn't fetch more reviews right now. Try again in a moment." :
          data.error === "pro_only" ? "Your account isn't actually Pro in the database yet — the 'Upgrade to Pro' button only changes what's shown on screen right now, not your real plan." :
          "Something went wrong loading more reviews."
        );
        return;
      }
      setLiveReviews((data.reviews ?? []).map((r: any, i: number) => ({
        id: i, dbId: r.id, author: r.author, rating: r.rating, text: r.text,
        date: r.review_date ? new Date(r.review_date).toLocaleDateString() : "Recently",
        sentiment: r.sentiment, aiReply: r.ai_reply || undefined,
      })));
    } catch (err) {
      console.error("load-more-reviews failed:", err);
      setLoadMoreReviewsError("Something went wrong loading more reviews.");
    } finally {
      setLoadingMoreReviews(false);
    }
  };

  const getScoreColor = (s: number) => { if (s >= 80) return "text-emerald-600"; if (s >= 60) return "text-amber-500"; return "text-red-500"; };
  const getPriorityColor = (p: string) => {
    if (p === "high") return "bg-red-100 text-red-600 border-red-200";
    if (p === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  /* ================================================================
     AUTH LOADING — shown while we check for an existing session and,
     if one exists, load the real plan + business data. Prevents the
     marketing landing page from flashing for an already-logged-in
     returning user (e.g. right after clicking a magic link), which is
     what let the login modal get triggered on a stray click a moment
     before the dashboard swapped in underneath it.
     ================================================================ */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-orange-light" />
          <div className="absolute inset-0 rounded-full border-4 border-orange border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  /* ================================================================
     BUSINESS CONFIRMATION — real Places results, user picks theirs
     ================================================================ */
  if (searchStatus === "confirming" || searchStatus === "searching" || searchStatus === "error") {
    return (
      <div className="min-h-screen bg-cream text-charcoal flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <button onClick={() => setSearchStatus("idle")} className="text-sm text-gray-warm hover:text-charcoal mb-6 flex items-center gap-1">
            <ChevronRight className="w-4 h-4 rotate-180" />Back
          </button>

          {searchStatus === "searching" && <SearchingProgress />}

          {searchStatus === "error" && (
            <div className="rounded-2xl bg-white border border-red-200 shadow-sm p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <p className="text-charcoal font-medium mb-1">Couldn't complete that search</p>
              <p className="text-sm text-gray-warm mb-5">{searchError}</p>
              <button onClick={() => setSearchStatus("idle")} className="px-5 py-2 rounded-lg bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors">Try again</button>
            </div>
          )}

          {searchStatus === "confirming" && (
            <>
              <h1 className="font-serif text-2xl font-bold mb-2">Which one is your business?</h1>
              <p className="text-sm text-gray-warm mb-6">We found {searchMatches.length} match{searchMatches.length !== 1 ? "es" : ""} for "{businessName}" near {location}.</p>
              <div className="space-y-3">
                {searchMatches.map((m) => (
                  <button key={m.placeId} onClick={() => handleConfirmBusiness(m.placeId, m.name, m.address)}
                    className="w-full text-left p-4 rounded-2xl bg-white border border-border-warm shadow-sm hover:border-orange/40 hover:shadow-md transition-all flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{m.name}</div>
                      <div className="text-xs text-gray-warm mt-1 truncate">{m.address}</div>
                      {m.rating && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-warm">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />{m.rating} ({m.reviewCount} reviews)
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-orange-light text-orange font-medium">This is mine</span>
                  </button>
                ))}
                {searchMatches.length === 0 && (
                  <div className="text-center py-8 text-sm text-gray-warm">No matches found — try a different spelling or add more of the address.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ================================================================
     LANDING PAGE
     ================================================================ */
  if (!hasSearched || showMarketingSite) {
    return (
      <div className="min-h-screen bg-cream text-charcoal">
        {confirmingUpgrade && (
          <div className="fixed top-0 inset-x-0 z-[100] bg-orange text-white text-sm text-center py-2 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />Confirming your upgrade...
          </div>
        )}
        {/* Navbar */}
        <nav className="border-b border-border-warm backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-orange flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-serif font-bold tracking-tight">SpotRise</span>
            </div>
            <div className="hidden lg:flex items-center gap-7 text-sm text-gray-warm">
              <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-charcoal transition-colors">Features</button>
              <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-charcoal transition-colors">How It Works</button>
              <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-charcoal transition-colors">Pricing</button>
              <button onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-charcoal transition-colors">FAQ</button>
              <Link href="/blog" className="hover:text-charcoal transition-colors">Blog</Link>
              <Link href="/about" className="hover:text-charcoal transition-colors">About</Link>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {userState === "anonymous" ? (
                <>
                  <button onClick={() => setShowLogin(true)} className="text-sm text-gray-warm hover:text-charcoal transition-colors">Sign In</button>
                  <button onClick={() => setShowLogin(true)} className="text-sm px-4 py-2 rounded-lg bg-white hover:bg-cream-dark transition-colors">Get Started</button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  {showMarketingSite && liveSnapshot && (
                    <button onClick={() => setShowMarketingSite(false)} className="text-sm px-4 py-2 rounded-lg bg-orange text-white hover:bg-orange-hover transition-colors flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />Back to Dashboard
                    </button>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${userState === "pro" ? "bg-amber-100 text-amber-700" : "bg-blue-soft/20 text-blue-soft-dark"}`}>
                    {userState === "pro" ? "Pro Plan" : "Free Plan"}
                  </span>
                  {userState !== "pro" && (
                    <button onClick={() => setShowUpgrade(true)} className="text-xs px-3 py-1.5 rounded-lg bg-orange text-white hover:bg-orange-hover transition-colors">Upgrade</button>
                  )}
                  <ProfileMenu
                    userEmail={userEmail}
                    userState={userState}
                    onSignOut={handleSignOut}
                    onUpgrade={() => setShowUpgrade(true)}
                    onManageSubscription={handleManageSubscription}
                    onDeleteAccount={() => setShowDeleteAccount(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-20 pb-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-orange uppercase mb-6">Built for Owners</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-5xl mx-auto leading-tight">
              Turn Your Google Profile Into{" "}
              <span className="text-orange italic">a Customer Magnet</span>
            </h1>
            <p className="mt-6 text-lg text-gray-warm max-w-3xl mx-auto leading-relaxed">
              Get a complete AI audit of your Google Business Profile. Discover exactly what's hurting your visibility and what to fix first — in under 60 seconds.
            </p>

            {liveSnapshot ? (
              /* Returning dashboard user browsing the marketing site —
                 no search fields; nothing to search for, they already
                 have a linked business. Just a clear way back. */
              <div className="mt-10 max-w-md mx-auto">
                <div className="p-6 rounded-2xl bg-white border-2 border-border-warm shadow-sm">
                  <div className="w-11 h-11 rounded-xl bg-orange-light flex items-center justify-center mx-auto mb-3"><BarChart3 className="w-5 h-5 text-orange" /></div>
                  <p className="text-sm text-charcoal font-medium mb-1">{liveSnapshot.name}</p>
                  <p className="text-xs text-gray-warm mb-4">Your dashboard has the latest on your reviews, score, and what to fix next.</p>
                  <button onClick={() => setShowMarketingSite(false)} className="w-full py-2.5 rounded-xl bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors flex items-center justify-center gap-2">
                    <ChevronRight className="w-4 h-4 rotate-180" />Back to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              /* Search Box */
              <div id="hero-search" className="mt-10 max-w-2xl mx-auto scroll-mt-24">
                <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl bg-white border-2 border-border-warm shadow-sm">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3">
                    <Search className="w-5 h-5 text-gray-warm shrink-0" />
                    <input type="text" placeholder="Business name (e.g., Joe's Pizza)" value={businessName} onChange={(e) => setBusinessName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      onFocus={(e) => { if (userState === "anonymous") { e.target.blur(); setShowLogin(true); } }}
                      className="w-full bg-transparent text-charcoal placeholder:text-gray-warm outline-none text-sm" />
                  </div>
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 border-t sm:border-t-0 sm:border-l border-border-warm">
                    <MapPin className="w-5 h-5 text-gray-warm shrink-0" />
                    <input type="text" placeholder="City (e.g., Austin)" value={location} onChange={(e) => setLocation(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      onFocus={(e) => { if (userState === "anonymous") { e.target.blur(); setShowLogin(true); } }}
                      className="w-full bg-transparent text-charcoal placeholder:text-gray-warm outline-none text-sm" />
                  </div>
                  <button onClick={() => userState === "anonymous" ? setShowLogin(true) : handleSearch()} disabled={userState !== "anonymous" && (!businessName.trim() || !location.trim())}
                    className="px-6 py-3 rounded-xl bg-orange text-white font-medium text-sm hover:bg-orange-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    Audit Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-warm">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-orange" />No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-orange" />2 free audits</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-orange" />Instant results</span>
              <button onClick={() => document.getElementById("video-demo")?.scrollIntoView({ behavior: "smooth" })} className="flex items-center gap-1.5 text-orange font-medium hover:text-orange-hover transition-colors">
                <Play className="w-3.5 h-3.5" />View Demo
              </button>
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal mb-2">Built for Every Kind of Local Business</h2>
            <p className="text-sm text-gray-warm mb-8">Wherever you are, SpotRise speaks your business's language.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {INDUSTRIES.map((ind) => (
                <span key={ind.label} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-light border border-orange/20 rounded-full text-sm font-medium text-charcoal hover:border-orange hover:bg-orange/10 transition-colors cursor-default">
                  <span className="text-base leading-none">{ind.icon}</span>{ind.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Video */}
        <section id="video-demo" className="pb-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-2xl bg-charcoal overflow-hidden flex flex-col items-center justify-center gap-4 group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-charcoal/80 to-charcoal/40" />
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
                <p className="text-white font-medium">See SpotRise in action</p>
                <p className="text-white/60 text-sm mt-1">Demo video coming soon</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 border-t border-border-warm px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl font-bold">Everything You Need to Dominate Local Search</h2>
              <p className="mt-3 text-gray-warm">Consulting-grade insights, automated.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: BarChart3, title: "AI-Powered GBP Audit", desc: "Get a 0-100 score with specific, actionable fixes prioritized by impact. Know exactly what's hurting your visibility.", iconBg: "bg-orange-light", iconColor: "text-orange" },
                { icon: MessageSquare, title: "Smart Review Replies", desc: "Never stare at a blank screen again. AI drafts Professional, Warm, and Apologetic replies to every review.", iconBg: "bg-blue-soft/15", iconColor: "text-blue-soft-dark" },
                { icon: Calendar, title: "Weekly Post Generator", desc: "Get three ready-to-publish Google Business Posts every week — offers, updates, and events tailored to your business.", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
                { icon: Target, title: "Competitor Gap Analysis", desc: "Add competitors and see exactly where you're losing — photos, reviews, response rate — and how to catch up.", iconBg: "bg-rose-50", iconColor: "text-rose-500" },
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-border-warm hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}><f.icon className={`w-5 h-5 ${f.iconColor}`} /></div>
                  <h3 className="font-serif text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-warm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 border-t border-border-warm px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl font-bold">How It Works</h2>
              <p className="mt-3 text-gray-warm">From search to insights in 3 steps.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                {[
                  { step: "01", title: "Search Your Business", desc: "Enter your business name and city. We scan your Google Business Profile instantly." },
                  { step: "02", title: "Get Your AI Audit", desc: "Receive a detailed score, sentiment analysis, and prioritized action items." },
                  { step: "03", title: "Fix & Grow", desc: "Use our Pro Tools to optimize your profile and watch your visibility soar." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="w-12 h-12 rounded-xl bg-orange-light flex items-center justify-center shrink-0 border border-orange/30">
                      <span className="text-sm font-bold text-orange">{s.step}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{s.title}</h3>
                      <p className="text-gray-warm mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <HowItWorksMarquee />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 border-t border-border-warm px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl font-bold">Simple Pricing</h2>
              <p className="mt-3 text-gray-warm">Start free. Upgrade when you're ready.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="p-6 rounded-2xl bg-white border border-border-warm shadow-sm">
                <div className="text-sm text-gray-warm font-medium mb-2">Free</div>
                <div className="text-3xl font-bold mb-1">$0</div>
                <div className="text-sm text-gray-warm mb-6">Forever free</div>
                <ul className="space-y-3 mb-6">
                  {["2 full AI audits", "Review sentiment analysis", "Basic action items", "1 business profile"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-warm"><CheckCircle2 className="w-4 h-4 text-orange shrink-0" />{item}</li>
                  ))}
                </ul>
                <button onClick={() => liveSnapshot ? setShowMarketingSite(false) : userState === "anonymous" ? setShowLogin(true) : document.getElementById("hero-search")?.scrollIntoView({ behavior: "smooth" })} className="w-full py-2.5 rounded-xl bg-cream border border-border-warm hover:bg-cream-dark transition-colors text-sm font-medium">{liveSnapshot ? "Back to Dashboard" : userState === "anonymous" ? "Get Started Free" : "Run an Audit"}</button>
              </div>
              <div className="p-6 rounded-2xl bg-white border-2 border-orange shadow-md relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orange text-white text-xs font-medium">Most Popular</div>
                <div className="text-sm text-orange font-medium mb-2">Pro</div>
                <div className="text-3xl font-bold mb-1">{isIndia ? "₹699" : "$9"}<span className="text-lg text-gray-warm font-normal">/mo</span></div>
                <div className="text-sm text-gray-warm mb-6">Billed monthly</div>
                <ul className="space-y-3 mb-6">
                  {["Unlimited AI audits", "Competitor gap analysis (3 max)", "All Pro Tools unlocked", "2 business profiles", "Weekly pulse reports", "Priority support"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-charcoal"><CheckCircle2 className="w-4 h-4 text-orange shrink-0" />{item}</li>
                  ))}
                </ul>
                <button onClick={() => setShowUpgrade(true)} className="w-full py-2.5 rounded-xl bg-orange text-white hover:bg-orange-hover transition-colors text-sm font-medium">Upgrade to Pro</button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 border-t border-border-warm px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold">Your questions, answered.</h2>
            </div>
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div key={i} className={`border rounded-2xl overflow-hidden transition-all ${openFaq === i ? "border-charcoal bg-white shadow-md" : "border-border-warm bg-white/50"}`}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                    <span className="font-medium text-charcoal pr-4">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-orange shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-warm shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <p className="px-6 pb-6 text-gray-warm leading-relaxed">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="bg-blue-soft rounded-[2.5rem] p-12 md:p-16 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-6">
              Are you ready to dominate <span className="italic text-orange">local search</span> and generate more leads for your business?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => liveSnapshot ? setShowMarketingSite(false) : userState === "anonymous" ? setShowLogin(true) : document.getElementById("hero-search")?.scrollIntoView({ behavior: "smooth" })} className="bg-orange text-white px-8 py-3.5 rounded-full font-medium hover:bg-orange-hover transition-colors">{liveSnapshot ? "Back to Dashboard" : userState === "anonymous" ? "Get started" : "Run an audit"}</button>
              <button onClick={() => document.getElementById("video-demo")?.scrollIntoView({ behavior: "smooth" })} className="bg-white text-charcoal px-8 py-3.5 rounded-full font-medium hover:bg-cream-dark transition-colors">View Demo</button>
            </div>
          </div>
        </section>

        <SiteFooter onGoToSection={liveSnapshot ? goToMarketingSection : undefined} />

        {/* Modals */}
        <LoginModal open={showLogin} onClose={() => setShowLogin(false)} pendingBusinessName={businessName} pendingLocation={location} />
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} onUpgrade={handleUpgrade} loading={checkoutLoading} error={checkoutError}
          isIndia={isIndia} waitlistEmail={waitlistEmail} setWaitlistEmail={setWaitlistEmail} onJoinWaitlist={handleJoinWaitlist}
          waitlistLoading={waitlistLoading} waitlistError={waitlistError} waitlistSubmitted={waitlistSubmitted} />
        <AuditLimitModal open={showAuditLimit} onClose={() => setShowAuditLimit(false)} onLogin={() => { setShowAuditLimit(false); setShowLogin(true); }} />
        <ManageSubscriptionModal open={showManageSubscription} onClose={() => { setShowManageSubscription(false); setCancelSubSuccess(false); setCancelSubError(null); }}
        onCancel={handleCancelSubscription} cancelling={cancelSubLoading} cancelError={cancelSubError} cancelSuccess={cancelSubSuccess} />
        <DeleteAccountModal open={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} onConfirm={handleDeleteAccount} deleting={deletingAccount} error={deleteAccountError} />
      </div>
    );
  }

  /* ================================================================
     DASHBOARD
     ================================================================ */
  return (
    <div className="min-h-screen bg-cream text-charcoal">
      {confirmingUpgrade && (
        <div className="fixed top-0 inset-x-0 z-[100] bg-orange text-white text-sm text-center py-2 flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />Confirming your upgrade...
        </div>
      )}
      {/* Navbar */}
      <nav className="border-b border-border-warm backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-orange flex items-center justify-center cursor-pointer" onClick={() => liveSnapshot ? setActiveTab("overview") : setHasSearched(false)}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight cursor-pointer" onClick={() => liveSnapshot ? setActiveTab("overview") : setHasSearched(false)}>SpotRise</span>
            {userState !== "anonymous" && currentBusiness?.businessName && (
              <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-cream border border-border-warm text-xs">
                <span className="text-gray-warm">Business {currentSlot} of 2:</span>
                <span className="text-charcoal font-medium">{currentBusiness.businessName}</span>
                {!currentBusiness.changed && (
                  <button onClick={() => handleChangeBusiness(currentSlot)} className="text-orange hover:text-orange-hover ml-1">Change</button>
                )}
              </div>
            )}
          </div>
          <div className="hidden xl:flex items-center gap-6 text-sm text-gray-warm">
            <button onClick={() => goToMarketingSection("features")} className="hover:text-charcoal transition-colors">Features</button>
            <button onClick={() => goToMarketingSection("how-it-works")} className="hover:text-charcoal transition-colors">How It Works</button>
            <button onClick={() => goToMarketingSection("pricing")} className="hover:text-charcoal transition-colors">Pricing</button>
            <button onClick={() => goToMarketingSection("faq")} className="hover:text-charcoal transition-colors">FAQ</button>
            <Link href="/blog" className="hover:text-charcoal transition-colors">Blog</Link>
            <Link href="/about" className="hover:text-charcoal transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {userState === "anonymous" ? (
              <button onClick={() => setShowLogin(true)} className="text-sm px-4 py-2 rounded-lg bg-white hover:bg-cream-dark transition-colors">Sign In</button>
            ) : (
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${userState === "pro" ? "bg-amber-100 text-amber-700" : "bg-blue-soft/20 text-blue-soft-dark"}`}>
                  {userState === "pro" ? "Pro Plan" : "Free Plan"}
                </span>
                {userState !== "pro" && (
                  <button onClick={() => setShowUpgrade(true)} className="text-xs px-3 py-1.5 rounded-lg bg-orange text-white hover:bg-orange-hover transition-colors">Upgrade</button>
                )}
                <ProfileMenu
                  userEmail={userEmail}
                  userState={userState}
                  onSignOut={handleSignOut}
                  onUpgrade={() => setShowUpgrade(true)}
                  onManageSubscription={handleManageSubscription}
                  onDeleteAccount={() => setShowDeleteAccount(true)}
                />
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-cream border border-border-warm mb-8 overflow-x-auto">
          {[
            { id: "overview" as const, label: "Overview", icon: BarChart3 },
            { id: "reviews" as const, label: "Reviews", icon: MessageSquare },
            { id: "posts" as const, label: "Weekly Posts", icon: Calendar },
            { id: "competitors" as const, label: "Competitors", icon: Target },
            { id: "tools" as const, label: "Pro Tools", icon: Sparkles },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-white text-charcoal" : "text-gray-warm hover:text-gray-warm"}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* ========== OVERVIEW TAB ========== */}
        {activeTab === "overview" && searchStatus === "locked" && (
          <LockedTabMessage onUpgrade={() => setShowUpgrade(true)} isIndia={isIndia} />
        )}
        {activeTab === "overview" && searchStatus !== "locked" && (
          <div className="space-y-6">
            {/* Business Identity Header */}
            {liveSnapshot && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-serif text-xl font-bold text-charcoal">{liveSnapshot.name}</h1>
                  <p className="text-sm text-gray-warm mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />{liveSnapshot.address}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg bg-white border border-border-warm">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-sm">{liveSnapshot.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-warm">({liveSnapshot.reviewsCount} reviews)</span>
                </div>
              </div>
            )}

            {userState !== "pro" && liveSnapshot && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-soft/10 border border-blue-soft/25 text-sm text-blue-soft-dark">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>* Based on your latest {liveSnapshot.analysisReviewCount || 10} reviews. <button onClick={() => setShowUpgrade(true)} className="underline font-medium">Upgrade to Pro</button> for a comprehensive audit using up to 80 reviews.</span>
              </div>
            )}

            {/* Consolidated Insights Card */}
            <div className="rounded-2xl bg-white border border-border-warm shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Score Gauge */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="relative w-40 h-40">
                      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#E8DFD1" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#scoreGradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 100) * 264} 264`} />
                        <defs><linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#D4652A" /><stop offset="100%" stopColor="#F0A868" /></linearGradient></defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
                        <span className="text-xs text-gray-warm mt-1">Audit Score</span>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      {score >= 80 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />Excellent
                        </span>
                      ) : score >= 60 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <AlertCircle className="w-3 h-3" />Needs Improvement
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                          <AlertCircle className="w-3 h-3" />Critical
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats + Sentiment */}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-serif text-lg font-semibold mb-4">Profile Health Breakdown</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {[
                        { label: "Reviews", value: liveSnapshot ? String(liveSnapshot.reviewsCount) : "142", change: liveSnapshot ? "" : "+8", icon: MessageSquare },
                        { label: "Rating", value: liveSnapshot ? liveSnapshot.rating.toFixed(1) : "4.2", change: liveSnapshot ? "" : "+0.2", icon: Star },
                        { label: "Response Rate", value: "23%", change: "-12%", icon: Clock, negative: true },
                        { label: "Photos", value: liveSnapshot ? String(liveSnapshot.photoCount) : "12", change: liveSnapshot ? "" : "0", icon: Camera, neutral: true },
                      ].map((stat, i) => (
                        <div key={i} className="p-3 rounded-xl bg-cream border border-border-warm">
                          <div className="flex items-center gap-1.5 mb-2"><stat.icon className="w-3.5 h-3.5 text-gray-warm" /><span className="text-xs text-gray-warm">{stat.label}</span></div>
                          <div className="flex items-end gap-2">
                            <span className="text-xl font-bold">{stat.value}</span>
                            {stat.change && <span className={`text-xs mb-0.5 ${stat.negative ? "text-red-500" : stat.neutral ? "text-gray-warm" : "text-emerald-600"}`}>{stat.change}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Positive", pct: positivePct, color: "bg-emerald-500" },
                        { label: "Neutral", pct: neutralPct, color: "bg-blue-500" },
                        { label: "Negative", pct: negativePct, color: "bg-red-500" },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-warm w-16 shrink-0">{s.label}</span>
                          <div className="flex-1 h-2 rounded-full bg-cream overflow-hidden"><div className={`h-full rounded-full ${s.color} transition-all`} style={{ width: `${s.pct}%` }} /></div>
                          <span className="text-xs font-medium w-8 text-right">{s.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Action Items */}
              <div className="border-t border-border-warm p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="w-5 h-5 text-orange" />
                  <h3 className="font-semibold">AI Action Items — Prioritized by Impact</h3>
                </div>
                <div className="space-y-3">
                  {(liveActionItems.length > 0 ? liveActionItems : MOCK_ACTION_ITEMS).map((item) => (
                    <div key={item.id} className={`flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-xl bg-cream border-l-4 ${item.priority === "high" ? "border-l-red-400" : item.priority === "medium" ? "border-l-amber-400" : "border-l-blue-400"} border-y border-r border-border-warm`}>
                      <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-sm text-gray-warm mt-1 leading-relaxed">{item.description}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg font-medium">
                        <TrendingUp className="w-3 h-3" />{item.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly Pulse */}
            {userState === "pro" ? (
              <div className="rounded-2xl bg-blue-soft/10 border border-blue-soft/25 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <RefreshCw className={`w-5 h-5 text-blue-soft-dark ${refreshingAudit ? "animate-spin" : ""}`} />
                  <h3 className="font-semibold">Weekly Pulse</h3>
                  <div className="ml-auto flex items-center gap-3">
                    {weeklyPulse?.hasEnoughData && <span className="text-xs text-gray-warm">vs last audit</span>}
                    <button onClick={handleRefreshAudit} disabled={refreshingAudit}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white border border-border-warm hover:bg-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {refreshingAudit ? "Refreshing..." : "Refresh Audit"}
                    </button>
                  </div>
                </div>
                {!weeklyPulse?.hasEnoughData ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-warm">Not enough data yet — Weekly Pulse compares your audit to a previous one.</p>
                    <p className="text-xs text-gray-warm mt-1">Click "Refresh Audit" to run a new one and start tracking changes over time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { metric: "Reviews", current: weeklyPulse.current.reviewsCount, change: weeklyPulse.changes.reviewsCount, unit: "" },
                      { metric: "Rating", current: weeklyPulse.current.rating.toFixed(1), change: weeklyPulse.changes.rating, unit: "★" },
                      { metric: "Photos", current: weeklyPulse.current.photoCount, change: weeklyPulse.changes.photoCount, unit: "" },
                    ].map((c, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white border border-border-warm shadow-sm">
                        <div className="text-xs text-gray-warm mb-2">{c.metric}</div>
                        <div className="flex items-end gap-2"><span className="text-2xl font-bold">{c.current}{c.unit}</span></div>
                        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${c.change > 0 ? "text-emerald-600" : c.change < 0 ? "text-red-500" : "text-gray-warm"}`}>
                          {c.change > 0 ? <TrendingUp className="w-3 h-3" /> : c.change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {c.change > 0 ? "+" : ""}{c.change}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-border-warm shadow-sm p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-soft/15 flex items-center justify-center shrink-0"><RefreshCw className="w-6 h-6 text-blue-soft-dark" /></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal">Weekly Pulse</h3>
                  <p className="text-sm text-gray-warm mt-1">Track how your reviews, rating, and photos change over time — available once you link a business with Pro.</p>
                </div>
                <button onClick={() => setShowUpgrade(true)} className="shrink-0 px-4 py-2 rounded-lg bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors flex items-center gap-2">
                  <Lock className="w-4 h-4" />Unlock with Pro
                </button>
              </div>
            )}

            {/* Locked Competitor Teaser */}
            {userState !== "pro" && (
              <div className="rounded-2xl bg-white border border-orange/30 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-light flex items-center justify-center shrink-0"><Target className="w-6 h-6 text-orange" /></div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-charcoal">Competitor Intelligence</h3>
                    <p className="text-sm text-gray-warm mt-1">Add up to 3 competitors and see gap analysis, opportunities, and where you're losing customers.</p>
                  </div>
                  <button onClick={() => setShowUpgrade(true)} className="shrink-0 px-4 py-2 rounded-lg bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors flex items-center gap-2">
                    <Lock className="w-4 h-4" />Unlock with Pro
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== REVIEWS TAB ========== */}
        {activeTab === "reviews" && searchStatus === "locked" && <LockedTabMessage onUpgrade={() => setShowUpgrade(true)} isIndia={isIndia} />}
        {activeTab === "reviews" && searchStatus !== "locked" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Review Inbox</h2>
                <p className="text-sm text-gray-warm mt-1">{userState !== "pro" ? "Upgrade to Pro to see all reviews and AI-suggested replies" : "All your reviews with AI-suggested replies"}</p>
              </div>
              <div className="flex gap-2">
                {(["all", "positive", "negative", "neutral"] as const).map((f) => (
                  <button key={f} onClick={() => setReviewFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${reviewFilter === f ? "bg-white text-charcoal" : "text-gray-warm hover:text-gray-warm"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {(userState !== "pro" ? filteredReviews.slice(0, 1) : filteredReviews).map((review) => (
                <div key={review.id} className="rounded-2xl bg-white border border-border-warm shadow-sm p-5 hover:border-orange/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-light flex items-center justify-center text-sm font-bold text-orange">{review.author[0]}</div>
                      <div>
                        <div className="font-medium text-sm">{review.author}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-border-warm"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-warm">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium ${review.sentiment === "positive" ? "bg-emerald-100 text-emerald-700" : review.sentiment === "negative" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-700"}`}>
                      {review.sentiment}
                    </span>
                  </div>
                  <p className="text-sm text-gray-warm mt-3 leading-relaxed">{review.text}</p>
                  {userState !== "anonymous" && review.aiReply && (
                    <div className="mt-4 p-4 rounded-xl bg-blue-soft/10 border border-blue-soft/25">
                      <div className="flex items-center gap-2 mb-2"><Sparkles className="w-3.5 h-3.5 text-blue-soft-dark" /><span className="text-xs font-medium text-blue-soft-dark">AI-Suggested Reply</span></div>
                      <p className="text-sm text-gray-warm leading-relaxed">{review.aiReply}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => copyReviewReply(review.id, review.aiReply!)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange text-white text-xs font-medium hover:bg-orange-hover transition-colors">
                          {copiedReview === review.id ? (<><CheckCircle2 className="w-3.5 h-3.5" />Copied!</>) : (<><Copy className="w-3.5 h-3.5" />Copy This Reply</>)}
                        </button>
                        <button
                          onClick={() => "dbId" in review && handleRegenerateReply(review.id, (review as any).dbId, review.text, review.rating)}
                          disabled={!("dbId" in review) || regeneratingId === review.id}
                          className="px-3 py-1.5 rounded-lg bg-white border border-border-warm text-gray-warm text-xs hover:bg-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {regeneratingId === review.id ? "Regenerating..." : "Regenerate"}
                        </button>
                      </div>
                      {regenerateErrors[review.id] && <p className="text-xs text-red-500 mt-2">{regenerateErrors[review.id]}</p>}
                    </div>
                  )}
                  {userState === "pro" && !review.aiReply && "dbId" in review && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleRegenerateReply(review.id, (review as any).dbId, review.text, review.rating)}
                        disabled={regeneratingId === review.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-light text-orange text-xs font-medium hover:bg-orange/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <Sparkles className="w-3.5 h-3.5" />{regeneratingId === review.id ? "Generating..." : "Generate Reply"}
                      </button>
                      {regenerateErrors[review.id] && <p className="text-xs text-red-500 mt-2">{regenerateErrors[review.id]}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {userState === "pro" && liveReviews.length > 0 && (
              <div className="text-center">
                <p className="text-xs text-gray-warm mb-3">
                  Showing {liveReviews.length} of {liveSnapshot?.reviewsCount ?? liveReviews.length} reviews we've pulled in
                  {liveSnapshot && liveSnapshot.reviewsCount > 80 && (
                    <> — this business has {liveSnapshot.reviewsCount} total on Google; we track your most recent 80</>
                  )}
                </p>
                {liveReviews.length < 80 && liveSnapshot && liveReviews.length < liveSnapshot.reviewsCount && (
                  <button
                    onClick={handleLoadMoreReviews}
                    disabled={loadingMoreReviews}
                    className="px-5 py-2 rounded-lg bg-white border border-border-warm text-sm font-medium text-charcoal hover:bg-cream-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {loadingMoreReviews ? "Loading..." : "Load 10 more"}
                  </button>
                )}
                {loadMoreReviewsError && <p className="text-xs text-red-500 mt-2">{loadMoreReviewsError}</p>}
              </div>
            )}
            {userState !== "pro" && (
              <div className="rounded-2xl bg-white border border-border-warm shadow-sm p-8 text-center">
                <Lock className="w-8 h-8 text-gray-warm/40 mx-auto mb-3" />
                <p className="text-sm text-gray-warm">We analyze your {liveSnapshot?.analysisReviewCount || 10} most recent reviews. <button onClick={() => setShowUpgrade(true)} className="text-orange hover:underline">Upgrade to Pro</button> to see up to 80 reviews with AI replies.</p>
              </div>
            )}
          </div>
        )}

        {/* ========== POSTS TAB ========== */}
        {activeTab === "posts" && searchStatus === "locked" && <LockedTabMessage onUpgrade={() => setShowUpgrade(true)} isIndia={isIndia} />}
        {activeTab === "posts" && searchStatus !== "locked" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Weekly Posts</h2>
                <p className="text-sm text-gray-warm mt-1">{userState !== "pro" ? "Upgrade to Pro to see all post ideas and copy them to your GBP" : "AI-generated posts ready to copy to your Google Business Profile"}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {(userState !== "pro" ? postSource.slice(0, 1) : postSource).map((post) => (
                <div key={post.id} className="rounded-2xl bg-white border border-border-warm shadow-sm p-5 hover:border-orange/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${POST_TYPE_STYLE[post.type] || "bg-cream text-gray-warm"}`}>{post.type}</span>
                    <span className="text-xs text-gray-warm">{post.date}</span>
                  </div>
                  <h3 className="font-medium mb-2">{post.title}</h3>
                  <p className="text-sm text-gray-warm leading-relaxed mb-4">{post.content}</p>
                  {userState !== "anonymous" && (
                    <button onClick={() => copyPost(post.id, post.content)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream border border-border-warm text-xs text-charcoal hover:bg-cream-dark transition-colors">
                      {copiedPost === post.id ? (<><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />Copied!</>) : (<><Copy className="w-3.5 h-3.5" />Copy to GBP</>)}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {userState !== "pro" && postSource.length > 1 && (
              <div className="rounded-2xl bg-white border border-border-warm shadow-sm p-8 text-center">
                <Lock className="w-8 h-8 text-gray-warm/40 mx-auto mb-3" />
                <p className="text-sm text-gray-warm">Upgrade to Pro to see all {postSource.length} post ideas. <button onClick={() => setShowUpgrade(true)} className="text-orange hover:underline">Upgrade to Pro</button> to unlock and copy them all.</p>
              </div>
            )}
          </div>
        )}

        {/* ========== COMPETITORS TAB ========== */}
        {activeTab === "competitors" && searchStatus === "locked" && <LockedTabMessage onUpgrade={() => setShowUpgrade(true)} isIndia={isIndia} />}
        {activeTab === "competitors" && searchStatus !== "locked" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Competitor Intelligence</h2>
                <p className="text-sm text-gray-warm mt-1">{userState === "pro" ? `Track ${competitors.length} of 2 competitors` : "Upgrade to Pro to unlock competitor gap analysis"}</p>
              </div>
              {userState === "pro" && competitors.length < 2 && (
                <button onClick={handleAddCompetitor} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors">
                  <Plus className="w-4 h-4" />Add Competitor
                </button>
              )}
            </div>

            {userState !== "pro" ? (
              <div className="rounded-2xl bg-white border border-orange/30 shadow-sm p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-light flex items-center justify-center mx-auto mb-4"><Target className="w-8 h-8 text-orange" /></div>
                <h3 className="text-lg font-semibold mb-2">Competitor Analysis Locked</h3>
                <p className="text-sm text-gray-warm max-w-md mx-auto mb-6">See how you stack up against competitors. Discover gaps, opportunities, and exactly where you're losing customers.</p>
                <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                  {["Side-by-side score comparison", "Review & rating gap analysis", "Opportunity recommendations"].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-cream border border-border-warm text-xs text-gray-warm flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange shrink-0" />{item}
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowUpgrade(true)} className="px-6 py-2.5 rounded-xl bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors">Upgrade to Pro — {isIndia ? "₹699" : "$9"}/mo</button>
              </div>
            ) : competitors.length === 0 ? (
              <div className="rounded-2xl bg-white border border-border-warm shadow-sm p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-cream flex items-center justify-center mx-auto mb-4"><Target className="w-8 h-8 text-gray-warm/50" /></div>
                <h3 className="text-lg font-semibold mb-2">No Competitors Added</h3>
                <p className="text-sm text-gray-warm max-w-md mx-auto mb-6">Add up to 2 competitors to see gap analysis and opportunities.</p>
                <button onClick={handleAddCompetitor} className="px-6 py-2.5 rounded-xl bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />Add Your First Competitor
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Comparison Table */}
                <div className="rounded-2xl bg-white border border-border-warm shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-warm bg-cream">
                          <th className="text-left p-4 text-gray-warm font-medium">Metric</th>
                          <th className="text-center p-4 text-gray-warm font-medium">You</th>
                          {competitors.map((c) => (
                            <th key={c.id} className="text-center p-4 text-gray-warm font-medium">{c.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Audit Score", key: "score", mine: score, unit: "" },
                          { label: "Reviews", key: "reviewsCount", mine: liveSnapshot?.reviewsCount ?? 0, unit: "" },
                          { label: "Rating", key: "rating", mine: liveSnapshot?.rating.toFixed(1) ?? "0", unit: "★" },
                          { label: "Photos", key: "photoCount", mine: liveSnapshot?.photoCount ?? 0, unit: "" },
                        ].map((row) => (
                          <tr key={row.key} className="border-b border-border-warm last:border-0">
                            <td className="p-4 text-gray-warm">{row.label}</td>
                            <td className="p-4 text-center font-medium">{row.mine}{row.unit}</td>
                            {competitors.map((c) => {
                              const compVal = c[row.key as keyof Competitor] as number;
                              const mineNum = Number(row.mine);
                              return (
                                <td key={c.id} className="p-4 text-center">
                                  <span className={`font-medium ${compVal > mineNum ? "text-red-500" : compVal < mineNum ? "text-emerald-600" : "text-charcoal"}`}>
                                    {compVal}{row.unit}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Gap Analysis */}
                <div className="rounded-2xl bg-white border border-border-warm shadow-sm p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-orange" />Gap Analysis & Opportunities</h3>
                  <div className="space-y-4">
                    {competitors.map((comp) => (
                      <div key={comp.id} className="p-4 rounded-xl bg-cream border border-border-warm">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-sm">{comp.name}</span>
                          <button onClick={() => requestRemoveCompetitor(comp.id, comp.name)} className="text-gray-warm/50 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-2">
                          {comp.gapInsights.length === 0 ? (
                            <p className="text-sm text-gray-warm">No insights generated yet.</p>
                          ) : comp.gapInsights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-warm">
                              {insight.type === "gap" ? <TrendingDown className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> : <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                              <span>{insight.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== TOOLS TAB ========== */}
        {activeTab === "tools" && searchStatus === "locked" && <LockedTabMessage onUpgrade={() => setShowUpgrade(true)} isIndia={isIndia} />}
        {activeTab === "tools" && searchStatus !== "locked" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Pro Tools</h2>
              <p className="text-sm text-gray-warm mt-1">
                {userState === "pro" ? "All tools unlocked. Optimize every aspect of your Google presence." : "Upgrade to Pro to unlock all 6 tools. Preview available below."}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRO_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isLocked = userState !== "pro";
                return (
                  <div key={tool.id} className={`rounded-2xl border p-5 relative overflow-hidden transition-all ${
                    isLocked ? "bg-white border-border-warm shadow-sm" : "bg-white border-border-warm shadow-sm hover:border-orange/30 hover:shadow-md"
                  }`}>
                    {isLocked && (
                      <div className="absolute inset-0 backdrop-blur-[2px] bg-white/70 flex flex-col items-center justify-center z-10">
                        <Lock className="w-6 h-6 text-gray-warm mb-2" />
                        <span className="text-xs text-gray-warm font-medium">Pro Only</span>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLocked ? "bg-cream" : tool.iconBg}`}>
                        <Icon className={`w-5 h-5 ${isLocked ? "text-gray-warm/40" : tool.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-medium text-sm ${isLocked ? "text-gray-warm" : "text-charcoal"}`}>{tool.name}</h3>
                        <p className={`text-xs mt-1 leading-relaxed ${isLocked ? "text-gray-warm/60" : "text-gray-warm"}`}>{tool.description}</p>
                      </div>
                    </div>
                    {!isLocked && (
                      <button onClick={() => setOpenTool(tool.id)} className="mt-4 w-full py-2 rounded-lg bg-orange-light text-orange text-xs font-medium hover:bg-orange/20 transition-colors">
                        Open Tool
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {userState !== "pro" && (
              <div className="rounded-2xl bg-gradient-to-br from-orange-light to-orange-light border border-orange/20 p-6 text-center">
                <h3 className="font-semibold mb-2">Unlock All Pro Tools</h3>
                <p className="text-sm text-gray-warm mb-4">Get the full suite of AI-powered tools for just {isIndia ? "₹699" : "$9"}/month.</p>
                <button onClick={() => setShowUpgrade(true)} className="px-6 py-2.5 rounded-xl bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors">Upgrade to Pro</button>
              </div>
            )}
          </div>
        )}
      </div>

      <SiteFooter onGoToSection={goToMarketingSection} />

      {openTool && liveSnapshot?.businessId && (
        <ToolDrawer toolId={openTool} onClose={() => setOpenTool(null)} businessId={liveSnapshot.businessId} businessName={liveSnapshot.name} />
      )}

      {/* ========== MODALS ========== */}
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} pendingBusinessName={businessName} pendingLocation={location} />
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} onUpgrade={handleUpgrade} loading={checkoutLoading} error={checkoutError}
          isIndia={isIndia} waitlistEmail={waitlistEmail} setWaitlistEmail={setWaitlistEmail} onJoinWaitlist={handleJoinWaitlist}
          waitlistLoading={waitlistLoading} waitlistError={waitlistError} waitlistSubmitted={waitlistSubmitted} />
      <AuditLimitModal open={showAuditLimit} onClose={() => setShowAuditLimit(false)} onLogin={() => { setShowAuditLimit(false); setShowLogin(true); }} />
      <BusinessLimitModal open={showBusinessLimit} onClose={() => setShowBusinessLimit(false)} />
      <FinalChangeModal open={showFinalChange} onClose={() => setShowFinalChange(false)} onConfirm={confirmChangeBusiness} />
      <AlreadyChangedModal open={showAlreadyChanged} onClose={() => setShowAlreadyChanged(false)} />
      <AddCompetitorModal open={showAddCompetitor} onClose={() => setShowAddCompetitor(false)} onSearch={searchCompetitor} onConfirm={confirmAddCompetitor}
        compSearchName={compSearchName} setCompSearchName={setCompSearchName} compSearchLoc={compSearchLoc} setCompSearchLoc={setCompSearchLoc}
        status={compSearchStatus} matches={compMatches} error={compError} />
      <CompetitorUpgradeModal open={showCompetitorUpgrade} onClose={() => setShowCompetitorUpgrade(false)} onUpgrade={handleUpgrade} loading={checkoutLoading} error={checkoutError} isIndia={isIndia} onShowFullUpgrade={() => { setShowCompetitorUpgrade(false); setShowUpgrade(true); }} />
      <RemoveCompetitorModal
        open={!!confirmRemoveCompetitor}
        name={confirmRemoveCompetitor?.name ?? ""}
        message={confirmRemoveCompetitor?.message ?? ""}
        onClose={() => setConfirmRemoveCompetitor(null)}
        onConfirm={doRemoveCompetitor}
      />
      <ManageSubscriptionModal open={showManageSubscription} onClose={() => { setShowManageSubscription(false); setCancelSubSuccess(false); setCancelSubError(null); }}
        onCancel={handleCancelSubscription} cancelling={cancelSubLoading} cancelError={cancelSubError} cancelSuccess={cancelSubSuccess} />
      <DeleteAccountModal open={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} onConfirm={handleDeleteAccount} deleting={deletingAccount} error={deleteAccountError} />
    </div>
  );
}

/* ================================================================
   MODAL COMPONENTS
   ================================================================ */

/* ================================================================
   HOW IT WORKS — image marquee (placeholder screenshots, swap every 3s)
   Drop the two report screenshots into /public as how-it-works-1.png
   and how-it-works-2.png — replace with the final audit/report pages
   once those redesigns are locked.
   ================================================================ */
/* ================================================================
   SEARCHING PROGRESS — cycling steps so the wait feels active
   ================================================================ */
function SearchingProgress() {
  const steps = ["Searching Google Maps...", "Comparing nearby listings...", "Almost there..."];
  const [step, setStep] = useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center py-16">
      <div className="relative w-16 h-16 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-orange-light" />
        <div className="absolute inset-0 rounded-full border-4 border-orange border-t-transparent animate-spin" />
        <Search className="w-6 h-6 text-orange absolute inset-0 m-auto" />
      </div>
      <p className="text-charcoal font-medium transition-all">{steps[step]}</p>
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? "w-6 bg-orange" : "w-1.5 bg-border-warm"}`} />
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   LOCKED TAB — shown across every tab once free credits are used up,
   so the experience is consistent instead of only Overview knowing
   about it while other tabs kept showing stale/mock data.
   ================================================================ */
function ToolDrawer({ toolId, onClose, businessId, businessName }: { toolId: string; onClose: () => void; businessId: string; businessName: string }) {
  const TOOL_META: Record<string, { name: string; icon: any }> = {
    description: { name: "Description Writer", icon: FileText },
    nap: { name: "NAP Checker", icon: MapPin },
    keywords: { name: "Keyword Finder", icon: KeyRound },
    qa: { name: "Q&A Generator", icon: HelpCircle },
    posts: { name: "Post Generator", icon: Sparkles },
    photos: { name: "Photo Strategy", icon: ImageIcon },
  };
  const meta = TOOL_META[toolId];

  // Description Writer state
  const [differentiators, setDifferentiators] = useState("");
  const [tone, setTone] = useState("Professional");
  const [highlights, setHighlights] = useState("");
  const [descOptions, setDescOptions] = useState<string[]>([]);
  const [descLoading, setDescLoading] = useState(false);
  const [descError, setDescError] = useState<string | null>(null);
  const [copiedDesc, setCopiedDesc] = useState<number | null>(null);

  const generateDescriptions = async () => {
    setDescLoading(true);
    setDescError(null);
    try {
      const res = await fetch("/api/tools/description-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, differentiators, tone, highlights }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("description-writer error:", data);
        setDescError(
          data.error === "monthly_limit_reached" ? "You've reached this month's limit for Description Writer (20 generations). Resets next month." :
          data.error === "pro_only" ? "Your account isn't actually Pro in the database yet — the 'Upgrade to Pro' button only changes what's shown on screen right now, not your real plan." :
          "Something went wrong generating descriptions."
        );
        return;
      }
      setDescOptions(data.options ?? []);
    } catch {
      setDescError("Something went wrong generating descriptions.");
    } finally {
      setDescLoading(false);
    }
  };

  const copyDesc = (i: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDesc(i);
    setTimeout(() => setCopiedDesc(null), 2000);
  };

  // Keyword Finder state
  const [kwData, setKwData] = useState<{ likelySearches: { phrase: string; relevance: string }[]; fromReviews: string[] } | null>(null);
  const [kwLoading, setKwLoading] = useState(false);
  const [kwError, setKwError] = useState<string | null>(null);

  const findKeywords = async () => {
    setKwLoading(true);
    setKwError(null);
    try {
      const res = await fetch("/api/tools/keyword-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("keyword-finder error:", data);
        setKwError(
          data.error === "monthly_limit_reached" ? "You've reached this month's limit for Keyword Finder (20 generations). Resets next month." :
          data.error === "pro_only" ? "Your account isn't actually Pro in the database yet — the 'Upgrade to Pro' button only changes what's shown on screen right now, not your real plan." :
          "Something went wrong finding keywords."
        );
        return;
      }
      setKwData(data);
    } catch {
      setKwError("Something went wrong finding keywords.");
    } finally {
      setKwLoading(false);
    }
  };

  // NAP Checker state
  const [napData, setNapData] = useState<{ canonical: { name: string; address: string; phone: string }; checklist: { platform: string; tip: string }[] } | null>(null);
  const [napLoading, setNapLoading] = useState(false);
  const [napError, setNapError] = useState<string | null>(null);
  const [copiedNap, setCopiedNap] = useState(false);

  const checkNap = async () => {
    setNapLoading(true);
    setNapError(null);
    try {
      const res = await fetch("/api/tools/nap-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("nap-checker error:", data);
        setNapError(
          data.error === "monthly_limit_reached" ? "You've reached this month's limit for NAP Checker (20 generations). Resets next month." :
          data.error === "pro_only" ? "Your account isn't actually Pro in the database yet — the 'Upgrade to Pro' button only changes what's shown on screen right now, not your real plan." :
          "Something went wrong checking NAP consistency."
        );
        return;
      }
      setNapData(data);
    } catch {
      setNapError("Something went wrong checking NAP consistency.");
    } finally {
      setNapLoading(false);
    }
  };

  const copyNap = () => {
    if (!napData) return;
    const text = `${napData.canonical.name}\n${napData.canonical.address}\n${napData.canonical.phone}`;
    navigator.clipboard.writeText(text);
    setCopiedNap(true);
    setTimeout(() => setCopiedNap(false), 2000);
  };

  // Q&A Generator state
  const [qaData, setQaData] = useState<{ question: string; answer: string }[] | null>(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);
  const [copiedQa, setCopiedQa] = useState<number | null>(null);

  const generateQas = async () => {
    setQaLoading(true);
    setQaError(null);
    try {
      const res = await fetch("/api/tools/qa-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("qa-generator error:", data);
        setQaError(
          data.error === "monthly_limit_reached" ? "You've reached this month's limit for Q&A Generator (20 generations). Resets next month." :
          data.error === "pro_only" ? "Your account isn't actually Pro in the database yet — the 'Upgrade to Pro' button only changes what's shown on screen right now, not your real plan." :
          "Something went wrong generating Q&As."
        );
        return;
      }
      setQaData(data.qas ?? []);
    } catch {
      setQaError("Something went wrong generating Q&As.");
    } finally {
      setQaLoading(false);
    }
  };

  const copyQa = (i: number, q: string, a: string) => {
    navigator.clipboard.writeText(`Q: ${q}\nA: ${a}`);
    setCopiedQa(i);
    setTimeout(() => setCopiedQa(null), 2000);
  };

  // Post Generator state
  const [postFocus, setPostFocus] = useState("");
  const [genPosts, setGenPosts] = useState<{ type: string; title: string; content: string }[] | null>(null);
  const [postGenLoading, setPostGenLoading] = useState(false);
  const [postGenError, setPostGenError] = useState<string | null>(null);
  const [copiedGenPost, setCopiedGenPost] = useState<number | null>(null);

  const generatePosts = async () => {
    setPostGenLoading(true);
    setPostGenError(null);
    try {
      const res = await fetch("/api/tools/post-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, focus: postFocus }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("post-generator error:", data);
        setPostGenError(
          data.error === "monthly_limit_reached" ? "You've reached this month's limit for Post Generator (20 generations). Resets next month." :
          data.error === "pro_only" ? "Your account isn't actually Pro in the database yet — the 'Upgrade to Pro' button only changes what's shown on screen right now, not your real plan." :
          "Something went wrong generating posts."
        );
        return;
      }
      setGenPosts(data.posts ?? []);
    } catch {
      setPostGenError("Something went wrong generating posts.");
    } finally {
      setPostGenLoading(false);
    }
  };

  const copyGenPost = (i: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedGenPost(i);
    setTimeout(() => setCopiedGenPost(null), 2000);
  };

  // Photo Strategy state
  const [photoData, setPhotoData] = useState<{ category: string; why: string }[] | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const getPhotoStrategy = async () => {
    setPhotoLoading(true);
    setPhotoError(null);
    try {
      const res = await fetch("/api/tools/photo-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("photo-strategy error:", data);
        setPhotoError(
          data.error === "monthly_limit_reached" ? "You've reached this month's limit for Photo Strategy (20 generations). Resets next month." :
          data.error === "pro_only" ? "Your account isn't actually Pro in the database yet — the 'Upgrade to Pro' button only changes what's shown on screen right now, not your real plan." :
          "Something went wrong getting photo recommendations."
        );
        return;
      }
      setPhotoData(data.recommendations ?? []);
    } catch {
      setPhotoError("Something went wrong getting photo recommendations.");
    } finally {
      setPhotoLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-charcoal/40" onClick={onClose} />
      <div className="relative w-full sm:w-[65%] max-w-2xl h-full bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border-warm px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            {meta && <meta.icon className="w-5 h-5 text-orange" />}
            <h2 className="font-serif text-lg font-semibold">{meta?.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream transition-colors"><X className="w-5 h-5 text-gray-warm" /></button>
        </div>

        <div className="p-6">
          {toolId === "description" && (
            <div>
              <p className="text-sm text-gray-warm mb-5">Three quick questions, then pick from a couple of full-length options. Google allows up to 750 characters — only the first 250 show before "Read more," so we lead with your strongest hook.</p>
              <label className="text-sm font-medium block mb-1.5">What makes your business different</label>
              <textarea rows={2} value={differentiators} onChange={(e) => setDifferentiators(e.target.value)} placeholder="Family-owned since 2015, we source local ingredients daily"
                className="w-full mb-3.5 px-3 py-2.5 rounded-lg bg-cream border border-border-warm text-sm outline-none focus:border-orange/50 resize-none" />
              <label className="text-sm font-medium block mb-1.5">Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full mb-3.5 px-3 py-2.5 rounded-lg bg-cream border border-border-warm text-sm outline-none focus:border-orange/50">
                <option>Professional</option><option>Friendly</option><option>Playful</option>
              </select>
              <label className="text-sm font-medium block mb-1.5">Anything to highlight</label>
              <input type="text" value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder="Free delivery, extended weekend hours"
                className="w-full mb-4 px-3 py-2.5 rounded-lg bg-cream border border-border-warm text-sm outline-none focus:border-orange/50" />
              <button onClick={generateDescriptions} disabled={descLoading}
                className="w-full py-3 rounded-xl bg-orange text-white font-medium text-sm hover:bg-orange-hover transition-colors disabled:opacity-50">
                {descLoading ? "Generating..." : "Generate descriptions"}
              </button>
              {descError && <p className="text-sm text-red-500 mt-3">{descError}</p>}
              {descOptions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border-warm space-y-3">
                  <p className="text-xs text-gray-warm">{descOptions.length} options — pick one to use</p>
                  {descOptions.map((opt, i) => (
                    <div key={i} className="p-4 rounded-xl bg-cream border border-border-warm">
                      <p className="text-sm leading-relaxed mb-3">{opt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-warm">{opt.length} characters</span>
                        <button onClick={() => copyDesc(i, opt)} className="px-3 py-1.5 rounded-lg bg-white border border-border-warm text-xs font-medium hover:bg-cream-dark transition-colors">
                          {copiedDesc === i ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {toolId === "keywords" && (
            <div>
              {!kwData && !kwLoading && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-warm mb-5">Find likely search phrases for {businessName}, based on your profile and real customer reviews.</p>
                  <button onClick={findKeywords} className="px-6 py-2.5 rounded-xl bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors">Find keywords</button>
                  {kwError && <p className="text-sm text-red-500 mt-3">{kwError}</p>}
                </div>
              )}
              {kwLoading && <div className="text-center py-12"><RefreshCw className="w-6 h-6 text-orange animate-spin mx-auto" /></div>}
              {kwData && (
                <div>
                  <p className="text-xs text-gray-warm mb-4">Estimated from your profile and reviews, not live search volume data.</p>
                  <p className="text-xs font-medium text-gray-warm mb-2">What customers likely search</p>
                  <div className="space-y-1.5 mb-5">
                    {kwData.likelySearches.map((k, i) => (
                      <div key={i} className="flex items-center justify-between bg-cream px-3 py-2.5 rounded-lg">
                        <span className="text-sm">{k.phrase}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-md ${k.relevance === "high" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{k.relevance === "high" ? "High" : "Medium"}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-medium text-gray-warm mb-2">Real phrases from your reviews</p>
                  <div className="flex flex-wrap gap-1.5">
                    {kwData.fromReviews.map((p, i) => (
                      <span key={i} className="text-xs bg-cream px-2.5 py-1.5 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {toolId === "nap" && (
            <div>
              {!napData && !napLoading && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-warm mb-5">Pull your canonical Name, Address, and Phone straight from Google Business Profile, plus a consistency checklist for Facebook, Bing Places, and Yelp.</p>
                  <button onClick={checkNap} className="px-6 py-2.5 rounded-xl bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors">Check NAP consistency</button>
                  {napError && <p className="text-sm text-red-500 mt-3">{napError}</p>}
                </div>
              )}
              {napLoading && <div className="text-center py-12"><RefreshCw className="w-6 h-6 text-orange animate-spin mx-auto" /></div>}
              {napData && (
                <div>
                  <p className="text-xs font-medium text-gray-warm mb-2">Canonical NAP — use this exact version everywhere</p>
                  <div className="p-4 rounded-xl bg-cream border border-border-warm mb-3">
                    <p className="text-sm font-medium">{napData.canonical.name}</p>
                    <p className="text-sm text-gray-warm mt-1">{napData.canonical.address || "No address on file"}</p>
                    <p className="text-sm text-gray-warm mt-1">{napData.canonical.phone || "No phone listed on Google Business Profile"}</p>
                    <button onClick={copyNap} className="mt-3 px-3 py-1.5 rounded-lg bg-white border border-border-warm text-xs font-medium hover:bg-cream-dark transition-colors">
                      {copiedNap ? "Copied!" : "Copy NAP block"}
                    </button>
                  </div>
                  <p className="text-xs font-medium text-gray-warm mb-2">Consistency checklist</p>
                  <div className="space-y-2">
                    {napData.checklist.map((item, i) => (
                      <div key={i} className="p-3 rounded-xl bg-cream border border-border-warm">
                        <p className="text-xs font-semibold text-charcoal mb-1">{item.platform}</p>
                        <p className="text-sm text-gray-warm">{item.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {toolId === "qa" && (
            <div>
              {!qaData && !qaLoading && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-warm mb-5">Generate realistic customer questions for {businessName}'s Q&A section, with draft answers based on your real reviews.</p>
                  <button onClick={generateQas} className="px-6 py-2.5 rounded-xl bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors">Generate Q&As</button>
                  {qaError && <p className="text-sm text-red-500 mt-3">{qaError}</p>}
                </div>
              )}
              {qaLoading && <div className="text-center py-12"><RefreshCw className="w-6 h-6 text-orange animate-spin mx-auto" /></div>}
              {qaData && (
                <div>
                  <p className="text-xs text-gray-warm mb-4">Review before posting — anything in brackets is a placeholder we couldn't infer from your reviews.</p>
                  <div className="space-y-3">
                    {qaData.map((qa, i) => (
                      <div key={i} className="p-4 rounded-xl bg-cream border border-border-warm">
                        <p className="text-sm font-medium mb-1.5">{qa.question}</p>
                        <p className="text-sm text-gray-warm leading-relaxed mb-3">{qa.answer}</p>
                        <button onClick={() => copyQa(i, qa.question, qa.answer)} className="px-3 py-1.5 rounded-lg bg-white border border-border-warm text-xs font-medium hover:bg-cream-dark transition-colors">
                          {copiedQa === i ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {toolId === "posts" && (
            <div>
              <p className="text-sm text-gray-warm mb-4">Generate fresh post ideas any time — not just the 4 from your last audit.</p>
              <label className="text-sm font-medium block mb-1.5">What's this post about? (optional)</label>
              <input type="text" value={postFocus} onChange={(e) => setPostFocus(e.target.value)} placeholder="Leave blank to let AI pick something from your reviews"
                className="w-full mb-4 px-3 py-2.5 rounded-lg bg-cream border border-border-warm text-sm outline-none focus:border-orange/50" />
              <button onClick={generatePosts} disabled={postGenLoading}
                className="w-full py-3 rounded-xl bg-orange text-white font-medium text-sm hover:bg-orange-hover transition-colors disabled:opacity-50">
                {postGenLoading ? "Generating..." : "Generate posts"}
              </button>
              {postGenError && <p className="text-sm text-red-500 mt-3">{postGenError}</p>}
              {genPosts && genPosts.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border-warm space-y-3">
                  {genPosts.map((post, i) => (
                    <div key={i} className="p-4 rounded-xl bg-cream border border-border-warm">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${POST_TYPE_STYLE[post.type] || "bg-white text-gray-warm"}`}>{post.type}</span>
                      </div>
                      <p className="text-sm font-medium mb-1">{post.title}</p>
                      <p className="text-sm text-gray-warm leading-relaxed mb-3">{post.content}</p>
                      <button onClick={() => copyGenPost(i, post.content)} className="px-3 py-1.5 rounded-lg bg-white border border-border-warm text-xs font-medium hover:bg-cream-dark transition-colors">
                        {copiedGenPost === i ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {toolId === "photos" && (
            <div>
              {!photoData && !photoLoading && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-warm mb-5">Get AI recommendations on what photos to add and why — this tool suggests categories and reasoning only, it doesn't generate images.</p>
                  <button onClick={getPhotoStrategy} className="px-6 py-2.5 rounded-xl bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors">Get photo recommendations</button>
                  {photoError && <p className="text-sm text-red-500 mt-3">{photoError}</p>}
                </div>
              )}
              {photoLoading && <div className="text-center py-12"><RefreshCw className="w-6 h-6 text-orange animate-spin mx-auto" /></div>}
              {photoData && (
                <div className="space-y-3">
                  {photoData.map((rec, i) => (
                    <div key={i} className="p-4 rounded-xl bg-cream border border-border-warm flex gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white border border-border-warm flex items-center justify-center shrink-0 text-xs font-bold text-orange">{i + 1}</div>
                      <div>
                        <p className="text-sm font-medium mb-1">{rec.category}</p>
                        <p className="text-sm text-gray-warm leading-relaxed">{rec.why}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LockedTabMessage({ onUpgrade, isIndia }: { onUpgrade: () => void; isIndia: boolean }) {
  return (
    <div className="rounded-2xl bg-white border border-orange/30 shadow-sm p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-light flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-orange" /></div>
      <h2 className="font-serif text-xl font-bold mb-2">You've used both free audits</h2>
      <p className="text-sm text-gray-warm max-w-md mx-auto mb-6">
        Upgrade to Pro to link a business permanently and unlock full access to reviews, posts, and competitor tracking.
      </p>
      <button onClick={onUpgrade} className="px-6 py-2.5 rounded-xl bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors">Upgrade to Pro — {isIndia ? "₹699" : "$9"}/mo</button>
    </div>
  );
}

function HowItWorksMarquee() {
  const slides = [
    { src: "/how-it-works-1.png", alt: "Audit score overview" },
    { src: "/how-it-works-2.png", alt: "Review inbox with AI-suggested replies" },
  ];
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % slides.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative rounded-2xl border border-border-warm bg-white p-3 shadow-sm">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-cream">
        {slides.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-3">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-orange" : "w-1.5 bg-border-warm"}`} aria-label={`Show slide ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   SITE FOOTER — shared between the public landing page and the
   dashboard. On the landing page, Product links are plain anchors
   (#features etc). From the dashboard, onGoToSection is passed so the
   same links open the marketing view and scroll to that section,
   without losing the active session or business data underneath.
   ================================================================ */
function SiteFooter({ onGoToSection }: { onGoToSection?: (anchorId: string) => void }) {
  const productLinks = [
    { label: "Demo", anchor: "video-demo" },
    { label: "Features", anchor: "features" },
    { label: "How It Works", anchor: "how-it-works" },
    { label: "Pricing", anchor: "pricing" },
    { label: "FAQ", anchor: "faq" },
  ];
  return (
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
              {productLinks.map((link) => (
                <li key={link.anchor}>
                  {onGoToSection ? (
                    <button onClick={() => onGoToSection(link.anchor)} className="hover:text-charcoal">{link.label}</button>
                  ) : (
                    <a href={`#${link.anchor}`} className="hover:text-charcoal">{link.label}</a>
                  )}
                </li>
              ))}
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
  );
}

function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-border-warm p-6 shadow-2xl">
        {title && <h3 className="font-serif text-lg font-semibold mb-4">{title}</h3>}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-warm hover:text-charcoal transition-colors"><X className="w-5 h-5" /></button>
        {children}
      </div>
    </div>
  );
}

function LoginModal({ open, onClose, pendingBusinessName, pendingLocation }: { open: boolean; onClose: () => void; pendingBusinessName?: string; pendingLocation?: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSendLink = async () => {
    if (!email.trim()) return;
    setStatus("sending");
    // Encode the pending search into the redirect target itself, so it
    // survives the round trip even if the email link opens in a brand
    // new tab (sessionStorage/localStorage wouldn't carry over there).
    let next = "/";
    if (pendingBusinessName?.trim() && pendingLocation?.trim()) {
      const params = new URLSearchParams({ resumeName: pendingBusinessName, resumeLoc: pendingLocation });
      next = `/?${params.toString()}`;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setStatus(error ? "error" : "sent");
  };

  return (
    <Modal open={open} onClose={onClose} title="Sign In / Create Account">
      {status === "sent" ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-orange-light flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-orange" />
          </div>
          <h3 className="font-serif text-lg font-semibold mb-2">You've got mail 📬</h3>
          <p className="text-sm text-gray-warm">We sent a sign-in link to <strong className="text-charcoal">{email}</strong> — open it on this device to jump straight back in. You can close this window.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-warm mb-5">Get unlimited audits, all reviews, weekly posts, and competitor tracking.</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cream border border-border-warm">
              <Mail className="w-5 h-5 text-gray-warm shrink-0" />
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
                className="w-full bg-transparent text-charcoal placeholder:text-gray-warm outline-none text-sm" />
            </div>
            {status === "error" && (
              <p className="text-xs text-red-500">Something went wrong sending the link. Try again.</p>
            )}
            <button onClick={handleSendLink} disabled={!email.trim() || status === "sending"}
              className="w-full py-3 rounded-xl bg-orange text-white font-medium text-sm hover:bg-orange-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {status === "sending" ? "Sending..." : "Send Sign-In Link"}
            </button>
            <p className="text-xs text-gray-warm text-center">No password needed. No credit card required.</p>
          </div>
        </>
      )}
    </Modal>
  );
}

function UpgradeModal({ open, onClose, onUpgrade, loading, error, isIndia, waitlistEmail, setWaitlistEmail, onJoinWaitlist, waitlistLoading, waitlistError, waitlistSubmitted }: {
  open: boolean; onClose: () => void; onUpgrade: () => void; loading: boolean; error: string | null;
  isIndia: boolean; waitlistEmail: string; setWaitlistEmail: (v: string) => void; onJoinWaitlist: (email: string) => void;
  waitlistLoading: boolean; waitlistError: string | null; waitlistSubmitted: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Upgrade to Pro">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-orange-light border border-orange/30">
          <div className="text-2xl font-bold">{isIndia ? "₹699" : "$9"}<span className="text-sm text-gray-warm font-normal">/month</span></div>
          <p className="text-sm text-gray-warm mt-1">Billed monthly. Cancel anytime.</p>
        </div>
        <ul className="space-y-2">
          {["Unlimited AI audits", "Competitor gap analysis (2 competitors)", "All 6 Pro Tools unlocked", "1 linked business", "Weekly pulse email reports", "Priority email support"].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-warm"><CheckCircle2 className="w-4 h-4 text-orange shrink-0" />{item}</li>
          ))}
        </ul>
        {isIndia ? (
          <>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button onClick={onUpgrade} disabled={loading} className="w-full py-3 rounded-xl bg-orange text-white font-medium text-sm hover:bg-orange-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Redirecting to checkout..." : "Upgrade Now — ₹699/mo"}
            </button>
          </>
        ) : waitlistSubmitted ? (
          <div className="text-center py-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm text-charcoal">You're on the list — we'll email you the moment international billing is live.</p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-warm mb-2">International billing is launching soon. Leave your email and we'll let you know the moment it's live.</p>
            <div className="flex gap-2">
              <input type="email" value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} placeholder="you@example.com"
                className="flex-1 px-3 py-2.5 rounded-lg bg-cream border border-border-warm text-sm outline-none focus:border-orange/50" />
              <button onClick={() => onJoinWaitlist(waitlistEmail)} disabled={waitlistLoading || !waitlistEmail.trim()}
                className="px-4 py-2.5 rounded-lg bg-orange text-white text-sm font-medium hover:bg-orange-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {waitlistLoading ? "..." : "Notify me"}
              </button>
            </div>
            {waitlistError && <p className="text-sm text-red-500 mt-2">{waitlistError}</p>}
          </div>
        )}
        <button onClick={onClose} className="w-full py-2 text-sm text-gray-warm hover:text-gray-warm transition-colors">Maybe later</button>
      </div>
    </Modal>
  );
}

function AuditLimitModal({ open, onClose, onLogin }: { open: boolean; onClose: () => void; onLogin: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Free Audits Used">
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-7 h-7 text-amber-600" /></div>
        <p className="text-gray-warm mb-1">You've used all 2 free audits.</p>
        <p className="text-sm text-gray-warm mb-5">Create a free account to get unlimited audits and unlock all features.</p>
        <button onClick={onLogin} className="w-full py-3 rounded-xl bg-orange text-white font-medium text-sm hover:bg-orange-hover transition-colors">Create Free Account</button>
        <button onClick={onClose} className="w-full py-2 mt-2 text-sm text-gray-warm hover:text-gray-warm transition-colors">Close</button>
      </div>
    </Modal>
  );
}

function BusinessLimitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Business Limit Reached">
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-7 h-7 text-red-500" /></div>
        <p className="text-gray-warm mb-1">You can associate with max 2 businesses only.</p>
        <p className="text-sm text-gray-warm mb-5">Please open a new account to track additional businesses.</p>
        <button onClick={onClose} className="w-full py-3 rounded-xl bg-white text-charcoal font-medium text-sm hover:bg-cream-dark transition-colors">Got it</button>
      </div>
    </Modal>
  );
}

function FinalChangeModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Final Change Warning">
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-7 h-7 text-amber-600" /></div>
        <p className="text-gray-warm mb-1">Changing your business is permanent.</p>
        <p className="text-sm text-gray-warm mb-5">You can only change each business slot once. This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white text-charcoal font-medium text-sm hover:bg-cream-dark transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors">Confirm Change</button>
        </div>
      </div>
    </Modal>
  );
}

function RemoveCompetitorModal({ open, name, message, onClose, onConfirm }: { open: boolean; name: string; message: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Remove Competitor">
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7 text-amber-600" /></div>
        <p className="text-gray-warm mb-1">Remove <strong className="text-charcoal">{name}</strong> from your tracked competitors?</p>
        <p className="text-sm text-gray-warm mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white text-charcoal font-medium text-sm hover:bg-cream-dark transition-colors border border-border-warm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors">Remove</button>
        </div>
      </div>
    </Modal>
  );
}

/* ================================================================
   PROFILE MENU — replaces the old dead landing-page icon (no click
   handler at all) and the old dashboard icon (signed the person out
   immediately on click, no menu, no visible "Logout" label). Now a
   real dropdown: email + plan, a subscription placeholder (real
   Stripe wiring comes later), and an explicit Log out action.
   ================================================================ */
function ProfileMenu({ userEmail, userState, onSignOut, onUpgrade, onManageSubscription, onDeleteAccount }: {
  userEmail: string | null;
  userState: UserState;
  onSignOut: () => void;
  onUpgrade: () => void;
  onManageSubscription: () => void;
  onDeleteAccount: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-cream-dark transition-colors"
        aria-label="Account menu"
      >
        <User className="w-4 h-4 text-gray-warm" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-white border border-border-warm shadow-lg z-50 overflow-hidden">
            {userEmail && (
              <div className="px-4 py-3 border-b border-border-warm">
                <p className="text-xs text-gray-warm truncate">{userEmail}</p>
                <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${userState === "pro" ? "bg-amber-100 text-amber-700" : "bg-blue-soft/20 text-blue-soft-dark"}`}>
                  {userState === "pro" ? "Pro Plan" : "Free Plan"}
                </span>
              </div>
            )}
            <button
              onClick={() => { setOpen(false); userState === "pro" ? onManageSubscription() : onUpgrade(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-orange" />
              {userState === "pro" ? "Manage Subscription" : "Upgrade to Pro"}
            </button>
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-cream transition-colors flex items-center gap-2 border-t border-border-warm"
            >
              <X className="w-4 h-4" />
              Log out
            </button>
            {userState === "pro" ? (
              <button
                onClick={() => { setOpen(false); onDeleteAccount(); }}
                className="w-full text-left px-4 py-2.5 text-xs text-gray-warm/70 hover:bg-cream hover:text-red-500 transition-colors flex items-center gap-2 border-t border-border-warm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete account
              </button>
            ) : (
              <a
                href="mailto:support@spotrise.app?subject=Delete%20my%20account"
                className="w-full text-left px-4 py-2.5 text-xs text-gray-warm/70 hover:bg-cream hover:text-charcoal transition-colors flex items-center gap-2 border-t border-border-warm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Request account deletion
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ManageSubscriptionModal({ open, onClose, onCancel, cancelling, cancelError, cancelSuccess }: {
  open: boolean; onClose: () => void; onCancel: () => void; cancelling: boolean; cancelError: string | null; cancelSuccess: boolean;
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    if (!open) setConfirmingCancel(false);
  }, [open]);

  if (cancelSuccess) {
    return (
      <Modal open={open} onClose={onClose} title="Subscription Cancelled">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></div>
          <p className="text-gray-warm mb-1">Your subscription is set to cancel.</p>
          <p className="text-sm text-gray-warm mb-5">You'll keep full Pro access until the end of your current billing period — no further charges after that.</p>
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-white text-charcoal font-medium text-sm hover:bg-cream-dark transition-colors border border-border-warm">Close</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage Subscription">
      <div className="py-2">
        <div className="p-4 rounded-xl bg-orange-light border border-orange/30 mb-5">
          <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-orange" /><span className="text-sm font-medium text-charcoal">You're on Pro — ₹699/month</span></div>
        </div>
        {!confirmingCancel ? (
          <button onClick={() => setConfirmingCancel(true)} className="w-full py-3 rounded-xl bg-white text-red-500 font-medium text-sm hover:bg-cream transition-colors border border-border-warm">
            Cancel Subscription
          </button>
        ) : (
          <div>
            <p className="text-sm text-gray-warm mb-1">Cancel your Pro subscription?</p>
            <p className="text-xs text-gray-warm mb-4">You'll keep access until the end of your current billing period, then your account moves to Free.</p>
            {cancelError && <p className="text-sm text-red-500 mb-3">{cancelError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setConfirmingCancel(false)} className="flex-1 py-3 rounded-xl bg-white text-charcoal font-medium text-sm hover:bg-cream-dark transition-colors border border-border-warm">Never mind</button>
              <button onClick={onCancel} disabled={cancelling} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        )}
        {!confirmingCancel && <button onClick={onClose} className="w-full py-2 mt-3 text-sm text-gray-warm hover:text-gray-warm transition-colors">Close</button>}
      </div>
    </Modal>
  );
}

function DeleteAccountModal({ open, onClose, onConfirm, deleting, error }: { open: boolean; onClose: () => void; onConfirm: () => void; deleting: boolean; error: string | null }) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!open) setConfirmText("");
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Delete Account">
      <div className="py-2">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-7 h-7 text-red-500" /></div>
        <p className="text-center text-gray-warm mb-1">This permanently deletes your account.</p>
        <p className="text-center text-sm text-gray-warm mb-5">Your linked business, all reviews and AI replies, posts, competitor tracking, and usage history will be permanently removed. This cannot be undone.</p>
        <label className="text-xs font-medium text-gray-warm block mb-1.5">Type DELETE to confirm</label>
        <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE"
          className="w-full mb-4 px-3 py-2.5 rounded-lg bg-cream border border-border-warm text-sm outline-none focus:border-red-400" />
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white text-charcoal font-medium text-sm hover:bg-cream-dark transition-colors border border-border-warm">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== "DELETE" || deleting}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {deleting ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AlreadyChangedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Change Not Allowed">
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Lock className="w-7 h-7 text-red-500" /></div>
        <p className="text-gray-warm mb-1">You've already changed this business.</p>
        <p className="text-sm text-gray-warm mb-5">Each slot can only be changed once. Please open a new account for additional businesses.</p>
        <button onClick={onClose} className="w-full py-3 rounded-xl bg-white text-charcoal font-medium text-sm hover:bg-cream-dark transition-colors">Got it</button>
      </div>
    </Modal>
  );
}

function AddCompetitorModal({ open, onClose, onSearch, onConfirm, compSearchName, setCompSearchName, compSearchLoc, setCompSearchLoc, status, matches, error }: {
  open: boolean; onClose: () => void; onSearch: () => void; onConfirm: (placeId: string, name: string) => void;
  compSearchName: string; setCompSearchName: (v: string) => void;
  compSearchLoc: string; setCompSearchLoc: (v: string) => void;
  status: "idle" | "searching" | "confirming" | "analyzing";
  matches: { placeId: string; name: string; address: string; rating: number | null; reviewCount: number }[];
  error: string | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Add Competitor">
      {status === "idle" && (
        <>
          <p className="text-sm text-gray-warm mb-4">Search for a competitor by name and city to add them to your gap analysis.</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cream border border-border-warm">
              <Search className="w-5 h-5 text-gray-warm shrink-0" />
              <input type="text" placeholder="Competitor name" value={compSearchName} onChange={(e) => setCompSearchName(e.target.value)} className="w-full bg-transparent text-charcoal placeholder:text-gray-warm outline-none text-sm" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cream border border-border-warm">
              <MapPin className="w-5 h-5 text-gray-warm shrink-0" />
              <input type="text" placeholder="City" value={compSearchLoc} onChange={(e) => setCompSearchLoc(e.target.value)} className="w-full bg-transparent text-charcoal placeholder:text-gray-warm outline-none text-sm" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button onClick={onSearch} disabled={!compSearchName.trim() || !compSearchLoc.trim()} className="w-full py-3 rounded-xl bg-orange text-white font-medium text-sm hover:bg-orange-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Search</button>
          </div>
        </>
      )}

      {status === "searching" && (
        <div className="text-center py-10">
          <RefreshCw className="w-7 h-7 text-orange animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-warm">Searching nearby businesses...</p>
        </div>
      )}

      {status === "confirming" && (
        <>
          <p className="text-sm text-gray-warm mb-4">Found {matches.length} match{matches.length !== 1 ? "es" : ""} — which one is it?</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {matches.map((m) => (
              <button key={m.placeId} onClick={() => onConfirm(m.placeId, m.name)}
                className="w-full text-left p-3 rounded-xl bg-cream border border-border-warm hover:border-orange/40 transition-colors flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{m.name}</div>
                  <div className="text-xs text-gray-warm mt-0.5 truncate">{m.address}</div>
                  {m.rating && <div className="flex items-center gap-1 mt-1 text-xs text-gray-warm"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{m.rating} ({m.reviewCount})</div>}
                </div>
                <span className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-orange-light text-orange font-medium">Select</span>
              </button>
            ))}
            {matches.length === 0 && <p className="text-sm text-gray-warm text-center py-4">No matches found.</p>}
          </div>
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </>
      )}

      {status === "analyzing" && (
        <div className="text-center py-10">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-orange-light" />
            <div className="absolute inset-0 rounded-full border-4 border-orange border-t-transparent animate-spin" />
            <Target className="w-5 h-5 text-orange absolute inset-0 m-auto" />
          </div>
          <p className="text-sm font-medium text-charcoal">Analyzing their profile...</p>
          <p className="text-xs text-gray-warm mt-1">Comparing reviews, ratings, and finding real gaps</p>
        </div>
      )}
    </Modal>
  );
}

function CompetitorUpgradeModal({ open, onClose, onUpgrade, loading, error, isIndia, onShowFullUpgrade }: {
  open: boolean; onClose: () => void; onUpgrade: () => void; loading: boolean; error: string | null; isIndia: boolean; onShowFullUpgrade: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Competitor Analysis is Pro Only">
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><Target className="w-7 h-7 text-amber-600" /></div>
        <p className="text-gray-warm mb-1">Track up to 2 competitors with gap analysis.</p>
        <p className="text-sm text-gray-warm mb-5">See exactly where you are losing customers and what to fix first.</p>
        {isIndia ? (
          <>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <button onClick={onUpgrade} disabled={loading} className="w-full py-3 rounded-xl bg-orange text-white font-medium text-sm hover:bg-orange-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Redirecting to checkout..." : "Upgrade to Pro — ₹699/mo"}
            </button>
          </>
        ) : (
          <button onClick={onShowFullUpgrade} className="w-full py-3 rounded-xl bg-orange text-white font-medium text-sm hover:bg-orange-hover transition-colors">
            Join the international waitlist
          </button>
        )}
        <button onClick={onClose} className="w-full py-2 mt-2 text-sm text-gray-warm hover:text-gray-warm transition-colors">Maybe later</button>
      </div>
    </Modal>
  );
}