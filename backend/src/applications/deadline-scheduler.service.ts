import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApplicationsService } from './applications.service';

@Injectable()
export class DeadlineSchedulerService {
  private readonly logger = new Logger(DeadlineSchedulerService.name);

  constructor(private readonly applicationsService: ApplicationsService) {}

  /**
   * Monitor deadlines every hour during business hours (9 AM - 6 PM)
   * This complements the Temporal workflow reminders with system-level monitoring
   */
  @Cron('0 9-18 * * 1-5', {
    name: 'hourly-deadline-monitor',
    timeZone: 'America/New_York', // Adjust timezone as needed
  })
  async monitorDeadlinesHourly() {
    this.logger.log('Running hourly deadline monitoring...');
    
    try {
      const results = await this.applicationsService.monitorDeadlineApproachingApplications();
      
      this.logger.log(
        `Deadline monitoring completed: ${results.urgent.length} urgent, ${results.approaching.length} approaching deadlines`
      );

      // Log details about urgent applications
      if (results.urgent.length > 0) {
        this.logger.warn(
          `URGENT: ${results.urgent.length} application(s) have deadlines within 24 hours: ${results.urgent
            .map(app => `${app.company} - ${app.role}`)
            .join(', ')}`
        );
      }
    } catch (error) {
      this.logger.error('Failed to monitor deadlines:', error);
    }
  }

  /**
   * Intensive monitoring every 5 minutes during the final hours before deadlines
   * This runs from 9 AM to 9 PM to catch any last-minute deadline approaches
   */
  @Cron('*/5 9-21 * * 1-7', {
    name: 'intensive-deadline-monitor',
    timeZone: 'America/New_York',
  })
  async intensiveDeadlineMonitoring() {
    try {
      // Get applications requiring immediate attention (within 6 hours)
      const urgentApps = await this.applicationsService.getApplicationsRequiringAttention(6);
      
      if (urgentApps.length > 0) {
        this.logger.warn(
          `⚠️ CRITICAL: ${urgentApps.length} application(s) with deadlines within 6 hours`
        );
        
        // For very urgent applications (within 2 hours), trigger manual reminders
        const criticalApps = await this.applicationsService.getApplicationsRequiringAttention(2);
        
        for (const app of criticalApps) {
          try {
            await this.applicationsService.triggerManualReminder(app.id);
            this.logger.warn(
              `🚨 Triggered critical reminder for ${app.company} - ${app.role} (deadline in < 2 hours)`
            );
          } catch (error) {
            this.logger.error(`Failed to trigger reminder for application ${app.id}:`, error);
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed during intensive deadline monitoring:', error);
    }
  }

  /**
   * Daily summary of deadline status at 8 AM
   */
  @Cron('0 8 * * 1-5', {
    name: 'daily-deadline-summary',
    timeZone: 'America/New_York',
  })
  async dailyDeadlineSummary() {
    this.logger.log('Generating daily deadline summary...');
    
    try {
      const results = await this.applicationsService.monitorDeadlineApproachingApplications();
      const overdueApps = await this.applicationsService.getOverdueApplications();
      
      this.logger.log(
        `📊 Daily Summary: ${results.urgent.length} urgent (24h), ${results.approaching.length} approaching (3 days), ${overdueApps.length} overdue`
      );

      // Additional logic could be added here to send summary emails, Slack messages, etc.
    } catch (error) {
      this.logger.error('Failed to generate daily deadline summary:', error);
    }
  }

  /**
   * Manual trigger for deadline monitoring (useful for testing or immediate checks)
   */
  async triggerManualMonitoring(): Promise<{
    urgent: number;
    approaching: number;
    overdue: number;
  }> {
    this.logger.log('Manual deadline monitoring triggered');
    
    try {
      const [results, overdueApps] = await Promise.all([
        this.applicationsService.monitorDeadlineApproachingApplications(),
        this.applicationsService.getOverdueApplications(),
      ]);

      const summary = {
        urgent: results.urgent.length,
        approaching: results.approaching.length,
        overdue: overdueApps.length,
      };

      this.logger.log(`Manual monitoring completed: ${JSON.stringify(summary)}`);
      return summary;
    } catch (error) {
      this.logger.error('Failed during manual deadline monitoring:', error);
      throw error;
    }
  }
} 