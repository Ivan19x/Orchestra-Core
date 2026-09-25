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
              <strong className="text-foreground">Refund policy.</strong> The first lesson of every series is free to
              read before you pay, without entering any payment details. You are therefore deciding with the actual
              material in front of you, and there is no change-of-mind refund once your access has been unlocked.
              There are two situations in which you are entitled to your money back:
            </p>
            <ul className="list-disc list-outside text-warm-muted space-y-3 ml-5 mb-3">
              <li>
                <strong className="text-foreground">The service was not working when you paid.</strong> If your M-Pesa
                payment is taken but you cannot reach your lessons — access never unlocks, or the service is
                unavailable — you may report it to us within <strong className="text-foreground">14 days of the
                payment</strong> and choose either a full refund or to have your access activated manually. Report it
                with the M-Pesa confirmation code from your SMS.
              </li>
              <li>
                <strong className="text-foreground">You were charged more than once</strong> for the same purchase. Any
                duplicate payment is refunded in full, whenever it is identified.
              </li>
            </ul>
            <p className="text-warm-muted mb-3">
              <strong className="text-foreground">After the 14 days.</strong> If you do not report a service problem
              within 14 days of paying, no refund is due. Your purchase is not lost: access is permanent, it is restored
              as soon as the service is available again, and you continue reading from where you stopped. A temporary
              interruption delays your access; it does not end it.
            </p>
            <p className="text-warm-muted">
              To report a problem or request a refund:{' '}
              <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>.
              We will respond within 5 business days. Nothing in this section limits any right you have under Kenyan
              law that cannot be waived by agreement.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">5b. One-to-one sessions with a consultant</h2>
            <p className="text-warm-muted mb-3">
              Separately from the written curriculum, you can book a paid one-to-one session with a
              consultant — a teacher we have verified, who delivers the Orchestra-Core curriculum. These
              terms apply to those bookings.
            </p>
            <p className="text-warm-muted mb-3">
              <strong className="text-foreground">What a session is.</strong> Teaching, on our material.
              Consultants are verified for identity and qualifications, but verification is not a licence:
              a consultant is a teacher, not a licensed financial adviser, and will not tell you what to
              buy, sell or invest in. Section 3 applies to sessions in full.
            </p>
            <p className="text-warm-muted mb-3">
              <strong className="text-foreground">Price.</strong> Rates are set by Orchestra-Core, not by
              the consultant, so the same session costs the same whoever you book. You pay Orchestra-Core
              at the time of booking; we pay the consultant.
            </p>

            <p className="text-warm-muted mb-3">
              <strong className="text-foreground">If a session does not happen.</strong> The principle we
              apply is simple: if you were not taught, you should not be out of pocket.
            </p>
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="bg-blush">
                    <th className="text-left p-3 text-foreground font-medium border-b border-border">What happened</th>
                    <th className="text-left p-3 text-foreground font-medium border-b border-border">What you get</th>
                  </tr>
                </thead>
                <tbody className="text-warm-muted">
                  {[
                    ['Your consultant does not attend', 'Full refund. Report it within 48 hours of the session time.'],
                    ['Your consultant cancels, for any reason', 'Full refund.'],
                    ['You cancel more than 24 hours ahead', 'Full refund.'],
                    ['You cancel less than 24 hours ahead', 'No refund — the time was already held for you.'],
                    ['You do not attend', 'No refund. Your consultant attended and held the hour.'],
                    ['Our booking or payment system failed', 'Full refund, or we rebook you — your choice.'],
                  ].map(([a, b]) => (
                    <tr key={a} className="border-b border-border last:border-b-0">
                      <td className="p-3 align-top">{a}</td>
                      <td className="p-3 align-top text-foreground">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-warm-muted mb-3">
              Where a refund is due it is returned to the M-Pesa number you paid from, normally within a
              few working days. A consultant is never paid for a session they did not deliver.
            </p>
            <p className="text-warm-muted mb-3">
              <strong className="text-foreground">If the two accounts differ.</strong> Where you and your
              consultant each report a different version of what happened, the session is held and a
              person at Orchestra-Core reviews it. Nobody is paid and no refund is issued until that is
              decided, and we will explain the outcome to both of you.
            </p>
            <p className="text-warm-muted mb-3">
              <strong className="text-foreground">Late arrivals and short sessions.</strong> If a session
              starts late or runs short through your consultant's fault, contact us — we will either make
              up the time or refund the part you did not receive. The table above covers sessions that did
              not happen at all; partial problems are handled case by case.
            </p>
            <p className="text-warm-muted mb-3">
              <strong className="text-foreground">In-person sessions.</strong> Where you and a consultant
              agree to meet in person, you are responsible for choosing a location you are comfortable
              with. Orchestra-Core does not supervise sessions and is not responsible for what happens at
              a location neither of us controls. Tell us immediately if a consultant behaves improperly —
              we will suspend a profile while we look into it.
            </p>
            <p className="text-warm-muted">
              <strong className="text-foreground">Conduct.</strong> Sessions are for teaching. Consultants
              may not solicit payment outside Orchestra-Core, sell you products, or give personal
              investment advice. Report any of that to us and we will act on it.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">5c. Teaching as a consultant</h2>
            <p className="text-warm-muted mb-3">
              If you apply to teach, you agree to be verified: we check your identity document,
              qualifications and supporting school or institutional documents before your profile goes
              live. We keep only the last four digits of your ID number, never the full number.
            </p>
            <p className="text-warm-muted mb-3">
              <strong className="text-foreground">Pay.</strong> Orchestra-Core sets what learners pay and
              what you earn: a monthly base plus a fixed fee for each session you deliver, settled
              monthly. You may not set your own rate or take payment from a learner directly. You are an
              independent contractor, not an employee, and are responsible for your own tax.
            </p>
            <p className="text-warm-muted">
              <strong className="text-foreground">Not delivering.</strong> If you cancel or do not attend,
              the learner is refunded in full and that session is not paid. Repeatedly missing sessions
              will result in your profile being suspended.
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
