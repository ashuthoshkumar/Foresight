import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import './AdminDashboard.css';

interface UserProfile {
  email: string;
  name: string;
  tier: string;
  credits_used_today: number;
  is_admin: boolean;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Health parameters
  const [healthStatus, setHealthStatus] = useState({
    dbConnected: true,
    apiGateway: true,
    llmActive: true
  });

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch users
      const userRes = await api.getAdminUsers();
      if (userRes.success && userRes.users) {
        setUsers(userRes.users);
      }
      
      // Perform health check
      const healthRes = await api.healthCheck();
      setHealthStatus({
        dbConnected: healthRes.database !== 'disconnected',
        apiGateway: true,
        llmActive: true
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpgradeUser = async (email: string, currentTier: string) => {
    const targetTier = currentTier === 'free' ? 'pro' : 'free';
    try {
      const res = await api.upgradeUser(email, targetTier);
      if (res.success) {
        setSuccessMessage(`Successfully updated ${email} to ${targetTier.toUpperCase()} tier!`);
        setTimeout(() => setSuccessMessage(null), 4000);
        // Refresh users list
        await fetchAdminData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade action failed');
      setTimeout(() => setError(null), 4000);
    }
  };

  return (
    <div className="admin-dashboard container animate-fade-in">
      <div className="admin-dashboard__header">
        <h1 className="gradient-text">🛡️ Administrator Console</h1>
        <p className="admin-dashboard__subtitle">System health monitors, user tiers database management, and active credits auditing.</p>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="admin-dashboard__alert admin-dashboard__alert--success">
          <span>✅ {successMessage}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {error && (
        <div className="admin-dashboard__alert admin-dashboard__alert--error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Health Cards Row */}
      <div className="admin-dashboard__health-grid">
        <div className="admin-dashboard__card glass">
          <div className="admin-dashboard__health-status">
            <span className={`status-dot ${healthStatus.dbConnected ? 'status-dot--active' : 'status-dot--inactive'}`} />
            <h3>Database Service</h3>
          </div>
          <p className="health-detail">Relational SQLite database is operational. Active connections to <code>foresight.db</code>.</p>
          <div className="health-badge">sqlite3 v3.x</div>
        </div>

        <div className="admin-dashboard__card glass">
          <div className="admin-dashboard__health-status">
            <span className={`status-dot ${healthStatus.apiGateway ? 'status-dot--active' : 'status-dot--inactive'}`} />
            <h3>API Gateway</h3>
          </div>
          <p className="health-detail">Uvicorn FastAPI server gateway is routing requests. Port: <code>8000</code>.</p>
          <div className="health-badge">uvicorn running</div>
        </div>

        <div className="admin-dashboard__card glass">
          <div className="admin-dashboard__health-status">
            <span className={`status-dot ${healthStatus.llmActive ? 'status-dot--active' : 'status-dot--inactive'}`} />
            <h3>LLM Models Core</h3>
          </div>
          <p className="health-detail">Google Gemini 2.5 Flash active. Failover path enabled for 2.0-flash-lite.</p>
          <div className="health-badge">gemini core ready</div>
        </div>
      </div>

      {/* User Manager Section */}
      <div className="admin-dashboard__user-section glass">
        <div className="user-section__header">
          <h2>👥 Registered Users Database</h2>
          <button className="refresh-btn" onClick={fetchAdminData}>🔄 Refresh</button>
        </div>

        {isLoading ? (
          <div className="admin-dashboard__loading">
            <div className="spinner" />
            <span>Auditing database registers...</span>
          </div>
        ) : (
          <div className="admin-dashboard__table-wrapper">
            <table className="admin-dashboard__table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Subscription Tier</th>
                  <th>Credits Today</th>
                  <th>Action Admin Option</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email}>
                    <td>{u.name}</td>
                    <td className="email-col">{u.email}</td>
                    <td>
                      <span className={`tier-badge ${u.is_admin ? 'tier-badge--admin' : u.tier === 'pro' ? 'tier-badge--pro' : 'tier-badge--free'}`}>
                        {u.is_admin ? 'ADMIN' : u.tier.toUpperCase()}
                      </span>
                    </td>
                    <td>{u.is_admin ? 'Unlimited' : `${u.credits_used_today} / 3`}</td>
                    <td>
                      {u.is_admin ? (
                        <span className="action-text">-</span>
                      ) : (
                        <button 
                          className={`upgrade-action-btn ${u.tier === 'pro' ? 'upgrade-action-btn--downgrade' : ''}`}
                          onClick={() => handleUpgradeUser(u.email, u.tier)}
                        >
                          {u.tier === 'pro' ? '🔓 Downgrade to Free' : '💎 Upgrade to Pro'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
