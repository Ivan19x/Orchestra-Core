import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Check, Mail } from 'lucide-react';
import { sendContactMessage } from '@/lib/api';
import { useSession } from '@/lib/session';

export default function Contact() {
  const session = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(session?.identifier ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (body.trim().length < 10) return setError('Please write a little more so we can actually help.');

    setSending(true);
    try {
      await sendContactMessage({
        name: name.trim() || undefined,
        email: email.trim(),
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Contact</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4">Send us a message.</h1>
          <p className="text-warm-muted max-w-md mx-auto">
            Questions about a lesson, a payment, or teaching with us — this reaches a real person.
          </p>
        </div>
      </section>

      <section className="container-narrow py-16">
        <div className="max-w-xl mx-auto">
          {sent ? (
            <div className="rounded-2xl border border-border bg-blush p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-5">
                <Check className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">Message sent.</h2>
              <p className="text-sm text-warm-muted mb-6">
                We reply to <span className="text-foreground">{email}</span>, usually within a couple of days.
              </p>
              <Link to="/lessons" className="text-sm text-primary hover:underline">Back to the lessons →</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-background p-6 md:p-8">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label htmlFor="name" className="block text-sm text-foreground mb-1.5">
                    Your name <span className="text-faint">(optional)</span>
                  </label>
                  <input id="name" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm text-foreground mb-1.5">Your email</label>
                  <input id="email" type="email" required value={email}
                    onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
                </div>
              </div>

              <div className="mb-5">
                <label htmlFor="subject" className="block text-sm text-foreground mb-1.5">
                  Subject <span className="text-faint">(optional)</span>
                </label>
                <input id="subject" value={subject} onChange={e => setSubject(e.target.value)}
                  className={inputClass} placeholder="What is this about?" />
              </div>

              <div className="mb-5">
                <label htmlFor="body" className="block text-sm text-foreground mb-1.5">Message</label>
                <textarea id="body" required rows={6} value={body} onChange={e => setBody(e.target.value)}
                  className={`${inputClass} resize-none`} placeholder="Tell us what you need." />
              </div>

              <p className="text-xs text-faint mb-5">
                If it is about a payment, include your M-Pesa confirmation code — it makes it much faster
                to sort out.
              </p>

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <button type="submit" disabled={sending}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}

          <p className="text-xs text-faint text-center mt-6">
            Prefer email?{' '}
            <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>
          </p>
        </div>
      </section>
    </>
  );
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition';
