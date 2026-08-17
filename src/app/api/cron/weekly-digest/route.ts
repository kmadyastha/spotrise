import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Triggered by Vercel Cron every Monday (see vercel.json). Vercel signs
// these requests with CRON_SECRET automatically when it's set — this
// check stops anyone else from triggering a mass email blast by just
// hitting the URL directly.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const results: { businessId: string; status: string }[] = [];

  try {
    const { data: proProfiles } = await admin.from("profiles").select("id").eq("plan", "pro");
    if (!proProfiles || proProfiles.length === 0) {
      return NextResponse.json({ sent: 0, message: "No Pro users found" });
    }

    for (const profile of proProfiles) {
      try {
        const { data: business } = await admin
          .from("businesses")
          .select("id, name, user_id")
          .eq("user_id", profile.id)
          .eq("is_linked", true)
          .single();

        if (!business) continue;

        const { data: snapshots } = await admin
          .from("audit_snapshots")
          .select("id, score, reviews_count, rating, response_rate, scraped_at")
          .eq("business_id", business.id)
          .order("scraped_at", { ascending: false })
          .limit(2);

        if (!snapshots || snapshots.length === 0) continue;
        const [current, previous] = snapshots;

        const { data: actionItems } = await admin
          .from("action_items")
          .select("title, description, priority")
          .eq("audit_snapshot_id", current.id)
          .order("priority", { ascending: true })
          .limit(1);

        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentReviews } = await admin
          .from("reviews")
          .select("author, rating, text, ai_reply, review_date")
          .eq("business_id", business.id)
          .gte("review_date", weekAgo)
          .order("review_date", { ascending: false })
          .limit(3);

        const { data: { user } } = await admin.auth.admin.getUserById(business.user_id);
        if (!user?.email) continue;

        const scoreChange = previous ? current.score - previous.score : 0;
        const newReviewsCount = recentReviews?.length ?? 0;

        const html = buildDigestEmail({
          businessName: business.name,
          score: current.score,
          scoreChange,
          newReviewsCount,
          responseRate: current.response_rate,
          topAction: actionItems?.[0] ?? null,
          recentReviews: recentReviews ?? [],
        });

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "SpotRise Weekly <weekly@spotrise.app>",
            to: user.email,
            subject: `Your weekly SpotRise update — ${business.name}`,
            html,
          }),
        });

        results.push({ businessId: business.id, status: emailRes.ok ? "sent" : "failed" });
        if (!emailRes.ok) console.error("weekly-digest: Resend send failed:", await emailRes.text());
      } catch (err) {
        console.error(`weekly-digest: failed for profile ${profile.id}:`, err);
        results.push({ businessId: profile.id, status: "error" });
      }
    }

    return NextResponse.json({ sent: results.filter((r) => r.status === "sent").length, results });
  } catch (err) {
    console.error("weekly-digest failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}

function buildDigestEmail(data: {
  businessName: string;
  score: number;
  scoreChange: number;
  newReviewsCount: number;
  responseRate: number;
  topAction: { title: string; description: string; priority: string } | null;
  recentReviews: { author: string; rating: number; text: string; ai_reply: string | null }[];
}): string {
  const scoreColor = data.score >= 80 ? "#059669" : data.score >= 60 ? "#D97706" : "#DC2626";
  const changeText = data.scoreChange > 0 ? `+${data.scoreChange}` : `${data.scoreChange}`;
  const changeColor = data.scoreChange > 0 ? "#059669" : data.scoreChange < 0 ? "#DC2626" : "#8A8175";

  const reviewsHtml = data.recentReviews.length === 0
    ? `<p style="color:#8A8175;font-size:14px;margin:0;">No new reviews this week — a good week to focus on the action item above.</p>`
    : data.recentReviews.map((r) => `
        <div style="background:#F2EBE0;border-radius:12px;padding:16px;margin-bottom:12px;">
          <p style="margin:0 0 4px;font-weight:600;color:#1A1A1A;font-size:14px;">${escapeHtml(r.author)} — ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</p>
          <p style="margin:0 0 8px;color:#5A5347;font-size:14px;line-height:1.5;">${escapeHtml(r.text).slice(0, 200)}${r.text.length > 200 ? "…" : ""}</p>
          ${r.ai_reply ? `<p style="margin:0;color:#D4652A;font-size:13px;line-height:1.5;"><strong>Suggested reply:</strong> ${escapeHtml(r.ai_reply)}</p>` : ""}
        </div>`).join("");

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F2EBE0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2EBE0;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#FFFFFF;border-radius:20px;overflow:hidden;">
        <tr><td style="background:#1A1A1A;padding:28px 32px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:#D4652A;border-radius:8px;text-align:center;vertical-align:middle;color:#fff;font-size:18px;">⚡</td>
            <td style="padding-left:10px;color:#fff;font-size:20px;font-weight:700;">SpotRise</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 4px;color:#8A8175;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Weekly Update</p>
          <h1 style="margin:0 0 24px;color:#1A1A1A;font-size:22px;">${escapeHtml(data.businessName)}</h1>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:#F2EBE0;border-radius:12px;padding:16px;text-align:center;width:33%;">
                <p style="margin:0;font-size:24px;font-weight:700;color:${scoreColor};">${data.score}</p>
                <p style="margin:2px 0 0;font-size:11px;color:#8A8175;">Audit Score</p>
                <p style="margin:4px 0 0;font-size:12px;color:${changeColor};font-weight:600;">${changeText} vs last week</p>
              </td>
              <td style="width:8px;"></td>
              <td style="background:#F2EBE0;border-radius:12px;padding:16px;text-align:center;width:33%;">
                <p style="margin:0;font-size:24px;font-weight:700;color:#1A1A1A;">${data.newReviewsCount}</p>
                <p style="margin:2px 0 0;font-size:11px;color:#8A8175;">New Reviews</p>
              </td>
              <td style="width:8px;"></td>
              <td style="background:#F2EBE0;border-radius:12px;padding:16px;text-align:center;width:33%;">
                <p style="margin:0;font-size:24px;font-weight:700;color:#1A1A1A;">${Math.round(data.responseRate)}%</p>
                <p style="margin:2px 0 0;font-size:11px;color:#8A8175;">Response Rate</p>
              </td>
            </tr>
          </table>

          ${data.topAction ? `
          <div style="background:#FCEEE4;border-left:4px solid #D4652A;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#D4652A;text-transform:uppercase;letter-spacing:0.05em;">This week's top priority</p>
            <p style="margin:0 0 4px;font-weight:600;color:#1A1A1A;font-size:15px;">${escapeHtml(data.topAction.title)}</p>
            <p style="margin:0;color:#5A5347;font-size:14px;line-height:1.5;">${escapeHtml(data.topAction.description)}</p>
          </div>` : ""}

          <p style="margin:0 0 12px;font-weight:600;color:#1A1A1A;font-size:15px;">This week's reviews</p>
          ${reviewsHtml}

          <table cellpadding="0" cellspacing="0" style="margin-top:8px;">
            <tr><td style="background:#D4652A;border-radius:10px;">
              <a href="https://spotrise.app" style="display:inline-block;padding:12px 28px;color:#fff;text-decoration:none;font-weight:600;font-size:14px;">View Full Dashboard</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #E8DFD1;">
          <p style="margin:0;color:#8A8175;font-size:12px;">You're receiving this because you're on SpotRise Pro. Manage your subscription anytime from your dashboard.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}