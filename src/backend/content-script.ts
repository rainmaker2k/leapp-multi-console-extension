import { initProviders } from "./init-providers";

require("./content-script.css");

const providers = initProviders();
providers.extractSessionIdService.listen();

function setBarColors(barDiv, sessionName) {
  if (sessionName.match(/[Tt]est/gi)) {
    barDiv.style.backgroundColor = "rgb(248 223 67";
    barDiv.style.color = "#000";
  } else if (sessionName.match(/[Aa]cceptance/gi)) {
    barDiv.style.backgroundColor = "rgb(242 116 40)";
    barDiv.style.color = "#000";
  } else if (sessionName.match(/[Pp]roduction/gi)) {
    barDiv.style.backgroundColor = "rgb(194 0 0)";
    barDiv.style.color = "#fff";
  } else {
    barDiv.style.backgroundColor = "#378137";
    barDiv.style.color = "#dadada";
  }
}

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
      const { sessionRole, sessionName, sessionRegion } = sessionData.data;

      let updateTimeOut = null;

      function updateDiv() {
        const divElement = document.querySelector("#awsc-navigation-container");
        if (divElement) {
          const barDiv = document.createElement("div");
          setBarColors(barDiv, sessionName);
          barDiv.className = "bar";

          const accountDiv = document.createElement("div");
          accountDiv.className = "account-name";
          accountDiv.textContent = sessionName;

          const roleDiv = document.createElement("div");
          roleDiv.className = "role-name";
          roleDiv.textContent = sessionRole;

          const regionDiv = document.createElement("div");
          regionDiv.className = "region-name";
          regionDiv.textContent = sessionRegion;

          const leftContentDiv = document.createElement("div");
          leftContentDiv.appendChild(accountDiv);
          leftContentDiv.appendChild(roleDiv);
          leftContentDiv.appendChild(regionDiv);
          barDiv.appendChild(leftContentDiv);

          leftContentDiv.classList.add("left-content");

          divElement.parentNode.insertBefore(barDiv, divElement);

          clearTimeout(updateTimeOut);
        }
      }

      updateTimeOut = setTimeout(updateDiv, 2000);
    });
  });
})();
