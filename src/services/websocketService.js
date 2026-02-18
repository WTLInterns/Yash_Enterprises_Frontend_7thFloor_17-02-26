import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.subscriptions = new Map(); // Track subscriptions
    this.listeners = {
      attendance: [],
      task: [],
      punch: []
    };
  }

  connect() {
    if (this.isConnected || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        // Use SockJS for WebSocket connection
        const socket = new SockJS('api.yashrajent.com/ws');
        
        this.client = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {},
          debug: (str) => {
            console.log('STOMP Debug:', str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        this.client.onConnect = (frame) => {
          console.log('WebSocket connected:', frame);
          this.isConnected = true;
          this.isConnecting = false;
          
          // Subscribe to topics
          this.subscribeToTopics();
          resolve();
        };

        this.client.onStompError = (frame) => {
          console.error('WebSocket error:', frame);
          this.isConnected = false;
          this.isConnecting = false;
          this.cleanupSubscriptions();
          reject(frame);
        };

        this.client.onDisconnect = (frame) => {
          console.log('WebSocket disconnected:', frame);
          this.isConnected = false;
          this.isConnecting = false;
          this.cleanupSubscriptions();
        };

        this.client.activate();
      } catch (error) {
        console.error('WebSocket connection error:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  subscribeToTopics() {
    if (!this.client || !this.isConnected) return;

    // Clean up existing subscriptions before creating new ones
    this.cleanupSubscriptions();

    try {
      // Subscribe to attendance events
      const attendanceSub = this.client.subscribe('/topic/attendance-events', (message) => {
        try {
          const data = JSON.parse(message.body);
          this.notifyListeners('attendance', data);
        } catch (error) {
          console.error('Error parsing attendance event:', error);
        }
      });
      this.subscriptions.set('attendance', attendanceSub);

      // Subscribe to task events
      const taskSub = this.client.subscribe('/topic/task-events', (message) => {
        try {
          const data = JSON.parse(message.body);
          this.notifyListeners('task', data);
        } catch (error) {
          console.error('Error parsing task event:', error);
        }
      });
      this.subscriptions.set('task', taskSub);

      // Subscribe to punch events
      const punchSub = this.client.subscribe('/topic/punch-events', (message) => {
        try {
          const data = JSON.parse(message.body);
          this.notifyListeners('punch', data);
        } catch (error) {
          console.error('Error parsing punch event:', error);
        }
      });
      this.subscriptions.set('punch', punchSub);

    } catch (error) {
      console.error('Error subscribing to topics:', error);
    }
  }

  cleanupSubscriptions() {
    // Unsubscribe from all topics
    this.subscriptions.forEach((subscription, topic) => {
      try {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.error(`Error unsubscribing from ${topic}:`, error);
      }
    });
    this.subscriptions.clear();
  }

  // Event listener management
  addEventListener(type, callback) {
    if (this.listeners[type]) {
      // Prevent duplicate callbacks
      const existingIndex = this.listeners[type].findIndex(cb => cb === callback);
      if (existingIndex === -1) {
        this.listeners[type].push(callback);
      }
    }
  }

  removeEventListener(type, callback) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
  }

  notifyListeners(type, data) {
    if (this.listeners[type]) {
      this.listeners[type].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  disconnect() {
    this.cleanupSubscriptions();
    
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (error) {
        console.error('Error deactivating WebSocket client:', error);
      }
    }
    
    this.isConnected = false;
    this.isConnecting = false;
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  // Get connection state for debugging
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      subscriptionCount: this.subscriptions.size,
      listenerCounts: {
        attendance: this.listeners.attendance.length,
        task: this.listeners.task.length,
        punch: this.listeners.punch.length
      }
    };
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
