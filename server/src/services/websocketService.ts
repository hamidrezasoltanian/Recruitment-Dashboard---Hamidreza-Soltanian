import WebSocket from 'ws';
import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'notification' | 'candidate_update' | 'stage_change' | 'new_comment' | 'ping' | 'pong';
  data: any;
  timestamp: string;
  userId?: string;
}

class WebSocketService {
  private wss: WebSocket.Server | null = null;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: HttpServer) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      console.log('New WebSocket connection');
      
      // Set up heartbeat
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle authentication
      const token = this.extractTokenFromRequest(req);
      if (token) {
        this.authenticateConnection(ws, token);
      }

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        if (ws.userId) {
          this.clients.delete(ws.userId);
          console.log(`User ${ws.userId} disconnected`);
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    // Start heartbeat
    this.startHeartbeat();
  }

  private extractTokenFromRequest(req: any): string | null {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('token');
  }

  private async authenticateConnection(ws: AuthenticatedWebSocket, token: string) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (user) {
        ws.userId = decoded.userId;
        this.clients.set(decoded.userId, ws);
        console.log(`User ${decoded.userId} authenticated via WebSocket`);
        
        // Send welcome message
        this.sendToUser(decoded.userId, {
          type: 'notification',
          data: {
            title: 'اتصال برقرار شد',
            message: 'شما با موفقیت به سیستم متصل شدید',
            type: 'success'
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          data: {},
          timestamp: new Date().toISOString()
        }));
        break;
      
      case 'pong':
        // Heartbeat response
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws, userId) => {
        if (!ws.isAlive) {
          console.log(`Terminating inactive connection for user ${userId}`);
          ws.terminate();
          this.clients.delete(userId);
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  // Public methods for sending messages
  sendToUser(userId: string, message: WebSocketMessage) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  sendToAll(message: WebSocketMessage) {
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  sendToAdmins(message: WebSocketMessage) {
    // This would need to be implemented with user role checking
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Check if user is admin (you'd need to implement this)
        ws.send(JSON.stringify(message));
      }
    });
  }

  // Notification methods
  async sendCandidateUpdateNotification(candidateId: string, action: string, userId: string) {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { name: true, stage: true }
    });

    if (candidate) {
      const message: WebSocketMessage = {
        type: 'candidate_update',
        data: {
          candidateId,
          candidateName: candidate.name,
          action,
          stage: candidate.stage
        },
        timestamp: new Date().toISOString()
      };

      this.sendToUser(userId, message);
    }
  }

  async sendStageChangeNotification(candidateId: string, oldStage: string, newStage: string, userId: string) {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { name: true }
    });

    if (candidate) {
      const message: WebSocketMessage = {
        type: 'stage_change',
        data: {
          candidateId,
          candidateName: candidate.name,
          oldStage,
          newStage
        },
        timestamp: new Date().toISOString()
      };

      this.sendToUser(userId, message);
    }
  }

  async sendNewCommentNotification(candidateId: string, comment: string, userId: string) {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { name: true }
    });

    if (candidate) {
      const message: WebSocketMessage = {
        type: 'new_comment',
        data: {
          candidateId,
          candidateName: candidate.name,
          comment
        },
        timestamp: new Date().toISOString()
      };

      this.sendToUser(userId, message);
    }
  }

  getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  getConnectionCount(): number {
    return this.clients.size;
  }

  close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.clients.forEach((ws) => {
      ws.close();
    });
    
    this.clients.clear();
    
    if (this.wss) {
      this.wss.close();
    }
  }
}

export const webSocketService = new WebSocketService();





