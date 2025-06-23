import React from 'react';
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Area, ComposedChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface MedicalVisualizationsProps {
  clinicalRadarData: any[];
  progressData: any[];
  clinicalRiskData: any[];
  decisionTree: any;
  medicalColors: any;
}

const MedicalVisualizations: React.FC<MedicalVisualizationsProps> = ({
  clinicalRadarData,
  progressData,
  clinicalRiskData,
  decisionTree,
  medicalColors
}) => {
  return (
    <div>
      {/* Clinical Radar Chart - Domain Assessment */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: 20, 
        borderRadius: 8,
        border: '1px solid #e9ecef',
        marginBottom: 20
      }}>
        <h3 style={{ color: '#333', marginTop: 0, marginBottom: 16 }}>📊 Clinical Domain Assessment (Radar Chart)</h3>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Multi-domain clinical assessment showing performance across key developmental areas (0-100 scale)
        </p>
        <div style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={clinicalRadarData}>
              <PolarGrid stroke="#e0e0e0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#333' }} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: '#666' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Radar
                name="Clinical Score"
                dataKey="A"
                stroke={medicalColors.primary}
                fill={medicalColors.primary}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Clinical Score']}
                labelFormatter={(label) => `Domain: ${label}`}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress Chart - Session Progress */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: 20, 
        borderRadius: 8,
        border: '1px solid #e9ecef',
        marginBottom: 20
      }}>
        <h3 style={{ color: '#333', marginTop: 0, marginBottom: 16 }}>📈 Session Progress Analysis</h3>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Performance progression throughout the screening session with baseline and target indicators
        </p>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="session" 
                tick={{ fontSize: 12, fill: '#333' }}
                label={{ value: 'Session Progress', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#666' }}
                label={{ value: 'Clinical Score (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value}%`, 
                  name === 'score' ? 'Current Score' : 
                  name === 'baseline' ? 'Baseline' : 'Target'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="target" 
                fill={medicalColors.success} 
                fillOpacity={0.1}
                stroke={medicalColors.success}
                strokeWidth={1}
                strokeDasharray="5 5"
              />
              <Area 
                type="monotone" 
                dataKey="baseline" 
                fill={medicalColors.neutral} 
                fillOpacity={0.1}
                stroke={medicalColors.neutral}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke={medicalColors.primary} 
                strokeWidth={3}
                dot={{ fill: medicalColors.primary, strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8, stroke: medicalColors.primary, strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clinical Risk Heatmap */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: 20, 
        borderRadius: 8,
        border: '1px solid #e9ecef',
        marginBottom: 20
      }}>
        <h3 style={{ color: '#333', marginTop: 0, marginBottom: 16 }}>⚠️ Clinical Risk Assessment Heatmap</h3>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Color-coded risk levels across clinical domains with severity indicators
        </p>
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clinicalRiskData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                type="number" 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12, fill: '#666' }}
                label={{ value: 'Risk Score (%)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="category" 
                dataKey="domain" 
                width={140}
                tick={{ fontSize: 11, fill: '#333' }}
              />
              <Tooltip 
                formatter={(value: number, _name: string) => [`${value}% risk`, 'Risk Level']}
                labelFormatter={(label) => `Domain: ${label}`}
              />
              <Bar 
                dataKey="riskScore" 
                fill="#8884d8"
                radius={[0, 4, 4, 0]}
              >
                {clinicalRiskData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Risk Legend */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 20, 
          marginTop: 16,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, backgroundColor: '#28a745', borderRadius: 4 }}></div>
            <span style={{ fontSize: 14 }}>Low Risk (0-40%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, backgroundColor: '#ffc107', borderRadius: 4 }}></div>
            <span style={{ fontSize: 14 }}>Medium Risk (40-60%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, backgroundColor: '#fd7e14', borderRadius: 4 }}></div>
            <span style={{ fontSize: 14 }}>High Risk (60-80%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, backgroundColor: '#dc3545', borderRadius: 4 }}></div>
            <span style={{ fontSize: 14 }}>Critical Risk (80-100%)</span>
          </div>
        </div>
      </div>

      {/* Clinical Decision Tree */}
      {decisionTree && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: 20, 
          borderRadius: 8,
          border: '1px solid #e9ecef',
          marginBottom: 20
        }}>
          <h3 style={{ color: '#333', marginTop: 0, marginBottom: 16 }}>🔄 Clinical Decision Tree</h3>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            Evidence-based clinical pathway for next steps based on assessment results
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: 20 
          }}>
            {/* Assessment Level */}
            <div style={{ 
              background: 'white', 
              padding: 16, 
              borderRadius: 8, 
              border: '2px solid #e9ecef',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Assessment Level</h4>
              <div style={{ 
                padding: '8px 16px', 
                borderRadius: 20, 
                display: 'inline-block',
                backgroundColor: decisionTree.assessment === 'High' ? '#dc3545' :
                               decisionTree.assessment === 'Medium' ? '#ffc107' : '#28a745',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 16
              }}>
                {decisionTree.assessment} Risk
              </div>
            </div>

            {/* Urgency */}
            <div style={{ 
              background: 'white', 
              padding: 16, 
              borderRadius: 8, 
              border: '2px solid #e9ecef',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Clinical Urgency</h4>
              <div style={{ 
                padding: '8px 16px', 
                borderRadius: 20, 
                display: 'inline-block',
                backgroundColor: decisionTree.urgency === 'Immediate' ? '#dc3545' :
                               decisionTree.urgency === 'Within 3 months' ? '#ffc107' : '#28a745',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 16
              }}>
                {decisionTree.urgency}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ color: '#333', marginBottom: 12 }}>Recommended Clinical Pathway:</h4>
            <div style={{ 
              background: 'white', 
              padding: 16, 
              borderRadius: 8, 
              border: '1px solid #e9ecef'
            }}>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                {decisionTree.nextSteps.map((step: string, index: number) => (
                  <li key={index} style={{ 
                    marginBottom: 8, 
                    fontSize: 14, 
                    lineHeight: 1.5, 
                    color: '#444' 
                  }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalVisualizations; 