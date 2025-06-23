import React from 'react';

const MedicalVisualizations: React.FC = () => {
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
        
        {/* DSM-5 Criteria Assessment */}
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
            <div style={{ 
              width: '100%', 
              height: 400, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              background: 'linear-gradient(45deg, #f0f8ff, #e6f3ff)',
              borderRadius: 12
            }}>
              <div style={{
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #2E86AB 0deg 65deg, #e9ecef 65deg 360deg)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: 'conic-gradient(from 0deg, #ffc107 0deg 55deg, #e9ecef 55deg 360deg)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, #fd7e14 0deg 70deg, #e9ecef 70deg 360deg)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 16
                  }}>
                    MODERATE
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>
                <strong>Interpretation:</strong> Higher scores indicate greater clinical concerns. 
                Areas above 60% require immediate attention and follow-up evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Assessment */}
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
            <div style={{ display: 'grid', gap: 20 }}>
              {[
                { name: 'Social Skills', completed: 35 },
                { name: 'Communication', completed: 45 },
                { name: 'Behavioral Flexibility', completed: 30 },
                { name: 'Sensory Integration', completed: 50 },
                { name: 'Executive Function', completed: 40 }
              ].map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: 150, fontSize: 16, fontWeight: 'bold', color: '#333' }}>
                    {item.name}
                  </div>
                  <div style={{ 
                    flex: 1, 
                    height: 30, 
                    background: '#e9ecef', 
                    borderRadius: 15,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${item.completed}%`,
                      height: '100%',
                      background: '#2E86AB',
                      borderRadius: 15
                    }}></div>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#333',
                      fontWeight: 'bold',
                      fontSize: 14
                    }}>
                      {item.completed}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Assessment Matrix */}
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
              {[
                { domain: 'Social', risk: 75, impact: 'High' },
                { domain: 'Communication', risk: 45, impact: 'Medium' },
                { domain: 'Behavioral', risk: 70, impact: 'High' },
                { domain: 'Sensory', risk: 50, impact: 'Medium' },
                { domain: 'Cognitive', risk: 40, impact: 'Low' }
              ].map((item, index) => (
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
                    {item.impact} Impact
                  </div>
                </div>
              ))}
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
              <div style={{
                padding: '20px 40px',
                background: '#2E86AB',
                color: 'white',
                borderRadius: 12,
                fontWeight: 'bold',
                fontSize: 18,
                textAlign: 'center'
              }}>
                Screening Assessment Complete
              </div>
              
              <div style={{ fontSize: 24, color: '#666' }}>↓</div>
              
              <div style={{
                padding: '20px 40px',
                background: '#ffc107',
                color: '#333',
                borderRadius: 12,
                fontWeight: 'bold',
                fontSize: 18,
                textAlign: 'center'
              }}>
                Moderate Severity Detected
              </div>
              
              <div style={{ fontSize: 24, color: '#666' }}>↓</div>
              
              <div style={{
                padding: '20px 40px',
                background: '#28a745',
                color: 'white',
                borderRadius: 12,
                fontWeight: 'bold',
                fontSize: 18,
                textAlign: 'center'
              }}>
                Refer to Specialist for Comprehensive Evaluation
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MedicalVisualizations; 