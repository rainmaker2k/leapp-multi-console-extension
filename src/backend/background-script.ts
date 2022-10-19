import init from "./init";
import { Providers } from "./models/providers";

init();

const providers: Providers = (window as any).providers;

if (providers.extensionStateService.isChrome) {
  providers.webRequestService.listen();
}

providers.tabControllerService.listen();
providers.bootstrapService.listen();
providers.internalCommunicationService.listenToContentScriptConnection();
providers.popupCommunicationService.listen();
providers.webSocketService.listen();
