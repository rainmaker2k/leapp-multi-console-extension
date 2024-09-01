import { initProviders } from "./init-providers";

require("./content-script.css");

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
      const { sessionRole, sessionName } = sessionData.data;

      let updateTimeOut = null;

      function updateDiv() {
        const divElement = document.querySelector("#awsc-navigation-container");
        if (divElement) {
          const barDiv = document.createElement("div");
          barDiv.className = "bar";

          const accountTextElement = document.createTextNode("");
          accountTextElement.textContent = sessionName;

          const roleTextElement = document.createTextNode("");
          roleTextElement.textContent = sessionRole;

          const leftContentDiv = document.createElement("div");
          leftContentDiv.appendChild(accountTextElement);
          leftContentDiv.appendChild(roleTextElement);
          barDiv.appendChild(leftContentDiv);

          leftContentDiv.classList.add("left-content");

          //divElement.prepend(leftContentDiv);
          divElement.parentNode.insertBefore(barDiv, divElement);

          clearTimeout(updateTimeOut);
        }
      }

      updateTimeOut = setTimeout(updateDiv, 2000);
    });
  });
})();
