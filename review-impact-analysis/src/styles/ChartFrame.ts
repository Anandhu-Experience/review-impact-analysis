import styled from 'styled-components';

// Recharts ResponsiveContainer collapses to 0 height inside an antd Card body.
// Always wrap a chart in this fixed-height frame (Top Risk #6). Default = theme.chart.md.
export const ChartFrame = styled.div<{ $height?: number }>`
  width: 100%;
  height: ${({ $height, theme }) => $height ?? theme.chart.md}px;
`;
