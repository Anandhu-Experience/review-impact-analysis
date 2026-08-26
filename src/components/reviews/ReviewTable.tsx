import { Table, Rate, Tag, Button, Space } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import type { ProblemCategory, Review, Sentiment } from '../../types';
import { sentimentTagColor } from '../../ui/format';

interface ReviewTableProps {
  reviews: Review[];
  classify: (review: Review) => { categories: ProblemCategory[]; sentiment: Sentiment; isNegative: boolean };
  itemNameOf?: (review: Review) => string;
  onAnalyze: (reviewId: string) => void;
  loading?: boolean;
}

export function ReviewTable({ reviews, classify, itemNameOf, onAnalyze, loading }: ReviewTableProps) {
  return (
    <Table
      rowKey="id"
      size="middle"
      loading={loading}
      dataSource={reviews}
      pagination={{ pageSize: 8, hideOnSinglePage: true }}
      onRow={(r) => ({ onClick: () => onAnalyze(r.id), style: { cursor: 'pointer' } })}
      columns={[
        { title: 'Rating', dataIndex: 'rating', width: 140, render: (v: number) => <Rate disabled value={v} style={{ fontSize: 14 }} /> },
        { title: 'Comment', dataIndex: 'comment', ellipsis: true },
        { title: 'Item', dataIndex: 'catalogItemId', width: 140, render: (_: string, r: Review) => itemNameOf?.(r) ?? r.foodCategory },
        {
          title: 'Categories',
          key: 'cats',
          width: 200,
          render: (_: unknown, r: Review) => (
            <Space size={4} wrap>
              {classify(r).categories.map((c) => <Tag key={c}>{c}</Tag>)}
            </Space>
          ),
        },
        { title: 'Sentiment', key: 'sent', width: 110, render: (_: unknown, r: Review) => {
          const s = classify(r).sentiment;
          return <Tag color={sentimentTagColor[s]}>{s}</Tag>;
        } },
        { title: 'Price', dataIndex: 'price', width: 90, render: (v: number) => `$${v.toFixed(2)}` },
        { title: 'Date', dataIndex: 'date', width: 110 },
        {
          title: '',
          key: 'action',
          width: 60,
          render: (_: unknown, r: Review) => (
            <Button type="link" size="small" icon={<ArrowRightOutlined />} onClick={(e) => { e.stopPropagation(); onAnalyze(r.id); }} />
          ),
        },
      ]}
    />
  );
}
