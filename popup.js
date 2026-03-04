const blacklistList = document.getElementById("blacklist");
const blacklistInput = document.getElementById("blacklistInput");
const addBlacklistBtn = document.getElementById("addBlacklist");
const searchBtn = document.getElementById("searchBtn");

const countrySelect = document.getElementById("country");
const keywordsInput = document.getElementById("keywords");
const industryInput = document.getElementById("industry");
const postedAfterInput = document.getElementById("postedAfter");

const presetNameInput = document.getElementById("presetName");
const savePresetBtn = document.getElementById("savePreset");
const presetList = document.getElementById("presetList");

const DEFAULT_KEYWORDS = "frontend backend full stack";

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

function loadSearchConfig() {
  chrome.storage.local.get(["searchConfig"], (result) => {
    const config = result.searchConfig || {};

    countrySelect.value = config.country || "us";
    keywordsInput.value = config.keywords || DEFAULT_KEYWORDS;
    industryInput.value = config.industry || "";
    postedAfterInput.value = config.postedAfter || "";
  });
}

function saveSearchConfig() {
  const config = {
    country: countrySelect.value || "us",
    keywords: keywordsInput.value || DEFAULT_KEYWORDS,
    industry: industryInput.value || "",
    postedAfter: postedAfterInput.value || "",
  };

  chrome.storage.local.set({ searchConfig: config });
}

function executeSearch(config) {
  const country = config.country || "us";
  const keywords = config.keywords || DEFAULT_KEYWORDS;
  const industry = config.industry || "";
  const postedAfter = config.postedAfter || "";

  chrome.storage.local.get(["blacklist"], (result) => {
    const companies = result.blacklist || [];
    const blacklistQuery = companies.map((c) => `-${c}`).join(" ");

    // Always remote, software engineer, and job in query
    const query = `${country} remote job software engineer ${keywords} ${industry} ${blacklistQuery}`;

    const baseUrl = "https://www.google.com/search";
    const params = new URLSearchParams();
    params.set("q", query);

    // If user selected a "posted after" date, use Google custom date range
    // format: MM/DD/YYYY for cd_min
    if (postedAfter) {
      const [year, month, day] = postedAfter.split("-");
      const formatted = `${month}/${day}/${year}`;
      params.set("tbs", `cdr:1,cd_min:${formatted},cd_max:`);
    }

    chrome.tabs.create({
      url: `${baseUrl}?${params.toString()}`,
    });
  });
}

function renderPresets(presets) {
  presetList.innerHTML = "";

  presets.forEach((preset, index) => {
    const li = document.createElement("li");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = preset.name;
    nameSpan.title = "Click to run this query with current date filter";
    nameSpan.addEventListener("click", () => {
      const cfg = preset.config || {};
      const query = cfg.query || preset.name;
      const postedAfter = postedAfterInput.value || "";

      const baseUrl = "https://www.google.com/search";
      const params = new URLSearchParams();
      params.set("q", query);

      if (postedAfter) {
        const [year, month, day] = postedAfter.split("-");
        const formatted = `${month}/${day}/${year}`;
        params.set("tbs", `cdr:1,cd_min:${formatted},cd_max:`);
      }

      chrome.tabs.create({
        url: `${baseUrl}?${params.toString()}`,
      });
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.title = "Delete preset";
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      deletePreset(index);
    });

    li.appendChild(nameSpan);
    li.appendChild(deleteBtn);
    presetList.appendChild(li);
  });
}

function loadPresets() {
  chrome.storage.local.get(["presets"], (result) => {
    const presets = result.presets || [];
    renderPresets(presets);
  });
}

function savePresets(presets) {
  chrome.storage.local.set({ presets }, () => {
    renderPresets(presets);
  });
}

function addPreset() {
  const name = presetNameInput.value.trim();
  if (!name) return;

  chrome.storage.local.get(["presets"], (result) => {
    const presets = result.presets || [];
    const config = { query: name };

    // If a preset with same name exists, replace it
    const existingIndex = presets.findIndex((p) => p.name === name);
    if (existingIndex !== -1) {
      presets[existingIndex] = { name, config };
    } else {
      presets.push({ name, config });
    }

    savePresets(presets);
  });

  presetNameInput.value = "";
}

function deletePreset(index) {
  chrome.storage.local.get(["presets"], (result) => {
    const presets = result.presets || [];
    if (index >= 0 && index < presets.length) {
      presets.splice(index, 1);
      savePresets(presets);
    }
  });
}

addBlacklistBtn.addEventListener("click", addCompany);

blacklistInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addCompany();
  }
});

savePresetBtn.addEventListener("click", addPreset);

presetNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addPreset();
  }
});

searchBtn.addEventListener("click", () => {
  const country = countrySelect.value;
  const keywords = keywordsInput.value || DEFAULT_KEYWORDS;
  const industry = industryInput.value;
  const postedAfter = postedAfterInput.value;

  saveSearchConfig();

  const config = { country, keywords, industry, postedAfter };
  executeSearch(config);
});

loadBlacklist();
loadSearchConfig();
loadPresets();