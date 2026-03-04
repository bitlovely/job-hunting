const blacklistList = document.getElementById("blacklist");
const blacklistInput = document.getElementById("blacklistInput");
const addBlacklistBtn = document.getElementById("addBlacklist");
const searchBtn = document.getElementById("searchBtn");

function renderBlacklist(companies) {
  blacklistList.innerHTML = "";

  companies.forEach((company, index) => {
    const li = document.createElement("li");
    li.textContent = company;
    li.title = "Click to remove";
    li.addEventListener("click", () => removeCompany(index));
    blacklistList.appendChild(li);
  });
}

function loadBlacklist() {
  chrome.storage.local.get(["blacklist"], (result) => {
    const companies = result.blacklist || [];
    renderBlacklist(companies);
  });
}

function saveBlacklist(companies) {
  chrome.storage.local.set({ blacklist: companies }, () => {
    renderBlacklist(companies);
  });
}

function addCompany() {
  const company = blacklistInput.value.trim().toLowerCase();
  if (!company) return;

  chrome.storage.local.get(["blacklist"], (result) => {
    const companies = result.blacklist || [];
    if (!companies.includes(company)) {
      companies.push(company);
      saveBlacklist(companies);
    }
  });

  blacklistInput.value = "";
}

function removeCompany(index) {
  chrome.storage.local.get(["blacklist"], (result) => {
    const companies = result.blacklist || [];
    if (index >= 0 && index < companies.length) {
      companies.splice(index, 1);
      saveBlacklist(companies);
    }
  });
}

addBlacklistBtn.addEventListener("click", addCompany);

blacklistInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addCompany();
  }
});

searchBtn.addEventListener("click", () => {
  const country = document.getElementById("country").value;
  const keywords = document.getElementById("keywords").value;
  const industry = document.getElementById("industry").value;

  chrome.storage.local.get(["blacklist"], (result) => {
    const companies = result.blacklist || [];
    const blacklistQuery = companies.map((c) => `-${c}`).join(" ");

    // Always remote, software engineer, and job in query
    const query = `${country} remote job software engineer ${keywords} ${industry} ${blacklistQuery}`;

    chrome.tabs.create({
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    });
  });
});

loadBlacklist();