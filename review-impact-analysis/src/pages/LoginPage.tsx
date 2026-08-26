import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, Tag } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useRIAStore } from '../store/useRIAStore';
import { seed } from '../data/seed';

const Screen = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f6feb 0%, #1552b0 100%);
  padding: 24px;
`;

// Primary demo accounts surfaced as quick-pick chips (Scenario 5 hero first).
const DEMO_EMAILS = ['somchai@thaiorchid.test', 'gina@pizzacorner.test', 'marco@bellanapoli.test'];

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useRIAStore((s) => s.login);
  const currentUserId = useRIAStore((s) => s.currentUserId);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (currentUserId) return <Navigate to="/dashboard" replace />;

  const submit = (value: string) => {
    if (login(value)) navigate('/dashboard');
    else setError('No owner found for that email.');
  };

  return (
    <Screen>
      <Card style={{ width: 420, borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Typography.Text style={{ color: '#1f6feb', letterSpacing: 1, fontSize: 12 }}>EXPERIENCE.COM · XMP</Typography.Text>
          <Typography.Title level={3} style={{ margin: '6px 0 0' }}>Review Impact Analysis</Typography.Title>
          <Typography.Text type="secondary">Close the loop on negative feedback</Typography.Text>
        </div>
        <Form layout="vertical" onFinish={() => submit(email)}>
          <Form.Item label="Owner email" validateStatus={error ? 'error' : ''} help={error ?? undefined}>
            <Input
              placeholder="somchai@thaiorchid.test"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              onPressEnter={() => submit(email)}
            />
          </Form.Item>
          <Button type="primary" block htmlType="submit">Sign in</Button>
        </Form>
        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Demo owners:</Typography.Text>
          <Space wrap style={{ marginTop: 8 }}>
            {DEMO_EMAILS.map((e) => {
              const name = seed.users.find((u) => u.email === e)?.name ?? e;
              return (
                <Tag key={e} color="blue" style={{ cursor: 'pointer' }} onClick={() => { setEmail(e); submit(e); }}>
                  {name}
                </Tag>
              );
            })}
          </Space>
        </div>
      </Card>
    </Screen>
  );
}
