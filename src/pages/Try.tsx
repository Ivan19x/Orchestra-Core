import { Navigate } from 'react-router-dom';

// The no-signup AI chat demo is retired while the AI coach is on hold (it
// returns later, once we run it on our own infrastructure). The lessons are
// the product now, so send visitors there.
export default function Try() {
  return <Navigate to="/lessons" replace />;
}
