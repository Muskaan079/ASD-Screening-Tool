import React, { useState } from 'react';

interface UserInfo {
  name: string;
  age: number;
  gender: string;
  email?: string;
  parentName?: string;
  relationship: string;
}

interface UserInfoFormProps {
  onSubmit: (userInfo: UserInfo) => void;
  onCancel?: () => void;
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({ onSubmit, onCancel }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    age: 0,
    gender: '',
    email: undefined,
    parentName: undefined,
    relationship: 'Parent'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!userInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!userInfo.age || userInfo.age < 1 || userInfo.age > 120) {
      newErrors.age = 'Please enter a valid age (1-120)';
    }

    if (!userInfo.gender) {
      newErrors.gender = 'Please select a gender';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(userInfo);
    }
  };

  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      padding: 40,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
        <h1 style={{ fontSize: 36, marginBottom: 16 }}>ASD Screening Tool</h1>
        <p style={{ fontSize: 18, opacity: 0.9 }}>
          Please provide patient information to begin the comprehensive screening
        </p>
      </div>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        padding: 32, 
        borderRadius: 16,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Patient Information */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 20, fontSize: 20 }}>👤 Patient Information</h3>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={userInfo.name}
                onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: errors.name ? '2px solid #ff6b6b' : 'none',
                  fontSize: 16,
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#333'
                }}
                placeholder="Enter patient's full name"
              />
              {errors.name && (
                <div style={{ color: '#ff6b6b', fontSize: 14, marginTop: 4 }}>
                  {errors.name}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Age *
              </label>
              <input
                type="number"
                value={userInfo.age || ''}
                onChange={(e) => setUserInfo(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: errors.age ? '2px solid #ff6b6b' : 'none',
                  fontSize: 16,
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#333'
                }}
                placeholder="Enter patient's age"
                min="1"
                max="120"
              />
              {errors.age && (
                <div style={{ color: '#ff6b6b', fontSize: 14, marginTop: 4 }}>
                  {errors.age}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Gender *
              </label>
              <select
                value={userInfo.gender}
                onChange={(e) => setUserInfo(prev => ({ ...prev, gender: e.target.value }))}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: errors.gender ? '2px solid #ff6b6b' : 'none',
                  fontSize: 16,
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#333'
                }}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {errors.gender && (
                <div style={{ color: '#ff6b6b', fontSize: 14, marginTop: 4 }}>
                  {errors.gender}
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 20, fontSize: 20 }}>📧 Contact Information (Optional)</h3>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Email Address
              </label>
              <input
                type="email"
                value={userInfo.email || ''}
                onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 16,
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#333'
                }}
                placeholder="Enter email address (optional)"
              />
            </div>
          </div>

          {/* Guardian Information */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 20, fontSize: 20 }}>👨‍👩‍👧‍👦 Guardian Information (Optional)</h3>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Guardian Name
              </label>
              <input
                type="text"
                value={userInfo.parentName || ''}
                onChange={(e) => setUserInfo(prev => ({ ...prev, parentName: e.target.value }))}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 16,
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#333'
                }}
                placeholder="Enter guardian's name (optional)"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Relationship to Patient
              </label>
              <select
                value={userInfo.relationship}
                onChange={(e) => setUserInfo(prev => ({ ...prev, relationship: e.target.value }))}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 16,
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#333'
                }}
              >
                <option value="Parent">Parent</option>
                <option value="Guardian">Guardian</option>
                <option value="Caregiver">Caregiver</option>
                <option value="Healthcare Provider">Healthcare Provider</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Session Information */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: 16, 
            borderRadius: 8,
            marginBottom: 24
          }}>
            <h4 style={{ margin: '0 0 12px 0' }}>📋 Screening Session Details</h4>
            <ul style={{ margin: 0, paddingLeft: 20, opacity: 0.9 }}>
              <li>Comprehensive 5-minute analysis session</li>
              <li>Real-time eye tracking and attention monitoring</li>
              <li>Voice and speech pattern analysis</li>
              <li>Facial emotion detection</li>
              <li>Behavioral observation and assessment</li>
              <li>Detailed clinical report generation</li>
            </ul>
          </div>

          {/* Privacy Notice */}
          <div style={{ 
            background: 'rgba(255, 193, 7, 0.1)', 
            padding: 16, 
            borderRadius: 8,
            marginBottom: 24,
            border: '1px solid rgba(255, 193, 7, 0.3)'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#ffc107' }}>🔒 Privacy & Consent</h4>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
              By proceeding, you consent to the collection and analysis of behavioral data for screening purposes. 
              All data is processed securely and used only for assessment purposes. 
              This tool is designed to assist healthcare professionals and is not a diagnostic tool.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 16 }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: 16,
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 8,
                  fontSize: 18,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              style={{
                flex: 2,
                padding: 16,
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 18,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🚀 Start Comprehensive Screening
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserInfoForm; 