import { ExtensionStateService } from "./extension-state.service";
import { LeappSessionInfo } from "../models/leapp-session-info";
import { containerColors } from "../models/container-colors";

export class TabControllerService {
  constructor(private chromeNamespace: typeof chrome, private state: ExtensionStateService) {}

  getBrowser(): any {
    return browser;
  }

  openOrFocusSessionTab(leappPayload: LeappSessionInfo, leappSessionId?: string): void {
    const sessionId = this.state.sessionCounter;
    this.state.createNewIsolatedSession(sessionId, { ...leappPayload, url: undefined }, leappSessionId);
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Increment
    this.state.nextSessionId = this.state.sessionCounter++;
    if (leappSessionId) {
      const tabId = this.state.getTabIdByLeappSessionId(leappSessionId);
      const isSessionExpired = this.state.isSessionExpired(leappSessionId);
      if (tabId) {
        if (isSessionExpired) {
          this.reloadTab(tabId, leappPayload);
          this.state.updateCreatedAt(leappSessionId);
        } else {
          if (this.state.isChrome) {
            this.focusSessionTab(tabId);
          }
        }
      } else {
        this.openSessionTab(sessionId, leappPayload);
        this.state.updateCreatedAt(leappSessionId);
      }
    } else {
      this.openSessionTab(sessionId, leappPayload);
    }
  }

  reloadTab(tabId: number, leappPayload: LeappSessionInfo): void {
    if (this.state.isChrome) {
      this.chromeNamespace.tabs.update(tabId, { url: leappPayload.url }, (_) => {});
    } else {
      this.getBrowser().tabs.update(tabId, { url: leappPayload.url });
    }
  }

  private openSessionTab(sessionId: number, leappPayload: LeappSessionInfo) {
    if (this.state.isChrome) {
      this.newChromeSessionTab(leappPayload.url, `${leappPayload.sessionName} (${leappPayload.sessionRole})`);
    } else {
      this.newFirefoxSessionTab(leappPayload.url, `${leappPayload.sessionName} (${leappPayload.sessionRole})`, sessionId).then(() => {});
    }
  }

  private focusSessionTab(tabId: number): void {
    this.chromeNamespace.windows.getCurrent((window) => {
      this.updateOnTabFocus(window, tabId);
    });
  }

  private updateOnTabFocus(window: any, tabId: number): void {
    this.chromeNamespace.windows.update(window.id, { focused: true });
    this.chromeNamespace.tabs.update(tabId, { active: true }, (_) => {});
  }

  private newChromeSessionTab(url: string, groupName: string) {
    this.chromeNamespace.tabs.create(
      {
        url,
      },
      (tab) => {
        this.chromeNamespace.tabs.group(
          {
            tabIds: tab.id,
          },
          (groupId) => {
            this.chromeNamespace.tabGroups.update(groupId, { title: groupName });
          }
        );
      }
    );
  }

  private async newFirefoxSessionTab(url: string, containerName: string, sessionId: number) {
    const colorIndex = this.state.sessionCounter % containerColors.length;
    const container = await this.getBrowser()
      .contextualIdentities.query({
        name: containerName,
      })
      .then(
        (contexts) =>
          contexts.pop() ||
          this.getBrowser().contextualIdentities.create({
            name: containerName,
            color: containerColors[colorIndex],
            icon: "circle",
          })
      );
    this.state.setCookieStoreId(sessionId, container.cookieStoreId);
    await this.getBrowser().tabs.create({
      url,
      cookieStoreId: container.cookieStoreId,
    });
  }

  listen(): void {
    this.chromeNamespace.tabs.onCreated.addListener((tab: any) => this.handleCreated(tab));
    this.chromeNamespace.tabs.onRemoved.addListener((tabId: number) => this.handleRemoved(tabId));
  }

  private handleCreated(tab: any): void {
    if (tab.pendingUrl) {
      if (tab.pendingUrl.indexOf("chrome://") === -1) {
        if (tab.openerTabId) {
          const currentSessionId = this.state.getSessionIdByTabId(tab.openerTabId);
          this.state.addTabToSession(tab.id, currentSessionId);
        } else {
          this.state.addTabToSession(tab.id, this.state.nextSessionId);
        }
        this.state.nextSessionId = 0;
      }
    } else {
      if (tab.openerTabId) {
        const currentSessionId = this.state.getSessionIdByTabId(tab.openerTabId);
        this.state.addTabToSession(tab.id, currentSessionId);
      } else {
        this.state.addTabToSession(tab.id, this.state.nextSessionId);
      }
      this.state.nextSessionId = 0;
    }
  }

  private handleRemoved(tabId: number): void {
    this.state.removeTabFromSession(tabId, this.chromeNamespace.cookies);
  }
}
