import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SignupForm } from '@/components/orchestra-core/SignupForm';
import { useSession } from '@/lib/session';

export default function Signup() {
  const navigate = useNavigate();
  const session = useSession();

  // Already signed in? No need to sign up again.
  useEffect(() => {
    if (session) navigate('/dashboard', { replace: true });
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-blush flex items-start justify-center pt-16 pb-24 px-4">
      <div className="w-full max-w-md">
        <div className="bg-background rounded-2xl border border-border shadow-sm p-8">
          <div className="text-xs uppercase tracking-[0.15em] text-primary mb-1">Create your free account</div>
          <h1 className="font-serif text-3xl text-foreground mb-2">Start reading in a minute.</h1>
          <p className="text-sm text-warm-muted mb-8">
            A free account lets you read the starter lesson in each series. Unlock every lesson and your AI coach anytime.
          </p>

          <SignupForm onSuccess={() => navigate('/dashboard')} submitLabel="Create free account" />

          <p className="text-xs text-faint text-center mt-5">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
