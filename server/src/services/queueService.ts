import Bull from 'bull';
import { PrismaClient } from '@prisma/client';
import { aiService } from './aiService';
import { emailService } from './emailService';

const prisma = new PrismaClient();

// Email Queue
export const emailQueue = new Bull('email queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  }
});

// Notification Queue
export const notificationQueue = new Bull('notification queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  }
});

// Analytics Queue
export const analyticsQueue = new Bull('analytics queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  }
});

// Email Queue Processors
emailQueue.process('send-welcome-email', async (job) => {
  const { candidateId, templateId } = job.data;
  
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { user: true }
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    const template = await prisma.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Replace placeholders in template
    const content = template.content
      .replace(/\{\{candidateName\}\}/g, candidate.name)
      .replace(/\{\{position\}\}/g, candidate.position)
      .replace(/\{\{interviewDate\}\}/g, candidate.interviewDate || '')
      .replace(/\{\{interviewTime\}\}/g, candidate.interviewTime || '');

    // Send email
    await emailService.sendEmail({
      to: candidate.email,
      subject: `خوش آمدید ${candidate.name}`,
      content: content
    });

    console.log(`Welcome email sent to ${candidate.email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
});

emailQueue.process('send-stage-change-notification', async (job) => {
  const { candidateId, newStage, userId } = job.data;
  
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { user: true }
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Find appropriate template for stage
    const template = await prisma.template.findFirst({
      where: { 
        stageId: newStage,
        type: 'email'
      }
    });

    if (template) {
      const content = template.content
        .replace(/\{\{candidateName\}\}/g, candidate.name)
        .replace(/\{\{position\}\}/g, candidate.position)
        .replace(/\{\{stageName\}\}/g, newStage)
        .replace(/\{\{interviewDate\}\}/g, candidate.interviewDate || '')
        .replace(/\{\{interviewTime\}\}/g, candidate.interviewTime || '');

      await emailService.sendEmail({
        to: candidate.email,
        subject: `به‌روزرسانی وضعیت درخواست - ${candidate.name}`,
        content: content
      });
    }

    console.log(`Stage change notification sent to ${candidate.email}`);
  } catch (error) {
    console.error('Error sending stage change notification:', error);
    throw error;
  }
});

// Notification Queue Processors
notificationQueue.process('send-push-notification', async (job) => {
  const { userId, title, message, data } = job.data;
  
  try {
    // Here you would integrate with push notification service
    // like Firebase Cloud Messaging or OneSignal
    console.log(`Push notification sent to user ${userId}: ${title}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
});

// Analytics Queue Processors
analyticsQueue.process('update-candidate-analytics', async (job) => {
  const { candidateId, action, metadata } = job.data;
  
  try {
    // Update analytics data
    await prisma.analyticsEvent.create({
      data: {
        candidateId,
        action,
        metadata: JSON.stringify(metadata),
        timestamp: new Date()
      }
    });

    console.log(`Analytics updated for candidate ${candidateId}`);
  } catch (error) {
    console.error('Error updating analytics:', error);
    throw error;
  }
});

// Queue event handlers
emailQueue.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err);
});

notificationQueue.on('completed', (job) => {
  console.log(`Notification job ${job.id} completed`);
});

analyticsQueue.on('completed', (job) => {
  console.log(`Analytics job ${job.id} completed`);
});

// Helper functions to add jobs
export const addEmailJob = (type: string, data: any, options?: any) => {
  return emailQueue.add(type, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    ...options
  });
};

export const addNotificationJob = (type: string, data: any, options?: any) => {
  return notificationQueue.add(type, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    ...options
  });
};

export const addAnalyticsJob = (type: string, data: any, options?: any) => {
  return analyticsQueue.add(type, data, {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    ...options
  });
};





