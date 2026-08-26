import { Card, Empty, Row, Col, Statistic } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PeerComparisonResult } from '../../types';
import { ChartFrame } from '../../styles/ChartFrame';

export function PeerComparison({ peer }: { peer: PeerComparisonResult | null }) {
  if (!peer) {
    return (
      <Card title="Peer comparison">
        <Empty description="No comparable peer offerings for this item" />
      </Card>
    );
  }
  const data = [{ name: peer.itemName, Mine: peer.myAvgRating, 'Peer avg': peer.peerAvgRating }];
  return (
    <Card title={`Peer comparison · ${peer.itemName}`}>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <ChartFrame $height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Mine" fill="#1f6feb" />
                <Bar dataKey="Peer avg" fill="#b0bec5" />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Col>
        <Col xs={24} md={12}>
          <Row gutter={[16, 16]}>
            <Col span={12}><Statistic title="My price" value={peer.myPrice} prefix="$" precision={2} /></Col>
            <Col span={12}><Statistic title="Peer avg price" value={peer.peerAvgPrice} prefix="$" precision={2} /></Col>
            <Col span={12}><Statistic title="Price vs peers" value={peer.priceDeltaPct} suffix="%" precision={1} valueStyle={{ color: peer.priceDeltaPct > 0 ? '#d32f2f' : '#2e7d32' }} /></Col>
            <Col span={12}><Statistic title="Rating gap" value={peer.ratingGap} suffix="★" precision={1} valueStyle={{ color: peer.ratingGap < 0 ? '#d32f2f' : '#2e7d32' }} /></Col>
            <Col span={12}><Statistic title="Rank" value={`${peer.rank} / ${peer.peerCount + 1}`} /></Col>
            <Col span={12}><Statistic title="Price percentile" value={peer.pricePercentile} suffix="th" /></Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
}
