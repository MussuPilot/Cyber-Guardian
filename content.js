// content.js

// Utility: normalize domains (strip www, lowercase)
function normalizeDomain(domain) {
  return domain.replace(/^www\./, "").toLowerCase();
}

// Listen for domain verification messages
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "cyber_status") {
    const domain = normalizeDomain(request.domain);
    chrome.storage.local.get(['userWhitelist'], (result) => {
      const whitelist = (result.userWhitelist || []).map(normalizeDomain);
      const isWhitelisted = whitelist.includes(domain);
      showCyberStatus(request.isOfficial || isWhitelisted, domain, isWhitelisted);
    });
  }
});

/**
 * Show/update the notification bar with site status.
 * @param {boolean} isVerified - Is site official or whitelisted?
 * @param {string} domain - Normalized domain name
 * @param {boolean} isWhitelisted - Is domain already trusted?
 */
function showCyberStatus(isVerified, domain, isWhitelisted) {
  let statusBar = document.getElementById("cyber-guardian-bar");

  if (!statusBar) {
    statusBar = document.createElement("div");
    statusBar.id = "cyber-guardian-bar";
    statusBar.style.position = "fixed";
    statusBar.style.top = "20px";
    statusBar.style.right = "20px";
    statusBar.style.zIndex = "99999";
    statusBar.style.padding = "14px 26px";
    statusBar.style.color = "#fff";
    statusBar.style.fontSize = "16px";
    statusBar.style.borderRadius = "8px";
    statusBar.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
    statusBar.style.display = "flex";
    statusBar.style.alignItems = "center";
    statusBar.style.gap = "12px";
    statusBar.style.maxWidth = "400px";
    statusBar.style.fontFamily = "Arial, sans-serif";

    const messageContainer = document.createElement("span");
    messageContainer.id = "cyber-guardian-message";
    statusBar.appendChild(messageContainer);

    const addBtn = document.createElement("button");
    addBtn.id = "cyber-guardian-add-btn";
    addBtn.textContent = "Add to Trusted";
    addBtn.style.marginLeft = "12px";
    addBtn.style.padding = "6px 12px";
    addBtn.style.border = "none";
    addBtn.style.borderRadius = "5px";
    addBtn.style.cursor = "pointer";
    addBtn.style.backgroundColor = "#333";
    addBtn.style.color = "#fff";
    addBtn.style.display = "none";
    statusBar.appendChild(addBtn);

    addBtn.onclick = () => addDomainToWhitelist(domain);

    const closeBtn = document.createElement("span");
    closeBtn.id = "cyber-guardian-close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontWeight = "bold";
    closeBtn.style.fontSize = "22px";
    closeBtn.style.lineHeight = "1";
    closeBtn.style.marginLeft = "12px";
    closeBtn.setAttribute("title", "Close notification");
    closeBtn.onclick = () => { statusBar.style.display = "none"; };
    statusBar.appendChild(closeBtn);

    document.body.appendChild(statusBar);
  }

  // Update content based on new state
  const messageContainer = document.getElementById("cyber-guardian-message");
  const addBtn = document.getElementById("cyber-guardian-add-btn");
  const statusBarElem = document.getElementById("cyber-guardian-bar");

  if (isVerified) {
    messageContainer.textContent = isWhitelisted
      ? `✅ Trusted site: ${domain}`
      : `✅ Official site verified: ${domain}`;
    statusBarElem.style.backgroundColor = "#14c714";
    addBtn.style.display = "none";
  } else {
    messageContainer.textContent = `⚠️ This site (${domain}) is not verified. If you trust it, click "Add to Trusted".`;
    statusBarElem.style.backgroundColor = "#d02020";
    addBtn.style.display = "inline-block";
  }
  statusBarElem.style.display = "flex";
}

// Add normalized domain to the user's whitelist in storage, prevent duplicates
function addDomainToWhitelist(domain) {
  const normalized = normalizeDomain(domain);
  chrome.storage.local.get(['userWhitelist'], (result) => {
    let whitelist = (result.userWhitelist || []).map(normalizeDomain);
    if (!whitelist.includes(normalized)) {
      whitelist.push(normalized);
      chrome.storage.local.set({ userWhitelist: whitelist }, () => {
        alert(`${normalized} added to your trusted list.`);
        showCyberStatus(true, normalized, true);
      });
    } else {
      alert(`${normalized} is already in your trusted list.`);
    }
  });
}
