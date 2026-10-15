import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '@/stores/useAuthStore'

const signalRBase = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5159/hubs'

class SignalRManager {
  private tableHubConnection: signalR.HubConnection | null = null
  private kitchenHubConnection: signalR.HubConnection | null = null

  public getTableHub(): signalR.HubConnection {
    if (!this.tableHubConnection) {
      this.tableHubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${signalRBase}/tables`, {
          accessTokenFactory: () => useAuthStore.getState().token || '',
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build()
    }
    return this.tableHubConnection
  }

  public getKitchenHub(): signalR.HubConnection {
    if (!this.kitchenHubConnection) {
      this.kitchenHubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${signalRBase}/kitchen`, {
          accessTokenFactory: () => useAuthStore.getState().token || '',
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build()
    }
    return this.kitchenHubConnection
  }

  public async startTableHub(): Promise<void> {
    const hub = this.getTableHub()
    if (hub.state === signalR.HubConnectionState.Disconnected) {
      try {
        await hub.start()
      } catch (err) {
        console.warn('SignalR TableHub connection error:', err)
      }
    }
  }

  public async stopAll(): Promise<void> {
    if (this.tableHubConnection) {
      await this.tableHubConnection.stop()
    }
    if (this.kitchenHubConnection) {
      await this.kitchenHubConnection.stop()
    }
  }
}

export const signalRManager = new SignalRManager()
export default signalRManager
