import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: 15, fontSize: '1.8rem' }}>Clinical Visualizations</h2>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: 40, 
        borderRadius: 16,
        border: '1px solid #e9ecef',
        marginBottom: 30
      }}>
        
        {/* Radar Chart Section */}
        <div style={{ marginBottom: 50 }}>
          <h3 style={{ color: '#333', marginBottom: 25, fontSize: '1.5rem', textAlign: 'center' }}>
            📊 DSM-5 Criteria Assessment Radar
          </h3>
          <div style={{ 
            background: 'white', 
            padding: 30, 
            borderRadius: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef'
          }}>
            <ResponsiveContainer width="100%" height={500}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={clinicalRadarData}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis 
                  dataKey="criterion" 
                  tick={{ fontSize: 14, fill: '#333' }}
                  tickLine={{ stroke: '#666' }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12, fill: '#666' }}
                  tickLine={{ stroke: '#ccc' }}
                />
                <Radar
                  name="Assessment Score"
                  dataKey="score"
                  stroke={medicalColors.primary}
                  fill={medicalColors.primary}
                  fillOpacity={0.6}
                  strokeWidth={3}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>
                <strong>Interpretation:</strong> Higher scores indicate greater clinical concerns. 
                Areas above 60% require immediate attention and follow-up evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Charts Section */}
        <div style={{ marginBottom: 50 }}>
          <h3 style={{ color: '#333', marginBottom: 25, fontSize: '1.5rem', textAlign: 'center' }}>
            📈 Developmental Progress Assessment
          </h3>
          <div style={{ 
            background: 'white', 
            padding: 30, 
            borderRadius: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef'
          }}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={progressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 14, fill: '#333' }}
                  tickLine={{ stroke: '#666' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#666' }}
                  tickLine={{ stroke: '#ccc' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ccc',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                />
                <Legend />
                <Bar dataKey="completed" fill={medicalColors.success} radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill={medicalColors.neutral} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>
                <strong>Progress Tracking:</strong> Blue bars show current achievement levels. 
                Gray bars represent target goals for typical development.
              </p>
            </div>
          </div>
        </div>

        {/* Risk Assessment Heatmap */}
        <div style={{ marginBottom: 50 }}>
          <h3 style={{ color: '#333', marginBottom: 25, fontSize: '1.5rem', textAlign: 'center' }}>
            🔥 Clinical Risk Assessment Matrix
          </h3>
          <div style={{ 
            background: 'white', 
            padding: 30, 
            borderRadius: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              {clinicalRiskData.map((item, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 18,
                    background: item.risk > 70 ? '#dc3545' : item.risk > 50 ? '#fd7e14' : '#28a745',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {item.risk}%
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#333' }}>{item.domain}</h4>
                  <div style={{
                    padding: '6px 16px',
                    borderRadius: 16,
                    display: 'inline-block',
                    fontSize: 14,
                    fontWeight: 'bold',
                    background: item.risk > 70 ? '#dc3545' : item.risk > 50 ? '#fd7e14' : '#28a745',
                    color: 'white'
                  }}>
                    {item.risk > 70 ? 'High' : item.risk > 50 ? 'Medium' : 'Low'} Risk
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 30 }}>
              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>
                <strong>Risk Levels:</strong> Red (70%+) indicates high priority for intervention. 
                Orange (50-69%) suggests moderate concern. Green (below 50%) shows typical development.
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Decision Tree */}
        <div>
          <h3 style={{ color: '#333', marginBottom: 25, fontSize: '1.5rem', textAlign: 'center' }}>
            🌳 Clinical Decision Pathway
          </h3>
          <div style={{ 
            background: 'white', 
            padding: 30, 
            borderRadius: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: 20
            }}>
              {/* Start */}
              <div style={{
                padding: '20px 40px',
                background: '#2E86AB',
                color: 'white',
                borderRadius: 12,
                fontWeight: 'bold',
                fontSize: 18,
                textAlign: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                Screening Assessment Complete
              </div>
              
              {/* Arrow */}
              <div style={{ fontSize: 24, color: '#666' }}>↓</div>
              
              {/* Decision */}
              <div style={{
                padding: '20px 40px',
                background: '#ffc107',
                color: '#333',
                borderRadius: 12,
                fontWeight: 'bold',
                fontSize: 18,
                textAlign: 'center',
                border: '2px solid #e6c200',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                Moderate Severity Detected
              </div>
              
              {/* Arrow */}
              <div style={{ fontSize: 24, color: '#666' }}>↓</div>
              
              {/* Recommendations */}
              <div style={{
                padding: '20px 40px',
                background: '#28a745',
                color: 'white',
                borderRadius: 12,
                fontWeight: 'bold',
                fontSize: 18,
                textAlign: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                Refer to Specialist for Comprehensive Evaluation
              </div>
              
              {/* Next Steps */}
              <div style={{ 
                marginTop: 20, 
                padding: 20, 
                background: '#f8f9fa', 
                borderRadius: 12,
                border: '1px solid #e9ecef',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: 16 }}>Recommended Next Steps:</h4>
                <ul style={{ 
                  margin: 0, 
                  padding: 0, 
                  listStyle: 'none',
                  fontSize: 14,
                  color: '#666',
                  lineHeight: 1.8
                }}>
                  {decisionTree.nextSteps.map((step: string, index: number) => (
                    <li key={index}>• {step}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MedicalVisualizations; 