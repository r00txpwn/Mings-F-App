import { useState, useEffect } from 'react';
import { Users, Plus, Mail, Shield, Trash2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/cockpit';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface UserManagementUser {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
}

export function UsersScreen() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'manager' | 'admin'>('staff');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management/list?_ts=${Date.now()}`;
    try {
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const raw = await response.text();
      let result: { error?: string; users?: UserManagementUser[] } = {};
      try {
        result = raw ? JSON.parse(raw) : {};
      } catch {
        result = {};
      }

      if (!response.ok) {
        const details = result.error || raw || `HTTP ${response.status}`;
        setError(`Failed to load users: ${details}`);
        return;
      }

      if (Array.isArray(result.users)) {
        const mapped = (result.users as UserManagementUser[]).map((u) => ({
          id: u.id,
          email: u.email || '',
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
        }));
        mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setUsers(mapped);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError(t.fillAllFields);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.passwordsDontMatch);
      return;
    }

    if (password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError(t.notAuthenticated);
      setLoading(false);
      return;
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management/create`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
    });

    const result = await response.json();
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      if (result.user?.id) {
        const createdUser: User = {
          id: result.user.id,
          email: result.user.email || email,
          created_at: result.user.created_at || new Date().toISOString(),
          last_sign_in_at: result.user.last_sign_in_at,
        };
        setUsers((prev) => [createdUser, ...prev.filter((u) => u.id !== createdUser.id)]);
      }
      setSuccess(t.userCreated);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('staff');
      setShowForm(false);
      loadUsers();
      setTimeout(() => {
        setSuccess('');
        loadUsers();
      }, 2000);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t.deleteUserConfirm)) {
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError(t.notAuthenticated);
      return;
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management/delete/${userId}`;
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(t.userDeleted);
      loadUsers();
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        eyebrow="Access"
        title={t.users}
        description={t.manageUsers}
        icon={Users}
        actions={
          <button type="button" onClick={() => setShowForm(!showForm)} className="cockpit-btn-primary">
            <Plus className="h-4 w-4" />
            Add New User
          </button>
        }
      />

      {error ? (
        <div className="cockpit-alert-error mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />
          <p>{error}</p>
        </div>
      ) : null}

      {success ? (
        <div className="cockpit-alert-success mb-6">
          <Shield className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-200" />
          <p>{success}</p>
        </div>
      ) : null}

      {showForm ? (
        <div className="cockpit-panel mb-6 p-6">
          <h3 className="cockpit-section-title mb-4">{t.createNewUser}</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="cockpit-label mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="cockpit-input"
              />
            </div>

            <div>
              <label className="cockpit-label mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="cockpit-input"
              />
            </div>

            <div>
              <label className="cockpit-label mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.confirmPasswordPlaceholder}
                className="cockpit-input"
              />
            </div>

            <div>
              <label className="cockpit-label mb-2">{t.newUserRole}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'staff' | 'manager' | 'admin')}
                className="cockpit-select"
              >
                <option value="staff">{t.userRoleStaff}</option>
                <option value="manager">{t.userRoleManager}</option>
                <option value="admin">{t.userRoleAdmin}</option>
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.newUserStaffProfileHint}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={loading} className="cockpit-btn-primary disabled:opacity-40">
                {loading ? t.creating : t.createUser}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setRole('staff');
                  setError('');
                }}
                className="cockpit-btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="cockpit-table-wrap">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="cockpit-thead">
              <tr>
                <th className="cockpit-th">User</th>
                <th className="cockpit-th">Created</th>
                <th className="cockpit-th">Last Sign In</th>
                <th className="cockpit-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr className="cockpit-tr">
                  <td colSpan={4} className="cockpit-td py-10 text-center text-slate-500 dark:text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="cockpit-tr">
                    <td className="cockpit-td">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                          <Mail className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
                          <p className="font-mono text-xs text-slate-500 dark:text-slate-400">ID: {user.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="cockpit-td font-mono text-sm tabular-nums text-slate-600 dark:text-slate-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="cockpit-td font-mono text-sm tabular-nums text-slate-600 dark:text-slate-300">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : t.never}
                    </td>
                    <td className="cockpit-td text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
