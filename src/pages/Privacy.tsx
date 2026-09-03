export default function Privacy() {
  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Legal</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground">Privacy Policy</h1>
          <p className="text-sm text-warm-muted mt-4">Effective date: 16 June 2026 · Last updated: 3 September 2026</p>
        </div>
      </section>

      <section className="container-narrow py-16">
        <div className="prose prose-slate max-w-none space-y-8 text-foreground leading-relaxed">

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">1. Who we are</h2>
            <p className="text-warm-muted">
              Orchestra-Core is a financial education website operated under the business name Orchestra-Core,
              registered with Kenya's Business Registration Service (BRS). We are the data controller for personal
              data collected through this website.
            </p>
            <p className="text-warm-muted mt-3">
              Contact: <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">2. What data we collect and why</h2>
            <p className="text-warm-muted mb-3">
              We collect the minimum data necessary to run your account and process your purchase:
            </p>
            <ul className="list-disc list-inside text-warm-muted space-y-2 ml-2">
              <li>
                <strong className="text-foreground">Email address and password</strong> — provided by you when you
                create an account. Your password is only ever used to verify a sign-in; we never see or store it in
                plain text (see Section 4). Your email identifies your account and lets you sign back in from any
                device. Lawful basis: performance of a contract.
              </li>
              <li>
                <strong className="text-foreground">M-Pesa phone number and transaction details</strong> — when you
                pay, we send the number you enter to Safaricom so it can prompt you, and we store the transaction
                reference, amount, phone number, and result. <strong className="text-foreground">Your M-Pesa PIN is
                entered on your own handset and never reaches us.</strong> Lawful basis: performance of a contract.
              </li>
              <li>
                <strong className="text-foreground">Access key and payment status</strong> — stored so we can verify
                your purchase and unlock lessons for you.
              </li>
            </ul>
            <p className="text-warm-muted mt-3">
              <strong className="text-foreground">We do not track how you use the site.</strong> Which lessons you
              read, how far you get, and your reading streak are stored only in your own browser and are never sent to
              us.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">3. Data we do not collect</h2>
            <ul className="list-disc list-inside text-warm-muted space-y-2 ml-2">
              <li>We do not use advertising cookies, tracking pixels, or third-party analytics on this website.</li>
              <li>We do not collect device identifiers, IP addresses for profiling, or behavioural data.</li>
              <li>We do not sell, rent, or share your personal data with advertisers or data brokers.</li>
              <li>We never receive your M-Pesa PIN, card numbers, or any payment credentials.</li>
            </ul>
            <p className="text-warm-muted mt-3">
              The only browser storage we use is a small amount of local storage on your own device, to keep you
              signed in and remember your light/dark theme choice. It is never transmitted to us.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">4. How we store and protect your data</h2>
            <p className="text-warm-muted">
              Your email, access key, and password are stored in a Supabase-hosted PostgreSQL database. Your password
              is stored as a bcrypt hash, never in plain text — we cannot see or recover your actual password, only
              verify a sign-in attempt against the hash. Database access is restricted to the server-side API. All
              data in transit is protected with HTTPS.
            </p>
            <p className="text-warm-muted mt-3">
              Supabase infrastructure is hosted in data centres outside Kenya. By creating an account you consent to
              this cross-border transfer, which is necessary to provide the service. Supabase maintains
              industry-standard security certifications.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">5. Retention</h2>
            <p className="text-warm-muted">
              We retain your email, access key, and payment record for as long as your account is active, so you can
              sign in and prove ownership. If you request deletion, we will remove your personal data within 30 days,
              subject to any legal obligation to retain financial records (e.g. as required by KRA).
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">6. Your rights under Kenya's Data Protection Act 2019</h2>
            <p className="text-warm-muted mb-3">As a data subject you have the right to:</p>
            <ul className="list-disc list-inside text-warm-muted space-y-2 ml-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (subject to retention obligations)</li>
              <li>Object to processing of your data</li>
              <li>Receive your data in a portable format</li>
              <li>Lodge a complaint with the Office of the Data Protection Commissioner (ODPC) at <span className="text-foreground">odpc.go.ke</span></li>
            </ul>
            <p className="text-warm-muted mt-3">
              To exercise any of these rights, email us at{' '}
              <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>.
              We will respond within 7 days as required by the DPA General Regulations 2021.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">7. Third-party services</h2>
            <ul className="list-disc list-inside text-warm-muted space-y-2 ml-2">
              <li>
                <strong className="text-foreground">Safaricom PLC (M-Pesa / Daraja)</strong> — processes your payment.
                Safaricom receives your phone number and the amount. See <span className="text-foreground">safaricom.co.ke</span> for
                their privacy policy.
              </li>
              <li><strong className="text-foreground">Supabase</strong> — database hosting. See <span className="text-foreground">supabase.com/privacy</span>.</li>
              <li><strong className="text-foreground">Vercel</strong> — website hosting. See <span className="text-foreground">vercel.com/legal/privacy-policy</span>.</li>
              <li><strong className="text-foreground">Render</strong> — backend API hosting. See <span className="text-foreground">render.com/privacy</span>.</li>
              <li><strong className="text-foreground">Google (Gmail SMTP)</strong> — delivers your purchase confirmation and password-reset emails. See <span className="text-foreground">policies.google.com/privacy</span>.</li>
            </ul>
            <p className="text-warm-muted mt-3">
              None of these providers receive your reading data. They only receive what is strictly necessary for
              hosting, payment, and email delivery.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">8. Children</h2>
            <p className="text-warm-muted">
              Orchestra-Core is not directed at children under 18. We do not knowingly collect personal data from
              anyone under 18.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">9. Changes to this policy</h2>
            <p className="text-warm-muted">
              If we make material changes, we will update the effective date at the top and, where we have your
              contact details, notify you by email. Continued use after notification constitutes acceptance.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">10. Contact</h2>
            <p className="text-warm-muted">
              Questions about this policy:{' '}
              <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>
            </p>
          </div>

        </div>
      </section>
    </>
  );
}
