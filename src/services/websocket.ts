import { io, Socket } from 'socket.io-client';
import { WebSocketEvents } from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect(): void {
    try {
      this.socket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:3001', {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  // Generic event emitter
  public emit<T extends keyof WebSocketEvents>(
    event: T,
    data: WebSocketEvents[T]
  ): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, attempting to reconnect...');
      this.connect();
    }
  }

  // Generic event listener
  public on<T extends keyof WebSocketEvents>(
    event: T,
    callback: (data: WebSocketEvents[T]) => void
  ): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  public off<T extends keyof WebSocketEvents>(event: T): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Session Management
  public startSession(sessionData: WebSocketEvents['session:start']): void {
    this.emit('session:start', sessionData);
  }

  public updateSession(updateData: WebSocketEvents['session:update']): void {
    this.emit('session:update', updateData);
  }

  public endSession(sessionData: WebSocketEvents['session:end']): void {
    this.emit('session:end', sessionData);
  }

  // Adaptive Questioning
  public sendQuestionResponse(response: WebSocketEvents['adaptive:question']): void {
    this.emit('adaptive:question', response);
  }

  // Multimodal Data
  public sendMultimodalData(data: WebSocketEvents['multimodal:data']): void {
    this.emit('multimodal:data', data);
  }

  // LLM Analysis
  public onLLMAnalysis(callback: (analysis: WebSocketEvents['llm:analysis']) => void): void {
    this.on('llm:analysis', callback);
  }

  // Explainability Updates
  public onExplainabilityUpdate(callback: (data: WebSocketEvents['explainability:update']) => void): void {
    this.on('explainability:update', callback);
  }

  // Error Handling
  public onError(callback: (error: WebSocketEvents['error']) => void): void {
    this.on('error', callback);
  }

  // Connection Status
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Disconnect
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Reconnect
  public reconnect(): void {
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Hook for React components
export const useWebSocket = () => {
  return websocketService;
}; 