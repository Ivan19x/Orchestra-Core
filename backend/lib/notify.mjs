import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Gmail SMTP (via an app password) delivers to ANY recipient on a free account,
// unlike Resend's shared onboarding@resend.dev sender which only reaches the
// Resend account owner until a custom domain is verified. So: prefer Gmail when
// the GMAIL_* env vars are set, fall back to Resend otherwise.
const gmailUser = process.env.GMAIL_USER;
const gmailTransport = (gmailUser && process.env.GMAIL_APP_PASSWORD)
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: process.env.GMAIL_APP_PASSWORD },
    })
  : null;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail(to, subject, html) {
  if (gmailTransport) {
    await gmailTransport.sendMail({ from: `Orchestra-Core <${gmailUser}>`, to, subject, html });
    return;
  }
  if (!resend) throw new Error('No email transport configured (set GMAIL_* or RESEND_API_KEY).');

  // The Resend SDK does NOT throw on API-level failures — it resolves with
  // { data, error }. Ignoring `error` would make every failed send silently
  // report success.
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: [to],
    subject,
    html,
  });
  if (error) {
    throw new Error(`Resend email failed: ${error.message || error.name || JSON.stringify(error)}`);
  }
}

// ── Password reset ─────────────────────────────────────────────────────────

export async function sendPasswordReset(email, link) {
  await sendEmail(email, 'Reset your Orchestra-Core password', resetEmailHtml(link));
}

// ── Purchase confirmation ──────────────────────────────────────────────────

export async function sendAccessConfirmation(email, licenseKey) {
  await sendEmail(email, 'Your Orchestra-Core access is live', confirmationEmailHtml(licenseKey));
}

// ── Templates ──────────────────────────────────────────────────────────────

const SHELL = inner => `
  <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px">
    <p style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#7A2330;margin-bottom:24px">Orchestra-Core</p>
    ${inner}
  </div>
`;

function resetEmailHtml(link) {
  return SHELL(`
    <h1 style="font-size:28px;color:#2B2320;margin:0 0 16px;font-weight:500">Reset your password</h1>
    <p style="color:#7A6C68;margin-bottom:28px">Click the button below to set a new password. This link expires in 10 minutes and can only be used once.</p>
    <a href="${link}" style="display:inline-block;padding:14px 28px;background:#7A2330;color:#fff;text-decoration:none;border-radius:100px;font-size:15px">Set a new password</a>
    <p style="font-size:13px;color:#A39590;margin-top:32px">If you didn't request this, you can safely ignore this email — your password won't change.</p>
  `);
}

function confirmationEmailHtml(licenseKey) {
  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
  return SHELL(`
    <h1 style="font-size:28px;color:#2B2320;margin:0 0 16px;font-weight:500">You're in. Welcome.</h1>
    <p style="color:#7A6C68;margin-bottom:24px">Your M-Pesa payment was confirmed and every lesson is now unlocked on your account. Sign in with your email and password any time — on any device.</p>
    <div style="background:#FBF1EE;border:1px solid #F0E0DD;border-radius:12px;padding:20px 24px;margin-bottom:32px">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#A39590;margin:0 0 8px">Your access key</p>
      <span style="font-size:16px;font-weight:600;letter-spacing:0.06em;color:#2B2320;font-family:monospace">${licenseKey}</span>
      <p style="font-size:12px;color:#A39590;margin:10px 0 0">Keep this as proof of purchase. You don't need it to sign in.</p>
    </div>
    <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;background:#7A2330;color:#fff;text-decoration:none;border-radius:100px;font-size:15px">Start reading</a>
    <p style="font-size:13px;color:#A39590;margin-top:32px">This was a one-time payment — no subscriptions, no renewals.</p>
  `);
}

// ── Consultant sessions ────────────────────────────────────────────────────

// Where operational mail (new applications, contact form) is sent. Falls back
// to the sending account so nothing is silently dropped if it is unset.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

// Sessions are sold and delivered in Kenya, so email always states EAT rather
// than whatever timezone the server happens to run in.
function formatEat(iso) {
  const d = new Date(new Date(iso).getTime() + EAT_OFFSET_MS);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}, ${hh}:${mm} EAT`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendBookingConfirmed(booking, consultant, learnerEmail) {
  const when = formatEat(booking.starts_at);
  const hours = booking.duration_minutes / 60;
  const where = booking.mode === 'in_person'
    ? `In person — ${escapeHtml(booking.location)}`
    : 'Online — your consultant will send a video link before the session';

  await sendEmail(
    learnerEmail,
    `Your session with ${consultant?.full_name ?? 'your consultant'} is booked`,
    SHELL(`
      <h1 style="font-size:28px;color:#2B2320;margin:0 0 16px;font-weight:500">Your session is booked.</h1>
      <p style="color:#7A6C68;margin-bottom:24px">Payment received. Here are the details — keep this email.</p>
      <div style="background:#FBF1EE;border:1px solid #F0E0DD;border-radius:12px;padding:20px 24px;margin-bottom:28px">
        <p style="margin:0 0 10px;color:#2B2320"><strong>${escapeHtml(consultant?.full_name ?? '')}</strong></p>
        <p style="margin:0 0 6px;color:#7A6C68">${when}</p>
        <p style="margin:0 0 6px;color:#7A6C68">${hours} hour${hours === 1 ? '' : 's'}</p>
        <p style="margin:0 0 6px;color:#7A6C68">${where}</p>
        <p style="margin:10px 0 0;color:#A39590;font-size:13px">
          Reference ${escapeHtml(booking.ref)}${booking.mpesa_receipt ? ` · M-Pesa ${escapeHtml(booking.mpesa_receipt)}` : ''}
        </p>
      </div>
      <p style="font-size:13px;color:#A39590">
        Sessions teach the Orchestra-Core curriculum. They are financial education, not personal
        financial advice, and your consultant will not recommend specific investments.
      </p>
    `),
  );
}

export async function sendApplicationReceived(email, fullName) {
  await sendEmail(
    email,
    'We have your application to teach with Orchestra-Core',
    SHELL(`
      <h1 style="font-size:28px;color:#2B2320;margin:0 0 16px;font-weight:500">Thanks, ${escapeHtml(fullName)}.</h1>
      <p style="color:#7A6C68;margin-bottom:20px">
        Your application to teach with Orchestra-Core is in. The next step is verification.
      </p>
      <p style="color:#7A6C68;margin-bottom:10px"><strong style="color:#2B2320">Please reply to this email with:</strong></p>
      <ul style="color:#7A6C68;padding-left:20px;margin:0 0 24px">
        <li style="margin-bottom:8px">A clear photo of your national ID</li>
        <li style="margin-bottom:8px">Your teaching or professional certificates</li>
        <li style="margin-bottom:8px">Any school or institution documents supporting your experience</li>
      </ul>
      <p style="color:#7A6C68;margin-bottom:24px">
        We review documents by hand, so give us a few days. We will write back either way.
      </p>
      <p style="font-size:13px;color:#A39590">
        Pay is set by Orchestra-Core — a monthly base plus a fee for each session you deliver. We
        will confirm your figures when you are approved.
      </p>
    `),
  );
}

export async function notifyNewApplication(application, applicantEmail) {
  if (!ADMIN_EMAIL) return;
  await sendEmail(
    ADMIN_EMAIL,
    `New consultant application: ${application.full_name}`,
    SHELL(`
      <h1 style="font-size:24px;color:#2B2320;margin:0 0 16px;font-weight:500">New application</h1>
      <p style="margin:0 0 6px;color:#7A6C68"><strong style="color:#2B2320">${escapeHtml(application.full_name)}</strong> — ${escapeHtml(applicantEmail)}</p>
      <p style="margin:0 0 6px;color:#7A6C68">Slug: ${escapeHtml(application.slug)}</p>
      <p style="margin:0 0 6px;color:#7A6C68">Experience: ${escapeHtml(application.experience_years ?? 'not stated')} years</p>
      <p style="margin:0 0 6px;color:#7A6C68">Modes: ${escapeHtml((application.session_modes || []).join(', '))}</p>
      <p style="margin:0 0 16px;color:#7A6C68">Area: ${escapeHtml(application.service_area ?? '—')}</p>
      <p style="margin:0 0 6px;color:#2B2320"><strong>Qualifications</strong></p>
      <p style="margin:0 0 16px;color:#7A6C68;white-space:pre-wrap">${escapeHtml(application.qualifications)}</p>
      <p style="margin:0 0 6px;color:#2B2320"><strong>Bio</strong></p>
      <p style="margin:0 0 20px;color:#7A6C68;white-space:pre-wrap">${escapeHtml(application.bio)}</p>
      <p style="font-size:13px;color:#A39590">
        Set their rate, session fee and monthly base in Supabase, then flip status to approved.
        See the note at the bottom of supabase-schema.sql.
      </p>
    `),
  );
}

export async function forwardContactMessage(message) {
  if (!ADMIN_EMAIL) return;
  await sendEmail(
    ADMIN_EMAIL,
    `Contact form: ${message.subject || 'no subject'}`,
    SHELL(`
      <h1 style="font-size:24px;color:#2B2320;margin:0 0 16px;font-weight:500">New message</h1>
      <p style="margin:0 0 6px;color:#7A6C68">
        From ${escapeHtml(message.name || 'someone')} — ${escapeHtml(message.email)}
        ${message.user_id ? ' (has an account)' : ''}
      </p>
      <p style="margin:0 0 20px;color:#7A6C68;white-space:pre-wrap">${escapeHtml(message.body)}</p>
      <p style="font-size:13px;color:#A39590">Reply straight to ${escapeHtml(message.email)}.</p>
    `),
  );
}

// Any change to a booking after it was paid for. One template, because the
// reader always wants the same three things: what happened, to which session,
// and what it means for their money.
export async function sendSessionUpdate({ to, booking, heading, body, consultantName }) {
  const refundLine = (booking.refund_amount_kes ?? 0) > 0 && booking.refund_status !== 'paid'
    ? `<p style="margin:0 0 6px;color:#2B2320"><strong>Refund due: KES ${booking.refund_amount_kes}</strong></p>
       <p style="margin:0 0 0;color:#7A6C68;font-size:13px">Sent back to the M-Pesa number you paid from, usually within a few working days.</p>`
    : '';

  await sendEmail(
    to,
    heading,
    SHELL(`
      <h1 style="font-size:26px;color:#2B2320;margin:0 0 16px;font-weight:500">${escapeHtml(heading)}</h1>
      <p style="color:#7A6C68;margin-bottom:24px">${escapeHtml(body)}</p>
      <div style="background:#FBF1EE;border:1px solid #F0E0DD;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <p style="margin:0 0 6px;color:#2B2320"><strong>${escapeHtml(consultantName ?? 'Your session')}</strong></p>
        <p style="margin:0 0 6px;color:#7A6C68">${formatEat(booking.starts_at)}</p>
        <p style="margin:0 0 10px;color:#A39590;font-size:13px">Reference ${escapeHtml(booking.ref)}</p>
        ${refundLine}
      </div>
      <p style="font-size:13px;color:#A39590">
        Think this is wrong? Reply to this email and a person will look at it.
      </p>
    `),
  );
}

export async function sendConsultantApproved(email, consultant) {
  await sendEmail(
    email,
    'You are approved to teach with Orchestra-Core',
    SHELL(`
      <h1 style="font-size:28px;color:#2B2320;margin:0 0 16px;font-weight:500">You are approved.</h1>
      <p style="color:#7A6C68;margin-bottom:24px">
        Your documents checked out and your profile is live. The next thing to do is set the days and
        times you are free — learners can only book inside those.
      </p>
      <div style="background:#FBF1EE;border:1px solid #F0E0DD;border-radius:12px;padding:20px 24px;margin-bottom:28px">
        <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#A39590;margin:0 0 10px">Your pay</p>
        <p style="margin:0 0 6px;color:#2B2320"><strong>KES ${consultant.session_fee_kes}</strong> for every session you deliver</p>
        <p style="margin:0 0 6px;color:#2B2320"><strong>KES ${consultant.monthly_base_kes}</strong> monthly base</p>
        <p style="margin:10px 0 0;color:#7A6C68;font-size:13px">
          Paid out monthly. Learners pay KES ${consultant.hourly_rate_kes} an hour, which Orchestra-Core
          sets so the price is the same whoever they book.
        </p>
      </div>
      <a href="${process.env.FRONTEND_URL}/teach/dashboard" style="display:inline-block;padding:14px 28px;background:#7A2330;color:#fff;text-decoration:none;border-radius:100px;font-size:15px">Set your availability</a>
      <p style="font-size:13px;color:#A39590;margin-top:32px">
        Sessions teach the Orchestra-Core curriculum. They are financial education — please do not give
        personal investment advice or recommend specific products.
      </p>
    `),
  );
}
