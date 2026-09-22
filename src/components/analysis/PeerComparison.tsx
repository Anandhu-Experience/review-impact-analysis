import { Card, Empty, Row, Col, Statistic } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PeerComparisonResult } from '../../types';
import { ChartFrame } from '../../styles/ChartFrame';
import { CountLink } from '../common/CountLink';

interface PeerComparisonProps {
  peer: PeerComparisonResult | null;
  /** Drill into my own reviews for this catalog item. Peer bars stay inert — those reviews
   *  belong to other restaurants and are not in this owner's visible set. */
  onSelectMyItem?: (catalogItemId: string) => void;
}

export function PeerComparison({ peer, onSelectMyItem }: PeerComparisonProps) {
  if (!peer) {
    return (
      <Card title="Peer comparison" data-tour="analysis-peer">
        <Empty description="No comparable peer offerings for this item" />
      </Card>
    );
  }
  const data = [{ name: peer.itemName, Mine: peer.myAvgRating, 'Peer avg': peer.peerAvgRating }];
  const drill = onSelectMyItem ? () => onSelectMyItem(peer.catalogItemId) : undefined;
  return (
    <Card
      data-tour="analysis-peer"
      title={`Peer comparison · ${peer.itemName}`}
      extra={
        drill ? (
          <CountLink onClick={drill} title={`View my ${peer.itemName} reviews`}>
            My {peer.itemName} reviews
          </CountLink>
        ) : null
      }
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <ChartFrame $height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                <Tooltip cursor={{ fill: 'rgba(27,77,177,0.06)' }} />
                <Legend />
                <Bar dataKey="Mine" fill="#1b4db1" cursor={drill ? 'pointer' : undefined} onClick={drill} />
                <Bar dataKey="Peer avg" fill="#cfd4dc" />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Col>
        <Col xs={24} md={12}>
          <Row gutter={[16, 16]}>
            <Col span={12}><Statistic title="My price" value={peer.myPrice} prefix="$" precision={2} /></Col>
            <Col span={12}><Statistic title="Peer avg price" value={peer.peerAvgPrice} prefix="$" precision={2} /></Col>
            <Col span={12}><Statistic title="Price vs peers" value={peer.priceDeltaPct} suffix="%" precision={1} valueStyle={{ color: peer.priceDeltaPct > 0 ? '#b42318' : '#067647' }} /></Col>
            <Col span={12}><Statistic title="Rating gap" value={peer.ratingGap} suffix="★" precision={1} valueStyle={{ color: peer.ratingGap < 0 ? '#b42318' : '#067647' }} /></Col>
            <Col span={12}><Statistic title="Rank" value={`${peer.rank} / ${peer.peerCount + 1}`} /></Col>
            <Col span={12}><Statistic title="Price percentile" value={peer.pricePercentile} suffix="th" /></Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
}
