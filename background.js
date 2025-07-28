// background.js

let officialDomains = [];

// Load official sites list at background startup
fetch(chrome.runtime.getURL('official_sites.json'))
  .then(res => res.json())
  .then(data => {
    officialDomains = data.map(d => d.replace(/^www\./, "").toLowerCase());
    console.log('Official domains loaded:', officialDomains);
  })
  .catch(err => {
    console.error('Error loading official sites JSON:', err);
    officialDomains = [];
  });

// Utility for extracting/normalizing domains
function normalizeDomain(domain) {
  return domain.replace(/^www\./, "").toLowerCase();
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!officialDomains || officialDomains.length === 0) return;

  let domain = "";
  try {
    const urlObj = new URL(tab.url);
    domain = normalizeDomain(urlObj.hostname);
  } catch {
    return;
  }

  const autoGovt = domain.endsWith('.gov.in') || domain.endsWith('.nic.in');
  const manualGovt = officialDomains.includes(domain);
  const isOfficial = autoGovt || manualGovt;

  chrome.tabs.sendMessage(tabId, {
    action: "cyber_status",
    isOfficial: isOfficial,
    domain: domain
  });
});
