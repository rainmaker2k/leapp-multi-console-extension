import Tab = chrome.tabs.Tab;
import { ExtensionStateService } from "./extension-state.service";
import { LeappSessionInfo } from "../models/leapp-session-info";
import { PopupCommunicationService } from "./popup-communication.service";

export class TabControllerService {
  constructor(
    private chromeNamespace: typeof chrome,
    private state: ExtensionStateService,
    private popupCommunicationService: PopupCommunicationService,
    private browserNamespace?: typeof browser
  ) {}

  openNewSessionTab(leappPayload: LeappSessionInfo): void {
    const sessionId = this.state.sessionCounter;
    const sessionKey = `session-${sessionId}`;
    this.state.createNewIsolatedSession(sessionId, leappPayload);
    this.state.nextSessionId = this.state.sessionCounter++;
    if (this.state.isChrome) {
      this.newChromeSessionTab(leappPayload.url);
    } else {
      this.newFirefoxSessionTab(leappPayload.url, sessionKey).then(() => {});
    }
  }

  private newChromeSessionTab(url: string) {
    this.chromeNamespace.tabs.create({
      url,
    });
  }

  private async newFirefoxSessionTab(url: string, sessionKey: string) {
    const container = await browser.contextualIdentities.create({ name: sessionKey, color: "orange", icon: "circle" });
    this.browserNamespace.tabs.create({
      url,
      cookieStoreId: container.cookieStoreId,
    });
  }

  listen(): void {
    this.chromeNamespace.tabs.onCreated.addListener((tab: Tab) => this.handleCreated(tab));
    this.chromeNamespace.tabs.onRemoved.addListener((tabId: number) => this.handleRemoved(tabId));
  }

  private handleCreated(tab: Tab): void {
    if (tab.openerTabId) {
      const currentSessionId = this.state.getSessionIdByTabId(tab.openerTabId);
      this.state.addTabToSession(tab.id, currentSessionId);
    } else {
      this.state.addTabToSession(tab.id, this.state.nextSessionId);
    }
    this.state.nextSessionId = 0;
    console.log(`Tab ${tab.id} was created from ${tab.openerTabId ?? "popup page"}`);
  }

  private handleRemoved(tabId: number): void {
    this.state.removeTabFromSession(tabId);
    console.log(`Tab ${tabId} was removed! R†P`);
  }
}
