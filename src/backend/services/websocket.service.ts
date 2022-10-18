import { TabControllerService } from "./tab-controller.service";
import { LeappSessionInfo } from "../models/leapp-session-info";
import { WebRequestService } from "./web-request.service";

export class WebsocketService {
  private connected;
  private ws;

  constructor(
    private tabControllerService: TabControllerService,
    private webRequestService: WebRequestService,
    private webSocketClass: typeof WebSocket,
    public port: number = 8095,
    public interval: number = 6000
  ) {
    this.connected = false;
    this.ws = null;
  }

  listen(): void {
    setInterval(() => {
      console.log("checking if connected");
      if (!this.connected) {
        this.ws = this.createWebsocket(this.port);

        this.ws.onopen = (_) => {
          this.connected = true;
          console.log("connecting to websocket...");
        };

        this.ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.type === "create-new-session") {
            const payload: LeappSessionInfo = message.sessionInfo;
            this.tabControllerService.openNewSessionTab(payload);
            this.ws.send(JSON.stringify({ type: "success", msg: "payload from Leapp received correctly" }));
          } else if (message.type === "get-fetching-state") {
            this.ws.send(JSON.stringify({ type: "send-fetching-state", fetching: this.webRequestService.fetching }));
          }
        };

        this.ws.onclose = (_) => {
          this.connected = false;
          console.log("closing...");
        };

        this.ws.onerror = (_) => {
          this.connected = false;
          console.log("can't connect!");
        };
      }
    }, this.interval);
  }

  private createWebsocket(port: number): WebSocket {
    return new this.webSocketClass(`ws://localhost:${port}`);
  }
}
