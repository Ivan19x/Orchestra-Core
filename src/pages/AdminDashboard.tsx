import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, Mail, Wallet, RotateCcw, UserCheck, AlertTriangle } from 'lucide-react';
import {
  getAdminOverview, updateConsultantAdmin, markPayoutPaidAdmin, markRefundPaidAdmin,
  markMessageHandled, type AdminApplication, type PayoutRow, type RefundRow, type ContactRow,
} from '@/lib/api';
import { useSession } from '@/lib/session';
import { eatFull, formatKes } from '@/lib/sessionTime';

type Tab = 'applications' | 'payouts' | 'refunds' | 'attention' | 'messages';

export default function AdminDashboard() {
  const session = useSession();
  const navigate = useNavigate();

  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminOverview>> | null>(null);
  const [denied, setDenied] = useState(false);
  const [tab, setTab] = useState<Tab>('applications');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    try {
      setData(await getAdminOverview());
    } catch {
      setDenied(true);
    }
  }

  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    load();
  }, [session, navigate]);

  async function run(key: string, fn: () => Promise<unknown>) {
    setError(''); setBusy(key);
    try { await fn(); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'That did not work.'); }
    finally { setBusy(''); }
  }

  if (!session) return null;

  if (denied) {
    return (
      <section className="container-narrow py-24 text-center">
        <h1 className="font-serif text-3xl text-foreground mb-3">Not found</h1>
        <p className="text-sm text-warm-muted">This page isn't available on your account.</p>
      </section>
    );
  }

  if (!data) {
    return <div className="flex items-center justify-center gap-2 py-32 text-warm-muted"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;
  }

  const tabs: { id: Tab; label: string; count: number; icon: typeof UserCheck }[] = [
    { id: 'applications', label: 'Applications', count: data.counts.pendingApplications, icon: UserCheck },
    { id: 'payouts', label: 'Payouts', count: data.counts.payoutsDue, icon: Wallet },
    { id: 'refunds', label: 'Refunds', count: data.counts.refundsDue, icon: RotateCcw },
    { id: 'attention', label: 'Needs review', count: data.counts.needsAttention, icon: AlertTriangle },
    { id: 'messages', label: 'Messages', count: data.counts.unreadMessages, icon: Mail },
  ];

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-prose py-12">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-3">Admin</div>
          <h1 className="font-serif text-4xl text-foreground">Back office</h1>
        </div>
      </section>

      <section className="container-prose py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition ${
                tab === t.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-warm-muted hover:border-primary/40'
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs ${tab === t.id ? 'opacity-80' : 'text-primary'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {tab === 'applications' && (
          <Applications items={data.applications} busy={busy} run={run} />
        )}
        {tab === 'payouts' && <Payouts items={data.payouts} busy={busy} run={run} />}
        {tab === 'refunds' && <Refunds items={data.refunds} busy={busy} run={run} />}
        {tab === 'attention' && <Attention items={data.attention} />}
        {tab === 'messages' && <Messages items={data.messages} busy={busy} run={run} />}
      </section>
    </>
  );
}

type Run = (key: string, fn: () => Promise<unknown>) => Promise<void>;

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-warm-muted py-8">{children}</p>;
}

function Applications({ items, busy, run }: { items: AdminApplication[]; busy: string; run: Run }) {
  const [pay, setPay] = useState<Record<string, { rate: string; fee: string; base: string }>>({});
  if (!items.length) return <Empty>No applications waiting.</Empty>;

  return (
    <div className="space-y-4">
      {items.map(a => {
        const p = pay[a.id] ?? { rate: '', fee: '', base: '' };
        const set = (patch: Partial<typeof p>) => setPay(s => ({ ...s, [a.id]: { ...p, ...patch } }));
        return (
          <div key={a.id} className="p-5 rounded-xl border border-border bg-background">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-foreground">{a.full_name}</h2>
                <p className="text-sm text-warm-muted">{a.users?.email}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-faint border border-border rounded-full px-2 py-1">
                {a.status}
              </span>
            </div>

            <dl className="text-sm text-warm-muted space-y-1 mb-4">
              <div><span className="text-faint">Experience:</span> {a.experience_years ?? '—'} years</div>
              <div><span className="text-faint">ID ends:</span> {a.id_last4 ?? '—'}</div>
              <div><span className="text-faint">Teaches:</span> {(a.session_modes || []).join(', ')}{a.service_area ? ` · ${a.service_area}` : ''}</div>
              <div className="pt-2"><span className="text-faint">Qualifications:</span> <span className="whitespace-pre-line">{a.qualifications}</span></div>
            </dl>

            <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-border">
              {([['rate', 'Learner pays /hr'], ['fee', 'Teacher per session'], ['base', 'Monthly base']] as const).map(([k, label]) => (
                <div key={k}>
                  <label className="block text-xs text-faint mb-1">{label}</label>
                  <input type="number" min="0" value={p[k]} onChange={e => set({ [k]: e.target.value })}
                    className="w-32 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground" />
                </div>
              ))}
              <button
                disabled={busy === a.id || !p.rate}
                onClick={() => run(a.id, () => updateConsultantAdmin(a.id, {
                  status: 'approved',
                  documentsReceived: true,
                  hourlyRateKes: Number(p.rate),
                  sessionFeeKes: Number(p.fee || 0),
                  monthlyBaseKes: Number(p.base || 0),
                }))}
                className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition disabled:opacity-50">
                {busy === a.id ? '…' : 'Approve'}
              </button>
              <button disabled={busy === a.id}
                onClick={() => run(a.id, () => updateConsultantAdmin(a.id, { status: 'rejected' }))}
                className="px-4 py-2 text-sm text-warm-muted hover:text-foreground transition disabled:opacity-50">
                Reject
              </button>
            </div>
            {!p.rate && <p className="text-xs text-faint mt-2">Set an hourly rate before approving — without one they can't be booked.</p>}
          </div>
        );
      })}
    </div>
  );
}

function Payouts({ items, busy, run }: { items: PayoutRow[]; busy: string; run: Run }) {
  const [refs, setRefs] = useState<Record<string, string>>({});
  if (!items.length) return <Empty>Nothing owed right now.</Empty>;

  return (
    <div className="space-y-3">
      {items.map(p => {
        const key = `${p.consultant_id}-${p.payout_month}`;
        return (
          <div key={key} className="p-5 rounded-xl border border-border bg-background">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
              <div>
                <h2 className="text-foreground">{p.full_name}</h2>
                <p className="text-xs text-warm-muted">{p.payout_month} · {p.sessions} session{p.sessions === 1 ? '' : 's'}</p>
              </div>
              <div className="text-right">
                <div className="font-serif text-2xl text-primary">{formatKes(p.total_owed_kes)}</div>
                <div className="text-xs text-faint">
                  {formatKes(p.session_fees_owed_kes)} fees + {formatKes(p.monthly_base_kes)} base
                </div>
              </div>
            </div>
            <p className="text-xs text-faint mb-4">
              Learners paid {formatKes(p.learners_paid_kes)} · you keep {formatKes(p.orchestra_core_kept_kes)}
            </p>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              <input placeholder="M-Pesa code once sent" value={refs[key] ?? ''}
                onChange={e => setRefs(s => ({ ...s, [key]: e.target.value }))}
                className="flex-1 min-w-48 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground" />
              <button disabled={busy === key || !refs[key]}
                onClick={() => run(key, () => markPayoutPaidAdmin(p.consultant_id, p.payout_month, refs[key]))}
                className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition disabled:opacity-50">
                {busy === key ? '…' : 'Mark paid'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Refunds({ items, busy, run }: { items: RefundRow[]; busy: string; run: Run }) {
  const [refs, setRefs] = useState<Record<string, string>>({});
  if (!items.length) return <Empty>No refunds owed. Good.</Empty>;

  return (
    <div className="space-y-3">
      {items.map(r => (
        <div key={r.ref} className="p-5 rounded-xl border border-[hsl(0_60%_42%)]/30 bg-background">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
            <div>
              <h2 className="text-foreground">{formatKes(r.refund_amount_kes)} to {r.learner_email}</h2>
              <p className="text-xs text-warm-muted">{r.consultant} · {eatFull(r.starts_at)}</p>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-faint border border-border rounded-full px-2 py-1">
              {r.booking_status}
            </span>
          </div>
          {r.refund_reason && <p className="text-sm text-warm-muted mb-2">{r.refund_reason}</p>}
          <p className="text-xs text-faint mb-4">Send to {r.refund_to_phone ?? 'the number they paid from'}</p>
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            <input placeholder="M-Pesa code once refunded" value={refs[r.ref] ?? ''}
              onChange={e => setRefs(s => ({ ...s, [r.ref]: e.target.value }))}
              className="flex-1 min-w-48 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground" />
            <button disabled={busy === r.ref || !refs[r.ref]}
              onClick={() => run(r.ref, () => markRefundPaidAdmin(r.ref, refs[r.ref]))}
              className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition disabled:opacity-50">
              {busy === r.ref ? '…' : 'Mark refunded'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Attention({ items }: { items: { ref: string; status: string; starts_at: string; learner_email: string; consultant: string }[] }) {
  if (!items.length) return <Empty>Nothing waiting on you.</Empty>;
  return (
    <div className="space-y-3">
      {items.map(s => (
        <div key={s.ref} className="p-5 rounded-xl border border-border bg-background">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-foreground text-sm">{s.consultant} · {s.learner_email}</h2>
              <p className="text-xs text-warm-muted">{eatFull(s.starts_at)}</p>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-faint border border-border rounded-full px-2 py-1">{s.status}</span>
          </div>
          <p className="text-xs text-faint mt-3">
            Reference {s.ref} — resolve it in Supabase, or contact both sides. A disputed session pays
            nobody until you decide.
          </p>
        </div>
      ))}
    </div>
  );
}

function Messages({ items, busy, run }: { items: ContactRow[]; busy: string; run: Run }) {
  if (!items.length) return <Empty>Inbox clear.</Empty>;
  return (
    <div className="space-y-3">
      {items.map(m => (
        <div key={m.id} className="p-5 rounded-xl border border-border bg-background">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <div>
              <h2 className="text-foreground text-sm">{m.subject || 'No subject'}</h2>
              <p className="text-xs text-warm-muted">{m.name || 'Someone'} · {m.email}</p>
            </div>
            <span className="text-xs text-faint">{new Date(m.created_at).toLocaleDateString()}</span>
          </div>
          <p className="text-sm text-warm-muted whitespace-pre-line mb-4">{m.body}</p>
          <div className="flex gap-4 pt-3 border-t border-border">
            <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'your message'))}`}
              className="text-sm text-primary hover:underline">Reply by email</a>
            <button disabled={busy === m.id} onClick={() => run(m.id, () => markMessageHandled(m.id))}
              className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-foreground disabled:opacity-50">
              <Check className="w-3.5 h-3.5" /> Done
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
