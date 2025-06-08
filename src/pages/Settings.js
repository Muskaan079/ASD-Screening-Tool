import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    practitioner: {
      name: 'Dr. Jane Smith',
      email: 'jane.smith@example.com',
      specialization: 'Child Psychology',
      license: 'CP12345',
    },
    patient: {
      name: '',
      dateOfBirth: '',
      gender: '',
      guardianName: '',
      contactNumber: '',
    },
    preferences: {
      language: 'English',
      notifications: true,
      autoSave: true,
      highContrast: false,
    },
  });

  const handlePractitionerChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      practitioner: {
        ...prev.practitioner,
        [name]: value,
      },
    }));
  };

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      patient: {
        ...prev.patient,
        [name]: value,
      },
    }));
  };

  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    // In a real implementation, this would save to backend
    console.log('Settings saved:', settings);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your profile and preferences</p>
      </div>

      <form className="settings-form" onSubmit={handleSave}>
        <div className="settings-section">
          <h2>Practitioner Profile</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={settings.practitioner.name}
                onChange={handlePractitionerChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={settings.practitioner.email}
                onChange={handlePractitionerChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="specialization">Specialization</label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={settings.practitioner.specialization}
                onChange={handlePractitionerChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="license">License Number</label>
              <input
                type="text"
                id="license"
                name="license"
                value={settings.practitioner.license}
                onChange={handlePractitionerChange}
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Patient Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="patientName">Patient Name</label>
              <input
                type="text"
                id="patientName"
                name="name"
                value={settings.patient.name}
                onChange={handlePatientChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={settings.patient.dateOfBirth}
                onChange={handlePatientChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={settings.patient.gender}
                onChange={handlePatientChange}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="guardianName">Guardian Name</label>
              <input
                type="text"
                id="guardianName"
                name="guardianName"
                value={settings.patient.guardianName}
                onChange={handlePatientChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number</label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={settings.patient.contactNumber}
                onChange={handlePatientChange}
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Preferences</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="language">Language</label>
              <select
                id="language"
                name="language"
                value={settings.preferences.language}
                onChange={handlePreferenceChange}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="notifications"
                  checked={settings.preferences.notifications}
                  onChange={handlePreferenceChange}
                />
                Enable Notifications
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="autoSave"
                  checked={settings.preferences.autoSave}
                  onChange={handlePreferenceChange}
                />
                Auto-save Progress
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="highContrast"
                  checked={settings.preferences.highContrast}
                  onChange={handlePreferenceChange}
                />
                High Contrast Mode
              </label>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button type="submit" className="save-settings-btn">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings; 