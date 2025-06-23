import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface ReasoningFactor {
  factor: string;
  impact: number;
}

interface ReasoningVisualizerProps {
  question: string;
  reasoning: ReasoningFactor[];
  isVisible?: boolean;
}

const ReasoningVisualizer: React.FC<ReasoningVisualizerProps> = ({
  question,
  reasoning,
  isVisible = true
}) => {
  if (!isVisible || reasoning.length === 0) {
    return null;
  }

  // Sort reasoning factors by impact (highest first)
  const sortedReasoning = [...reasoning].sort((a, b) => b.impact - a.impact);

  const getColorByImpact = (impact: number): string => {
    if (impact > 0.6) return '#dc3545'; // High impact - red
    if (impact > 0.3) return '#ffc107'; // Medium impact - yellow
    return '#28a745'; // Low impact - green
  };

  // Prepare data for Recharts
  const chartData = sortedReasoning.map(item => ({
    factor: item.factor,
    impact: item.impact,
    fill: getColorByImpact(item.impact),
  }));

  const formatImpact = (value: number) => `${(value * 100).toFixed(0)}%`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const impact = payload[0].value;
      const impactPercent = formatImpact(impact);
      const color = getColorByImpact(impact);
      
      return (
        <div style={{
          background: '#ffffff',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 12,
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          color: '#333'
        }}>
          <p style={{ 
            margin: 0, 
            fontWeight: 'bold', 
            color: '#333',
            fontSize: 14,
            borderBottom: '1px solid #eee',
            paddingBottom: 4,
            marginBottom: 6
          }}>
            {label}
          </p>
          <p style={{ 
            margin: 0, 
            color: '#666',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ 
              width: 8, 
              height: 8, 
              background: color, 
              borderRadius: '50%',
              display: 'inline-block'
            }}></span>
            <strong>{impactPercent} influence</strong>
          </p>
          <p style={{ 
            margin: '4px 0 0 0', 
            color: '#888',
            fontSize: 12,
            fontStyle: 'italic'
          }}>
            {impact > 0.6 ? 'High impact factor' : 
             impact > 0.3 ? 'Medium impact factor' : 'Low impact factor'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      background: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: 12,
      padding: 20,
      margin: '16px 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ 
          margin: '0 0 8px 0', 
          color: '#333', 
          fontSize: 16, 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          🤔 Why this question was asked
        </h4>
        <p style={{ 
          margin: 0, 
          color: '#666', 
          fontSize: 14,
          fontStyle: 'italic'
        }}>
          Based on your previous responses and emotional state
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{
          background: '#e3f2fd',
          border: '1px solid #bbdefb',
          borderRadius: 8,
          padding: 12,
          fontSize: 14,
          lineHeight: 1.4
        }}>
          <strong>Current Question:</strong> {question}
        </div>
      </div>

      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              type="number" 
              domain={[0, 1]}
              tickFormatter={formatImpact}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis 
              type="category" 
              dataKey="factor" 
              width={200}
              tick={{ fontSize: 11, fill: '#333' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="impact" 
              fill="#61dafb"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        background: '#fff', 
        borderRadius: 8,
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
          <strong>Impact Legend:</strong>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ 
              width: 12, 
              height: 12, 
              background: '#dc3545', 
              borderRadius: 2 
            }}></div>
            <span>High (&gt;60%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ 
              width: 12, 
              height: 12, 
              background: '#ffc107', 
              borderRadius: 2 
            }}></div>
            <span>Medium (30-60%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ 
              width: 12, 
              height: 12, 
              background: '#28a745', 
              borderRadius: 2 
            }}></div>
            <span>Low (≤30%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReasoningVisualizer; 