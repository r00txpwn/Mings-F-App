import { Fragment, useState, useEffect } from 'react';
import { Users, Plus, Mail, Shield, Trash2, AlertCircle, Loader2, Check, Lock, KeyRound } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/cockpit';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role: 'staff' | 'manager' | 'admin';
}

interface UserManagementUser {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: 'staff' | 'manager' | 'admin';
}

export function UsersScreen() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'manager' | 'admin'>('staff');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [roleSavingByUserId, setRoleSavingByUserId] = useState<Record<string, boolean>>({});
  const [roleSuccessByUserId, setRoleSuccessByUserId] = useState<Record<string, boolean>>({});
  const [roleErrorByUserId, setRoleErrorByUserId] = useState<Record<string, string>>({});
  const [resetOpenForUserId, setResetOpenForUserId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const getAccessToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }

    const { data: refreshed } = await supabase.auth.refreshSession();
    return refreshed.session?.access_token ?? null;
  };

  const loadUsers = async (hasRetried = false) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError(t.notAuthenticated);
      return;
    }

    setError('');
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management/list?_ts=${Date.now()}`;
    try {
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
        if (!hasRetried && response.status === 401 && details.includes('Invalid JWT')) {
          await supabase.auth.refreshSession();
          await loadUsers(true);
          return;
        }
        setError(`${t.errorOccurred}: ${details}`);
        return;
      }

      if (Array.isArray(result.users)) {
        const mapped = (result.users as UserManagementUser[]).map((u) => ({
          id: u.id,
          email: u.email || '',
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          role: u.role || 'staff',
        }));
        mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setUsers(mapped);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorOccurred);
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

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError(t.notAuthenticated);
      setLoading(false);
      return;
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management/create`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
          role,
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

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError(t.notAuthenticated);
      return;
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management/delete/${userId}`;
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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

  const handleRoleChange = async (userId: string, nextRole: 'staff' | 'manager' | 'admin') => {
    if (userId === currentUser?.id) {
      setRoleErrorByUserId((prev) => ({ ...prev, [userId]: t.cannotChangeOwnRole }));
      return;
    }

    const previousRole = users.find((u) => u.id === userId)?.role ?? 'staff';
    setRoleErrorByUserId((prev) => ({ ...prev, [userId]: '' }));
    setRoleSuccessByUserId((prev) => ({ ...prev, [userId]: false }));
    setRoleSavingByUserId((prev) => ({ ...prev, [userId]: true }));
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u)));

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: previousRole } : u)));
        setRoleErrorByUserId((prev) => ({ ...prev, [userId]: t.notAuthenticated }));
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management/update-role`;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: nextRole }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: previousRole } : u)));
        const msg = typeof result.error === 'string' ? result.error : t.errorOccurred;
        setRoleErrorByUserId((prev) => ({ ...prev, [userId]: msg }));
        return;
      }

      setRoleSuccessByUserId((prev) => ({ ...prev, [userId]: true }));
      setTimeout(() => {
        setRoleSuccessByUserId((prev) => ({ ...prev, [userId]: false }));
      }, 2000);
    } catch (err) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: previousRole } : u)));
      setRoleErrorByUserId((prev) => ({
        ...prev,
        [userId]: err instanceof Error ? err.message : t.errorOccurred,
      }));
    } finally {
      setRoleSavingByUserId((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const openResetForm = (userId: string) => {
    setResetOpenForUserId(userId);
    setNewPasswordInput('');
    setConfirmNewPasswordInput('');
    setResetError('');
    setResetSuccess('');
  };

  const closeResetForm = () => {
    setResetOpenForUserId(null);
    setNewPasswordInput('');
    setConfirmNewPasswordInput('');
    setResetError('');
    setResetSuccess('');
  };

  const handleResetPassword = async (targetUserId: string) => {
    setResetError('');
    setResetSuccess('');

    if (!newPasswordInput || !confirmNewPasswordInput) {
      setResetError(t.fillAllFields);
      return;
    }

    if (newPasswordInput.length < 8) {
      setResetError(t.passwordMinLength);
      return;
    }

    if (newPasswordInput !== confirmNewPasswordInput) {
      setResetError(t.passwordsDontMatch);
      return;
    }

    setResetLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setResetError(t.notAuthenticated);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management/reset-password`;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: targetUserId, newPassword: newPasswordInput }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        setResetError(typeof result.error === 'string' ? result.error : t.errorOccurred);
        return;
      }

      setResetSuccess(t.passwordResetSuccess);
      setTimeout(() => {
        closeResetForm();
      }, 800);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : t.errorOccurred);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        eyebrow={t.users}
        title={t.users}
        description={t.manageUsers}
        icon={Users}
        actions={
          <button type="button" onClick={() => setShowForm(!showForm)} className="cockpit-btn-primary">
            <Plus className="h-4 w-4" />
            {t.addNewUser}
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
              <label className="cockpit-label mb-2">{t.emailAddress}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="cockpit-input"
              />
            </div>

            <div>
              <label className="cockpit-label mb-2">{t.password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="cockpit-input"
              />
            </div>

            <div>
              <label className="cockpit-label mb-2">{t.confirmPassword}</label>
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
                {t.cancel}
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
                <th className="cockpit-th">{t.user}</th>
                <th className="cockpit-th">{t.createdAt}</th>
                <th className="cockpit-th">{t.lastSignIn}</th>
                <th className="cockpit-th">{t.newUserRole}</th>
                <th className="cockpit-th text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr className="cockpit-tr">
                  <td colSpan={5} className="cockpit-td py-10 text-center text-slate-500 dark:text-slate-400">
                    {t.noUsersFound}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isCurrentUser = user.id === currentUser?.id;
                  const roleSaving = Boolean(roleSavingByUserId[user.id]);
                  const roleSaved = Boolean(roleSuccessByUserId[user.id]);
                  const roleError = roleErrorByUserId[user.id] ?? '';
                  const resetOpen = resetOpenForUserId === user.id;

                  return (
                    <Fragment key={user.id}>
                      <tr className="cockpit-tr">
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
                        <td className="cockpit-td text-sm text-slate-700 dark:text-slate-200">
                          {isCurrentUser ? (
                            <div>
                              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:text-slate-300">
                                <Lock className="h-3.5 w-3.5" />
                                <span>{user.role}</span>
                              </div>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.cannotChangeOwnRole}</p>
                            </div>
                          ) : (
                            <div>
                              <div className="inline-flex items-center gap-2">
                                <select
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value as 'staff' | 'manager' | 'admin')}
                                  disabled={roleSaving}
                                  aria-label={t.changeRole}
                                  className="cockpit-select min-w-[130px] py-1.5 text-sm"
                                >
                                  <option value="staff">{t.userRoleStaff}</option>
                                  <option value="manager">{t.userRoleManager}</option>
                                  <option value="admin">{t.userRoleAdmin}</option>
                                </select>
                                {roleSaving ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : null}
                                {roleSaved ? <Check className="h-4 w-4 text-emerald-500" /> : null}
                              </div>
                              {roleSaved ? <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{t.roleUpdated}</p> : null}
                              {roleError ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{roleError}</p> : null}
                            </div>
                          )}
                        </td>
                        <td className="cockpit-td text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => (resetOpen ? closeResetForm() : openResetForm(user.id))}
                              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-500/10 dark:text-slate-300"
                              title={t.resetPassword}
                            >
                              <KeyRound className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id)}
                              className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
                              title={`${t.delete} ${t.user}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {resetOpen ? (
                        <tr className="cockpit-tr">
                          <td colSpan={5} className="cockpit-td">
                            <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/40">
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <label className="cockpit-label mb-2">{t.newPassword}</label>
                                  <input
                                    type="password"
                                    value={newPasswordInput}
                                    onChange={(e) => setNewPasswordInput(e.target.value)}
                                    className="cockpit-input"
                                    placeholder={t.newPassword}
                                  />
                                </div>
                                <div>
                                  <label className="cockpit-label mb-2">{t.confirmNewPassword}</label>
                                  <input
                                    type="password"
                                    value={confirmNewPasswordInput}
                                    onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                                    className="cockpit-input"
                                    placeholder={t.confirmNewPassword}
                                  />
                                </div>
                              </div>
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t.passwordMinLength}</p>
                              {resetError ? <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{resetError}</p> : null}
                              {resetSuccess ? <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{resetSuccess}</p> : null}
                              <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleResetPassword(user.id)}
                                  disabled={resetLoading}
                                  className="cockpit-btn-primary disabled:opacity-40"
                                >
                                  {resetLoading ? (
                                    <span className="inline-flex items-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      {t.saving}
                                    </span>
                                  ) : (
                                    t.resetPassword
                                  )}
                                </button>
                                <button type="button" onClick={closeResetForm} className="cockpit-btn-ghost">
                                  {t.cancel}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
