import { useState } from 'react';
import { Button, Input, Segmented, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Navigate, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useRIAStore } from '../store/useRIAStore';
import { seed } from '../data/seed';
import { isSupabaseConfigured } from '../lib/supabase';
import { theme } from '../styles/theme';

const Screen = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.muted};
  padding: 24px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 32px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.card};
`;

const Legend = styled.div`
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

// Owner rows read as pickable cards rather than a dropdown — the identity you sign in as is
// the one decision on this screen, so it is visible instead of hidden behind a control.
const OwnerOption = styled.label<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid
    ${({ $selected, theme }) => ($selected ? theme.colors.brandBorder : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ $selected, theme }) => ($selected ? theme.colors.brandSoft : theme.colors.surface)};
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;

  & + & {
    margin-top: 6px;
  }

  &:hover {
    background: ${({ $selected, theme }) => ($selected ? theme.colors.brandSoft : theme.colors.muted)};
  }

  input {
    width: 16px;
    height: 16px;
    accent-color: ${({ theme }) => theme.colors.brand};
  }
`;

// Primary demo accounts surfaced as sign-in identities (Scenario 5 hero first).
const DEMO_EMAILS = ['somchai@thaiorchid.test', 'gina@pizzacorner.test', 'marco@bellanapoli.test'];

export default function LoginPage() {
  const navigate = useNavigate();
  const signIn = useRIAStore((s) => s.signIn);
  const signUp = useRIAStore((s) => s.signUp);
  const currentUserId = useRIAStore((s) => s.currentUserId);
  const authBusy = useRIAStore((s) => s.authBusy);
  const authError = useRIAStore((s) => s.authError);
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState(DEMO_EMAILS[0]);
  const [password, setPassword] = useState('');
  // Which field the message belongs to, so the ring lands on the offending input rather
  // than on whichever one happens to support a status prop.
  const [error, setError] = useState<{ field: 'email' | 'password'; message: string } | null>(null);

  if (currentUserId) return <Navigate to="/dashboard" replace />;

  // The field is the answer: picking an owner fills it, typing replaces it.
  const submit = async () => {
    const value = email.trim();
    if (!value) {
      setError({ field: 'email', message: 'Pick an owner above or type an email.' });
      return;
    }

    // Without Supabase there is no password to check — the email just picks an owner.
    if (!isSupabaseConfigured) {
      if (await signIn(value, '')) navigate('/dashboard');
      else setError({ field: 'email', message: 'No owner found for that email.' });
      return;
    }

    if (password.length < 6) {
      setError({ field: 'password', message: 'Supabase requires a password of at least 6 characters.' });
      return;
    }
    setError(null);
    const ok = mode === 'signIn' ? await signIn(value, password) : await signUp(value, password);
    if (ok) navigate('/dashboard');
  };

  return (
    <Screen>
      <Card>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>RIA</span>
            <span
              style={{
                padding: '2px 6px',
                borderRadius: 4,
                background: theme.colors.brandSoft,
                color: theme.colors.brand,
                fontFamily: theme.font.mono,
                fontSize: 10,
                fontWeight: 500,
              }}
            >
              impact loop
            </span>
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Experience.com — close the loop on negative feedback
          </Typography.Text>
        </div>

        {isSupabaseConfigured ? (
          <Segmented
            block
            style={{ marginBottom: 20 }}
            value={mode}
            onChange={(v) => {
              setMode(v as 'signIn' | 'signUp');
              setError(null);
            }}
            options={[
              { label: 'Sign in', value: 'signIn' },
              { label: 'Create account', value: 'signUp' },
            ]}
          />
        ) : null}

        <fieldset style={{ margin: '0 0 20px', padding: 0, border: 'none' }}>
          <Legend as="legend">Sign in as</Legend>
          {DEMO_EMAILS.map((e) => {
            const user = seed.users.find((u) => u.email === e);
            // Checked when the field holds this owner's address — so typing a different one
            // clears the selection on its own, with no second piece of state to keep in sync.
            const isSelected = email.trim().toLowerCase() === e.toLowerCase();
            return (
              <OwnerOption key={e} $selected={isSelected}>
                <input
                  type="radio"
                  name="owner"
                  value={e}
                  checked={isSelected}
                  onChange={() => {
                    setEmail(e);
                    setError(null);
                  }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>
                    {user?.name ?? e}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      color: theme.colors.textMuted,
                      fontFamily: theme.font.mono,
                      fontSize: 10.5,
                    }}
                  >
                    {e}
                  </span>
                </span>
              </OwnerOption>
            );
          })}
        </fieldset>

        <div style={{ marginBottom: 20 }}>
          <Legend as="label" htmlFor="owner-email">
            Owner email
          </Legend>
          <Input
            id="owner-email"
            placeholder="owner@restaurant.test"
            value={email}
            status={error?.field === 'email' ? 'error' : undefined}
            onChange={(ev) => {
              setEmail(ev.target.value);
              setError(null);
            }}
            onPressEnter={() => void submit()}
          />
        </div>

        {isSupabaseConfigured ? (
          <div style={{ marginBottom: 20 }}>
            <Legend as="label" htmlFor="owner-password">
              Password
            </Legend>
            <Input.Password
              id="owner-password"
              placeholder={mode === 'signUp' ? 'At least 6 characters' : 'Your password'}
              status={error?.field === 'password' ? 'error' : undefined}
              value={password}
              onChange={(ev) => {
                setPassword(ev.target.value);
                setError(null);
              }}
              onPressEnter={() => void submit()}
            />
          </div>
        ) : null}

        {error || authError ? (
          <div
            style={{
              marginBottom: 16,
              padding: '8px 10px',
              border: `1px solid ${theme.colors.tone.danger.bg}`,
              borderRadius: theme.radius.sm,
              background: theme.colors.tone.danger.bg,
              color: theme.colors.tone.danger.fg,
              fontSize: 11.5,
              lineHeight: 1.5,
            }}
          >
            {error?.message ?? authError}
          </div>
        ) : null}

        <Button type="primary" size="large" block loading={authBusy} onClick={() => void submit()}>
          {mode === 'signUp' ? 'Create account' : 'Sign in'}
          <ArrowRightOutlined />
        </Button>

        <Typography.Paragraph
          type="secondary"
          style={{
            margin: '16px 0 0',
            paddingTop: 12,
            borderTop: `1px solid ${theme.colors.border}`,
            fontSize: 11,
            lineHeight: 1.6,
          }}
        >
          {isSupabaseConfigured
            ? 'Signed in against Supabase. Row-level security decides which reviews the API returns — switching owners changes the data, not just the view. First time on a seeded owner? Create the account with that email and the signup trigger claims the matching owner row.'
            : 'Demo data only — no password, no network. Each owner sees the restaurants on their own account; switching owners switches the entire review set.'}
        </Typography.Paragraph>
      </Card>
    </Screen>
  );
}
