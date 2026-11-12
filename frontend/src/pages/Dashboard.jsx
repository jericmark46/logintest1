import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <main className="auth-page">
      <section className="auth-card dashboard">
        <div className="avatar">{initials}</div>
        <h1>Hi, {user.name.split(' ')[0]}</h1>
        <p className="subtitle">You are logged in.</p>

        <dl className="profile">
          <div>
            <dt>Name</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>

        <button type="button" className="secondary" onClick={logout}>
          Log out
        </button>
      </section>
    </main>
  );
}
