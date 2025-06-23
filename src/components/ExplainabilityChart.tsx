import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ExplainabilityData } from '../types';
import './ExplainabilityChart.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ExplainabilityChartProps {
  data: ExplainabilityData;
}

const ExplainabilityChart: React.FC<ExplainabilityChartProps> = ({ data }) => {
  const featureImportanceData = {
    labels: Object.keys(data.featureImportance),
    datasets: [
      {
        label: 'Feature Importance',
        data: Object.values(data.featureImportance),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const attentionWeightsData = {
    labels: data.attentionWeights.map((_, index) => `Step ${index + 1}`),
    datasets: [
      {
        label: 'Attention Weights',
        data: data.attentionWeights,
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Model Explainability Analysis',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
      },
    },
  };

  return (
    <div className="explainability-chart">
      <div className="chart-header">
        <h3>Model Explainability</h3>
        <p>Understanding how the AI model makes decisions</p>
        <div className="model-info">
          <span>Model Version: {data.modelVersion}</span>
        </div>
      </div>
      
      <div className="charts-container">
        <div className="chart-section">
          <h4>Feature Importance</h4>
          <p>Shows which input features most influence the model's decisions</p>
          <div className="chart-wrapper">
            <Bar data={featureImportanceData} options={options} />
          </div>
        </div>
        
        <div className="chart-section">
          <h4>Attention Weights</h4>
          <p>Indicates which parts of the input the model focuses on</p>
          <div className="attention-weights">
            {data.attentionWeights.map((weight, index) => (
              <div key={index} className="weight-item">
                <span className="weight-label">Step {index + 1}</span>
                <div className="weight-bar">
                  <div 
                    className="weight-fill" 
                    style={{ width: `${weight * 100}%` }}
                  />
                </div>
                <span className="weight-value">{(weight * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="chart-section">
          <h4>Confidence Heatmap</h4>
          <p>Visualizes the model's confidence across different input regions</p>
          <div className="heatmap">
            {data.confidenceHeatmap.map((row, rowIndex) => (
              <div key={rowIndex} className="heatmap-row">
                {row.map((value, colIndex) => (
                  <div
                    key={colIndex}
                    className="heatmap-cell"
                    style={{
                      backgroundColor: `rgba(54, 162, 235, ${value})`,
                      color: value > 0.5 ? 'white' : 'black'
                    }}
                    title={`Confidence: ${(value * 100).toFixed(1)}%`}
                  >
                    {(value * 100).toFixed(0)}%
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        <div className="chart-section">
          <h4>Decision Path</h4>
          <p>Shows the step-by-step reasoning process of the model</p>
          <div className="decision-path">
            {data.decisionPath.map((step, index) => (
              <div key={index} className="decision-step">
                <div className="step-number">{index + 1}</div>
                <div className="step-content">{step}</div>
                {index < data.decisionPath.length - 1 && (
                  <div className="step-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityChart; 