import { initProviders } from "./init-providers";

const providers = initProviders();
providers.extractSessionIdService.listen();

(async function () {
  const port = providers.internalCommunicationService.connectToBackgroundScript();
  port.postMessage({
    request: "session-id-request",
  });
  port.onMessage.addListener((msg) => {
    chrome.runtime.sendMessage({ type: "session-list-request" }, (response) => {
      const sessionList = JSON.parse(response);
      console.log(sessionList);

      const sessionId = msg.content;
      const currentSessionIndex = sessionId.substring("##LEAPP##".length, sessionId.lastIndexOf("##"));
      console.log("CurrentSessionId " + currentSessionIndex);

      const sessionData = sessionList[Number(currentSessionIndex)];
      const sessionName = sessionData.data.sessionName;

      function updateDiv() {
        const navigationDiv = document.querySelector("body");
        if (navigationDiv) {
          const leftContentDiv = document.createElement("div");
          const accountTextElement = document.createTextNode("");
          accountTextElement.textContent = sessionName;

          leftContentDiv.appendChild(accountTextElement);
          leftContentDiv.classList.add("left-content");
          leftContentDiv.style["width"] = "300px"; //blaDiv.style = "width: 300px; height: 300px; background-color: blue; position: fixed; top: 0; left: 0; z-index: 2000"
          leftContentDiv.style["height"] = "300px";
          leftContentDiv.style["background-color"] = "blue";
          leftContentDiv.style["position"] = "fixed";
          leftContentDiv.style["top"] = "0";
          leftContentDiv.style["left"] = "0";
          leftContentDiv.style["z-index"] = "2000";

          navigationDiv.prepend(leftContentDiv);
        }
      }
      setTimeout(updateDiv, 2000);
    });
  });
})();
