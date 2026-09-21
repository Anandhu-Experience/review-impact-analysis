import { Card, Progress, Typography, Tag, Spin, Tooltip } from 'antd';
import { BulbOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { RootCause } from '../../types';
import type { AiRootCause } from '../../lib/aiAnalysis';
import { theme } from '../../styles/theme';
import { EvidenceCard } from './EvidenceCard';

export type AiState =
  | { status: 'loading' }
  | { status: 'ok'; result: AiRootCause; model: string }
  | { status: 'unavailable'; reason: string };

interface RootCauseCardProps {
  rootCause: RootCause;
  ai?: AiState;
}

/**
 * Shows the model's reading when there is one, and the deterministic one otherwise.
 *
 * Which produced what is labelled rather than blurred: a demo that quietly passes rule output
 * off as reasoning is worse than one that admits which is which. The rule-based result is
 * always computed, so the card has something to show while the model thinks and something to
 * keep if it never answers.
 */
export function RootCauseCard({ rootCause, ai }: RootCauseCardProps) {
  const aiResult = ai?.status === 'ok' ? ai.result : null;
  const statement = aiResult?.statement ?? rootCause.statement;
  const confidence = Math.round((aiResult?.confidence ?? rootCause.confidence) * 100);

  return (
    <Card
      title={
        <span>
          <BulbOutlined /> Likely root cause · {rootCause.category}
        </span>
      }
      extra={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Typography.Text type="secondary">Confidence</Typography.Text>
          <Progress type="circle" percent={confidence} width={44} />
        </span>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {ai?.status === 'loading' ? (
          <Tag icon={<Spin size="small" style={{ marginRight: 6 }} />} color="blue">
            Claude is reading the evidence…
          </Tag>
        ) : aiResult ? (
          <Tag icon={<ThunderboltOutlined />} color="blue">
            Reasoned by {ai?.status === 'ok' ? ai.model : 'Claude'}
          </Tag>
        ) : (
          <Tooltip title={ai?.status === 'unavailable' ? ai.reason : undefined}>
            <Tag>Rule-based analysis</Tag>
          </Tooltip>
        )}
      </div>

      <Typography.Paragraph style={{ fontSize: 15 }}>{statement}</Typography.Paragraph>

      {!aiResult ? <Tag color="blue" style={{ marginBottom: 8 }}>Beyond classification</Tag> : null}

      <div>
        {aiResult
          ? aiResult.evidence.map((e, i) => (
              <EvidenceCard key={i} evidence={{ type: 'metric', label: e.label, detail: e.detail }} />
            ))
          : rootCause.evidence.map((e, i) => <EvidenceCard key={i} evidence={e} />)}
      </div>

      {aiResult ? (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            border: `1px solid ${theme.colors.brandBorder}`,
            borderRadius: theme.radius.md,
            background: theme.colors.brandSoft,
          }}
        >
          <Typography.Text
            style={{
              display: 'block',
              marginBottom: 6,
              color: theme.colors.brand,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            What Claude would do about it
          </Typography.Text>
          <Typography.Text strong style={{ fontSize: 14 }}>
            {aiResult.remedy.title}
          </Typography.Text>
          <ul style={{ margin: '8px 0 6px', paddingLeft: 18, fontSize: 13 }}>
            {aiResult.remedy.steps.map((step) => (
              <li key={step} style={{ marginBottom: 2 }}>
                {step}
              </li>
            ))}
          </ul>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Expected impact: {aiResult.remedy.expectedImpact}
          </Typography.Text>
          {/* The tracked remedy below stays the authored one — action ids, scenario linkage
              and the before/after measurement all key off it. This is the model's read
              alongside it, not a replacement for it. */}
        </div>
      ) : null}
    </Card>
  );
}
