import { Card, Collapse, Empty, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { theme } from '../styles/theme';
import evalHistory from '../data/evalHistory.json';
import type { EvalCaseResult, EvalCheckResult, EvalJudgeDimension, EvalRun } from '../types/evals';

const { colors } = theme;
const runs = evalHistory as EvalRun[];

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function CheckRow({ pass, label, detail }: { pass: boolean; label: string; detail: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0', fontSize: 13 }}>
      {pass ? (
        <CheckCircleOutlined style={{ color: colors.success, marginTop: 2 }} />
      ) : (
        <CloseCircleOutlined style={{ color: colors.danger, marginTop: 2 }} />
      )}
      <span>
        <strong>{label}</strong> — <span style={{ color: colors.textMuted }}>{detail}</span>
      </span>
    </div>
  );
}

function CasePanel({ result }: { result: EvalCaseResult }) {
  if (result.error) {
    return <CheckRow pass={false} label="model call" detail={result.error} />;
  }
  const codeChecks: EvalCheckResult[] = result.codeChecks ?? [];
  const judge: [string, EvalJudgeDimension][] = Object.entries(result.judge ?? {});
  return (
    <div>
      {codeChecks.map((c) => (
        <CheckRow key={c.name} pass={c.pass} label={c.name} detail={c.detail} />
      ))}
      {judge.map(([key, v]) => (
        <CheckRow key={key} pass={v.pass} label={`[judge] ${key}`} detail={v.reason} />
      ))}
    </div>
  );
}

function caseFailCount(result: EvalCaseResult): number {
  if (result.error) return 1;
  const codeFails = (result.codeChecks ?? []).filter((c) => !c.pass).length;
  const judgeFails = Object.values(result.judge ?? {}).filter((v) => !v.pass).length;
  return codeFails + judgeFails;
}

function RunCard({ run }: { run: EvalRun }) {
  return (
    <Card
      title={
        <span>
          {new Date(run.timestamp).toLocaleString()} <Typography.Text type="secondary">· {run.model}</Typography.Text>
        </span>
      }
      extra={
        <Space size={6}>
          <Tag color={run.summary.errored > 0 ? 'error' : 'default'}>{run.summary.errored} errored</Tag>
          <Tag color={run.summary.codePassRate === 1 ? 'success' : 'warning'}>code {pct(run.summary.codePassRate)}</Tag>
          <Tag color={run.summary.judgePassRate === 1 ? 'success' : 'warning'}>judge {pct(run.summary.judgePassRate)}</Tag>
        </Space>
      }
    >
      <Collapse>
        {run.cases.map((c) => {
          const fails = caseFailCount(c);
          return (
            <Collapse.Panel
              key={c.id}
              header={
                <span>
                  {c.label}{' '}
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    ({c.id})
                  </Typography.Text>
                  {fails > 0 ? (
                    <Tag color="error" style={{ marginLeft: 8 }}>
                      {fails} failed
                    </Tag>
                  ) : (
                    <Tag color="success" style={{ marginLeft: 8 }}>
                      all passed
                    </Tag>
                  )}
                </span>
              }
            >
              <CasePanel result={c} />
            </Collapse.Panel>
          );
        })}
      </Collapse>
    </Card>
  );
}

export default function EvalsPage() {
  const ordered = [...runs].reverse(); // most recent first

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="Eval history · /api/analyze">
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Results from <code>yarn eval:analyze</code>, committed to <code>src/data/evalHistory.json</code> each time
          it's run. Code-based checks are deterministic; judge checks are a second model grading the first against
          the endpoint's own rules — read as a strong signal, not ground truth.
        </Typography.Paragraph>
      </Card>

      {ordered.length === 0 ? (
        <Card>
          <Empty description="No eval runs recorded yet — run `yarn eval:analyze` locally, then commit the updated evalHistory.json" />
        </Card>
      ) : (
        ordered.map((run) => <RunCard key={run.timestamp} run={run} />)
      )}
    </Space>
  );
}
