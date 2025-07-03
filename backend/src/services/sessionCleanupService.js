import databaseService from './databaseService.js';

class SessionCleanupService {
  constructor() {
    this.cleanupInterval = null;
    this.sessionTimeoutHours = 24; // Sessions expire after 24 hours
    this.cleanupIntervalMs = 60 * 60 * 1000; // Run cleanup every hour
  }

  // Start automatic cleanup
  startCleanup() {
    if (this.cleanupInterval) {
      console.log('Session cleanup already running');
      return;
    }

    console.log('Starting session cleanup service...');
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.cleanupIntervalMs);

    // Run initial cleanup
    this.performCleanup();
  }

  // Stop automatic cleanup
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Session cleanup service stopped');
    }
  }

  // Perform cleanup of stale sessions
  async performCleanup() {
    try {
      console.log('Running session cleanup...');
      
      const cutoffTime = new Date(Date.now() - (this.sessionTimeoutHours * 60 * 60 * 1000));
      
      // Get all active sessions older than the timeout
      const sessions = await databaseService.listSessions({ status: 'active' });
      const staleSessions = sessions.filter(session => 
        new Date(session.startTime) < cutoffTime
      );

      console.log(`Found ${staleSessions.length} stale sessions to clean up`);

      // Mark stale sessions as expired
      for (const session of staleSessions) {
        try {
          await databaseService.updateSession(session.id, {
            status: 'expired',
            endTime: new Date().toISOString(),
            cleanupReason: 'automatic_expiration'
          });
          console.log(`Marked session ${session.id} as expired`);
        } catch (error) {
          console.error(`Failed to mark session ${session.id} as expired:`, error);
        }
      }

      // Archive old completed sessions (older than 30 days)
      const archiveCutoff = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      const oldCompletedSessions = sessions.filter(session => 
        session.status === 'completed' && 
        session.endTime && 
        new Date(session.endTime) < archiveCutoff
      );

      console.log(`Found ${oldCompletedSessions.length} old completed sessions to archive`);

      for (const session of oldCompletedSessions) {
        try {
          // Anonymize patient data for archived sessions
          const anonymizedSession = {
            ...session,
            patientInfo: {
              ...session.patientInfo,
              name: `Patient_${session.id.slice(0, 8)}`,
              age: null,
              gender: null
            },
            status: 'archived',
            archivedAt: new Date().toISOString()
          };

          await databaseService.updateSession(session.id, anonymizedSession);
          console.log(`Archived session ${session.id}`);
        } catch (error) {
          console.error(`Failed to archive session ${session.id}:`, error);
        }
      }

      console.log('Session cleanup completed successfully');
    } catch (error) {
      console.error('Error during session cleanup:', error);
    }
  }

  // Manual cleanup endpoint
  async manualCleanup() {
    console.log('Manual cleanup triggered');
    await this.performCleanup();
  }

  // Get cleanup statistics
  async getCleanupStats() {
    try {
      const sessions = await databaseService.listSessions();
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - (this.sessionTimeoutHours * 60 * 60 * 1000));

      const stats = {
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.status === 'active').length,
        expiredSessions: sessions.filter(s => s.status === 'expired').length,
        archivedSessions: sessions.filter(s => s.status === 'archived').length,
        staleSessions: sessions.filter(s => 
          s.status === 'active' && new Date(s.startTime) < cutoffTime
        ).length,
        lastCleanup: new Date().toISOString(),
        cleanupInterval: this.cleanupIntervalMs,
        sessionTimeout: this.sessionTimeoutHours
      };

      return stats;
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      throw error;
    }
  }
}

// Create singleton instance
const sessionCleanupService = new SessionCleanupService();

export default sessionCleanupService; 