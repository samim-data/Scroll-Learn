import { useAuth } from './hooks/useAuth';
import Feed from './components/Feed';
import AuthPage from './components/AuthPage';

export default function App() {
  const { user, loading, signIn, signUp, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onSignIn={signIn} onSignUp={signUp} onGoogleSignIn={signInWithGoogle} />;
  }

  return <Feed user={user} onSignOut={signOut} />;
}
