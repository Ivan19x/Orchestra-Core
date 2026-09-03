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
