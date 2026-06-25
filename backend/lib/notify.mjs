import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const resend = new Resend(process.env.RESEND_API_KEY);

// Gmail SMTP (via an app password) delivers to ANY recipient on the free tier,
// unlike Resend's shared onboarding@resend.dev sender which only reaches the
// account owner until a custom domain is verified. Prefer Gmail when the
// GMAIL_* env vars are set; otherwise fall back to Resend.
const gmailUser = process.env.GMAIL_USER;
const gmailTransport = (gmailUser && process.env.GMAIL_APP_PASSWORD)
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: process.env.GMAIL_APP_PASSWORD },
    })
  : null;

// ── SMS via Africa's Talking REST API ─────────────────────────────────────

export async function sendSms(phone, message) {
  const body = new URLSearchParams({
    username: process.env.AT_USERNAME,
    to: phone,
    message,
  });

  const atBase = process.env.AT_USERNAME === 'sandbox'
    ? 'https://api.sandbox.africastalking.com'
    : 'https://api.africastalking.com';
  const res = await fetch(`${atBase}/version1/messaging`, {
    method: 'POST',
    headers: {
      apiKey: process.env.AT_API_KEY,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Africa's Talking SMS error: ${text}`);
  }
}

// ── Email via Resend ───────────────────────────────────────────────────────

export async function sendEmail(to, subject, html) {
  if (gmailTransport) {
    await gmailTransport.sendMail({ from: `Orchestra-Core <${gmailUser}>`, to, subject, html });
    return;
  }
  // The Resend SDK does NOT throw on API-level failures (e.g. the shared
  // onboarding@resend.dev sender can only email the account's own address
  // until a custom domain is verified) - it resolves with { data, error }.
  // Ignoring `error` here meant every failed send silently reported success.
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

function resetEmailHtml(link) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px">
      <p style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#7A2330;margin-bottom:24px">Orchestra-Core</p>
      <h1 style="font-size:28px;color:#2B2320;margin:0 0 16px">Reset your password</h1>
      <p style="color:#7A6C68;margin-bottom:28px">Click the button below to set a new password. This link expires in 10 minutes and can only be used once.</p>
      <a href="${link}" style="display:inline-block;padding:14px 28px;background:#7A2330;color:#fff;text-decoration:none;border-radius:100px;font-size:15px">Set a new password</a>
      <p style="font-size:13px;color:#A39590;margin-top:32px">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    </div>
  `;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export async function sendOtp(identifier, code) {
  const isEmail = identifier.includes('@');
  const message = `Your Orchestra-Core verification code is: ${code}\n\nExpires in 10 minutes. Do not share this code.`;

  if (isEmail) {
    await sendEmail(identifier, 'Your Orchestra-Core verification code', otpEmailHtml(code));
  } else {
    await sendSms(identifier, message);
  }
}

export async function sendLicenseConfirmation(identifier, licenseKey) {
  const isEmail = identifier.includes('@');
  const message = `Welcome to Orchestra-Core!\n\nYour license key: ${licenseKey}\n\nDownload at: ${process.env.FRONTEND_URL}/download`;

  if (isEmail) {
    await sendEmail(
      identifier,
      'Welcome to Orchestra-Core — your license key',
      confirmationEmailHtml(licenseKey),
    );
  } else {
    await sendSms(identifier, message);
  }
}

function otpEmailHtml(code) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px">
      <p style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#7A2330;margin-bottom:24px">Orchestra-Core</p>
      <h1 style="font-size:28px;color:#2B2320;margin:0 0 16px">Your verification code</h1>
      <p style="color:#7A6C68;margin-bottom:32px">Enter this code to verify your identity. It expires in 10 minutes.</p>
      <div style="background:#FBF1EE;border:1px solid #F0E0DD;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px">
        <span style="font-size:40px;font-weight:600;letter-spacing:0.2em;color:#7A2330">${code}</span>
      </div>
      <p style="font-size:13px;color:#A39590">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

function confirmationEmailHtml(licenseKey) {
  const downloadUrl = `${process.env.FRONTEND_URL}/download`;
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px">
      <p style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#7A2330;margin-bottom:24px">Orchestra-Core</p>
      <h1 style="font-size:28px;color:#2B2320;margin:0 0 16px">You're in. Welcome.</h1>
      <p style="color:#7A6C68;margin-bottom:24px">Your payment was confirmed. Save this license key — you'll need it if you ever reinstall.</p>
      <div style="background:#FBF1EE;border:1px solid #F0E0DD;border-radius:12px;padding:20px 24px;margin-bottom:32px">
        <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#A39590;margin:0 0 8px">License key</p>
        <span style="font-size:18px;font-weight:600;letter-spacing:0.08em;color:#2B2320;font-family:monospace">${licenseKey}</span>
      </div>
      <a href="${downloadUrl}" style="display:inline-block;padding:14px 28px;background:#7A2330;color:#fff;text-decoration:none;border-radius:100px;font-size:15px">Download Orchestra-Core</a>
      <p style="font-size:13px;color:#A39590;margin-top:32px">This is a one-time payment — no subscriptions, no renewals.</p>
    </div>
  `;
}
