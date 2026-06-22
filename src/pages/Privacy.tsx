export default function Privacy() {
  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Legal</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground">Privacy Policy</h1>
          <p className="text-sm text-warm-muted mt-4">Effective date: 16 June 2026 · Last updated: 21 June 2026</p>
        </div>
      </section>

      <section className="container-narrow py-16">
        <div className="prose prose-slate max-w-none space-y-8 text-foreground leading-relaxed">

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">1. Who we are</h2>
            <p className="text-warm-muted">
              Orchestra-Core is a financial education product built and operated by Ivan Chweya, trading as Orchestra-Core, a business name registered under Kenya's Business Registration Service (BRS). We are the data controller for personal data collected through this website and the Orchestra-Core desktop application.
            </p>
            <p className="text-warm-muted mt-3">
              Contact: <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">2. What data we collect and why</h2>
            <p className="text-warm-muted mb-3">We collect the minimum data necessary to process your purchase and deliver your license:</p>
            <ul className="list-disc list-inside text-warm-muted space-y-2 ml-2">
              <li><strong className="text-foreground">Email address and password</strong> — provided by you when you create an account. Your password is used only to verify it's you signing in; we never see or store it in plain text (see Section 4). Your email is used to deliver your license key and let you re-access your account if you switch devices. Lawful basis: performance of a contract (you purchasing Orchestra-Core).</li>
              <li><strong className="text-foreground">Payment information</strong> — M-Pesa, card, and other payments are processed directly by IntaSend Limited. We do not receive or store your card number, M-Pesa PIN, or any payment credentials. We receive only a transaction reference and payment status from IntaSend.</li>
              <li><strong className="text-foreground">License key and payment status</strong> — stored in our database (hosted on Supabase, a US-based cloud provider) so we can verify your purchase if you need to re-download.</li>
            </ul>
            <p className="text-warm-muted mt-3">
              <strong className="text-foreground">We do not collect any data about how you use the app.</strong> Your AI conversations, lessons read, questions asked, and learning progress all remain entirely on your device and are never transmitted to us or any third party.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">3. Data we do not collect</h2>
            <ul className="list-disc list-inside text-warm-muted space-y-2 ml-2">
              <li>We do not use cookies, tracking pixels, or analytics tools on this website.</li>
              <li>We do not collect device identifiers, IP addresses for profiling, or behavioral data.</li>
              <li>We do not sell, rent, or share your personal data with advertisers or data brokers.</li>
              <li>We do not use your data to train AI models.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">4. How we store and protect your data</h2>
            <p className="text-warm-muted">
              Your email, license key, and password are stored in a Supabase-hosted PostgreSQL database. Your password is stored as a bcrypt hash, never in plain text — we cannot see or recover your actual password, only verify a sign-in attempt against the hash. Access is restricted to the server-side API only. We use HTTPS for all data in transit.
            </p>
            <p className="text-warm-muted mt-3">
              Supabase infrastructure is hosted in data centers outside Kenya. By purchasing Orchestra-Core you consent to this cross-border transfer, which is necessary to fulfill your order. Supabase maintains industry-standard security certifications.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">5. Retention</h2>
            <p className="text-warm-muted">
              We retain your email/phone, license key, and payment record for as long as your license is active — specifically, so you can re-download or prove ownership. If you request deletion, we will remove your personal data within 30 days, subject to any legal obligation to retain records (e.g. financial records required by KRA).
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
              To exercise any of these rights, email us at <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>. We will respond within 7 days as required by the DPA General Regulations 2021.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">7. Third-party services</h2>
            <ul className="list-disc list-inside text-warm-muted space-y-2 ml-2">
              <li><strong className="text-foreground">IntaSend</strong> — payment processing (M-Pesa, card, and other supported methods). IntaSend is a licensed payment service provider regulated by the Central Bank of Kenya. See <span className="text-foreground">intasend.com/privacy</span> for their policy.</li>
              <li><strong className="text-foreground">Supabase</strong> — database hosting. See <span className="text-foreground">supabase.com/privacy</span>.</li>
              <li><strong className="text-foreground">Resend</strong> — delivers your license key confirmation email after purchase. See <span className="text-foreground">resend.com/privacy</span>.</li>
              <li><strong className="text-foreground">Render</strong> — backend API hosting. See <span className="text-foreground">render.com/privacy</span>.</li>
            </ul>
            <p className="text-warm-muted mt-3">
              None of these providers receive your learning data. They only receive what is strictly necessary for payment and license delivery.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">8. Children</h2>
            <p className="text-warm-muted">
              Orchestra-Core is not directed at children under 18. We do not knowingly collect personal data from anyone under 18.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">9. Changes to this policy</h2>
            <p className="text-warm-muted">
              If we make material changes, we will update the effective date at the top and, where we have your contact details, notify you by email. Continued use after notification constitutes acceptance.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">10. Contact</h2>
            <p className="text-warm-muted">
              Questions about this policy: <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>
            </p>
          </div>

        </div>
      </section>
    </>
  );
}
