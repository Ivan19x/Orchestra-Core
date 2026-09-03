import { PRICE_LABEL } from '@/lib/pricing';

export default function Terms() {
  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Legal</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground">Terms of Service</h1>
          <p className="text-sm text-warm-muted mt-4">Effective date: 16 June 2026 · Last updated: 3 September 2026</p>
        </div>
      </section>

      <section className="container-narrow py-16">
        <div className="prose prose-slate max-w-none space-y-8 text-foreground leading-relaxed">

          <div className="p-6 rounded-xl bg-blush border border-border">
            <p className="text-foreground font-medium">
              Orchestra-Core is a financial education product. It provides general financial information and education
              only. It does not provide personalized financial, investment, legal, or tax advice, and nothing it
              publishes is a recommendation to buy, sell, or hold any security, asset, or financial product. Always
              verify independently and consult a licensed professional before making financial decisions. Use at your
              own risk.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">1. Agreement</h2>
            <p className="text-warm-muted">
              By accessing this website or purchasing Orchestra-Core, you agree to these Terms of Service. If you do
              not agree, do not use Orchestra-Core. These terms govern the relationship between you and the operator
              of Orchestra-Core, a business name registered with Kenya's Business Registration Service.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">2. What you are buying</h2>
            <p className="text-warm-muted">
              For a one-time payment of {PRICE_LABEL} you receive a non-exclusive, non-transferable licence to read the
              full Orchestra-Core lesson library for personal, non-commercial learning, delivered through this website.
              Your licence includes all current lessons and all future lessons added for as long as Orchestra-Core
              operates. It is for individual use only — it may not be shared, resold, or used to provide services to
              others. Access is tied to your account, not to a device: sign in from anywhere.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">3. Education, not advice — the critical distinction</h2>
            <p className="text-warm-muted mb-3">
              Orchestra-Core is a financial literacy and education tool. Under Kenya's Capital Markets Act (Cap 485A),
              providing personalized investment advice for compensation requires a CMA licence. Orchestra-Core does not:
            </p>
            <ul className="list-disc list-inside text-warm-muted space-y-2 ml-2">
              <li>Provide personalized buy/sell recommendations for specific securities</li>
              <li>Manage your money or investment portfolio</li>
              <li>Act as a stockbroker, fund manager, or investment adviser</li>
              <li>Provide legal, tax, or accounting advice</li>
              <li>Guarantee the accuracy of any financial figures, rates, or market data</li>
            </ul>
            <p className="text-warm-muted mt-3">
              The lessons explain how money, markets, and institutions work in general terms. They are not a substitute
              for advice from a licensed professional. You remain responsible for all financial decisions you make.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">4. Content accuracy</h2>
            <p className="text-warm-muted">
              Lessons reference real-world figures — tax bands, M-Pesa tariffs, contribution rates, interest rates —
              that change over time. We correct lessons as rules change, but you should always verify current figures
              with the authoritative source (KRA, CBK, Safaricom, your bank, your SACCO, the NSE) before acting on them.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">5. Payment and refunds</h2>
            <p className="text-warm-muted mb-3">
              Payments are collected by M-Pesa through Safaricom PLC's Daraja payment platform. Your PIN is entered on
              your own handset and is never seen, transmitted, or stored by Orchestra-Core. We record only the
              transaction reference, the amount, the phone number used, and whether the payment succeeded.
            </p>
            <p className="text-warm-muted mb-3">
              <strong className="text-foreground">Refund policy:</strong> Because Orchestra-Core is a digital product
              that becomes immediately readable the moment payment is confirmed, refunds are generally not available
              once access has been unlocked. However, in accordance with the Kenya Consumer Protection Act 2012:
            </p>
            <ul className="list-disc list-inside text-warm-muted space-y-2 ml-2">
              <li>If your M-Pesa payment was taken but your access did not unlock, you are entitled to a full refund (or, if you prefer, to have your access activated manually). Contact us with your M-Pesa confirmation code.</li>
              <li>If you were charged twice for the same purchase, the duplicate is refunded in full.</li>
              <li>If you believe you were misled about what Orchestra-Core provides, contact us within 14 days of purchase to discuss.</li>
            </ul>
            <p className="text-warm-muted mt-3">
              To request a refund: <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>.
              We will respond within 5 business days.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">6. Internet agreements (Consumer Protection Act 2012, Part IV)</h2>
            <p className="text-warm-muted">
              This is an internet agreement under Kenya's Consumer Protection Act 2012 (ss.31–33). Before completing
              your purchase, the checkout page discloses: the product description, the price ({PRICE_LABEL}), the
              payment method, and our contact information. A copy of this agreement is available at any time at this
              URL (/terms). Ambiguities are construed in your favour.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">7. Intellectual property</h2>
            <p className="text-warm-muted">
              All lesson content, the Orchestra-Core brand, and this website are owned by the operator of
              Orchestra-Core. You may not reproduce, redistribute, or resell Orchestra-Core lesson content without
              written permission.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">8. Limitation of liability</h2>
            <p className="text-warm-muted">
              To the maximum extent permitted by Kenyan law, Orchestra-Core and its operator are not liable for any
              financial loss, investment loss, or other damage arising from your use of or reliance on Orchestra-Core
              content. Our liability is in any event limited to the amount you paid for your licence ({PRICE_LABEL}).
              We do not exclude liability for death or personal injury caused by negligence, or for fraud.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">9. Acceptable use</h2>
            <p className="text-warm-muted">
              You may not use Orchestra-Core to: scrape or redistribute content at scale; share your account
              credentials so others can read without paying; attempt to circumvent the paywall; or use the platform in
              any way that violates Kenyan law. We may suspend an account that does.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">10. Availability</h2>
            <p className="text-warm-muted">
              We aim to keep Orchestra-Core available continuously, but we do not guarantee uninterrupted access.
              Maintenance, third-party outages (hosting, database, Safaricom), and events outside our control may
              interrupt service temporarily.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">11. Governing law</h2>
            <p className="text-warm-muted">
              These terms are governed by the laws of the Republic of Kenya. Any dispute will be subject to the
              jurisdiction of the Kenyan courts.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">12. Changes</h2>
            <p className="text-warm-muted">
              We may update these terms. Material changes will be notified by updating the effective date and, where
              possible, by email. Continued use after notification constitutes acceptance.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">13. Contact</h2>
            <p className="text-warm-muted">
              <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>
            </p>
          </div>

        </div>
      </section>
    </>
  );
}
