// RG Support 2 - Fully Stable Version (Blocks Persistent)

document.addEventListener("DOMContentLoaded", () => {

  // =======================
  // Element references
  // =======================

  const addBtn = document.querySelector(".add-btn");
  const input = document.querySelector(".length-input");
  const targetList = document.querySelector(".target-list");
  const clearBtn = document.querySelector(".clear-btn");

  const calcBtn = document.querySelector(".calc-btn");
  const resultsContainer = document.querySelector(".results-container");
  const toleranceInput = document.querySelector(".tolerance-input");
  const toleranceDisplay = document.querySelector(".tolerance-display");

  const settingsBtn = document.querySelector(".settings-btn");
  const modal = document.querySelector(".modal");
  const saveSettingsBtn = document.querySelector(".save-settings-btn");
  const languageSelect = document.querySelector(".language-select");
  const pinGrid = document.querySelector(".pin-grid");

  const blockInput = document.querySelector(".block-input");
  const addBlockBtn = document.querySelector(".add-block-btn");
  const blockList = document.querySelector(".block-list");

  const BLOCK_STORAGE_KEY = "rg2_blocks";

  let currentLang = localStorage.getItem("rg2_lang") || "ja";

  // =======================
  // Pin Auto Generate
  // =======================

  if (pinGrid) {
    pinGrid.innerHTML = "";
    for (let i = 0; i <= 3000; i += 50) {
      const span = document.createElement("span");
      span.textContent = i;
      span.className = "pin-item";
      pinGrid.appendChild(span);
    }
  }

  // =======================
  // Language
  // =======================

  const translations = {
    ja: {
      add: "追加",
      clear: "クリア",
      calculate: "計算",
      noSolution: "許容範囲内に解なし",
      toleranceDisplay: "許容誤差",
      pin: "ピン",
      blocks: "ブロック",
      total: "合計"
    },
    en: {
      add: "Add",
      clear: "Clear All",
      calculate: "Calculate",
      noSolution: "No solution within tolerance",
      toleranceDisplay: "Tolerance",
      pin: "Pin",
      blocks: "Blocks",
      total: "Total"
    },
    bn: {
      add: "যোগ",
      clear: "সব মুছুন",
      calculate: "হিসাব করুন",
      noSolution: "নির্ধারিত সীমার মধ্যে সমাধান নেই",
      toleranceDisplay: "সহনশীলতা",
      pin: "পিন",
      blocks: "ব্লক",
      total: "মোট"
    }
  };

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("rg2_lang", lang);

    addBtn.textContent = translations[lang].add;
    clearBtn.textContent = translations[lang].clear;
    calcBtn.textContent = translations[lang].calculate;

    updateToleranceDisplay();
    languageSelect.value = lang;
  }

  function updateToleranceDisplay() {
    const tolerance = parseFloat(toleranceInput.value) || 0.1;
    toleranceDisplay.textContent =
      `${translations[currentLang].toleranceDisplay} : ±${tolerance} mm`;
  }

  applyLanguage(currentLang);

  // =======================
  // Block Persistence
  // =======================

  function saveBlocks() {
    const blocks = Array.from(document.querySelectorAll(".block-item")).map(item => ({
      value: parseFloat(item.querySelector(".mono").textContent),
      checked: item.querySelector("input").checked
    }));
    localStorage.setItem(BLOCK_STORAGE_KEY, JSON.stringify(blocks));
  }

  function createBlockItem(value, checked = true) {
    const div = document.createElement("div");
    div.className = "block-item";

    div.innerHTML = `
      <span class="mono">${value}</span>
      <input type="checkbox" ${checked ? "checked" : ""}>
      <button class="delete-btn small">✕</button>
    `;

    div.querySelector(".delete-btn").addEventListener("click", () => {
      div.remove();
      saveBlocks();
    });

    div.querySelector("input").addEventListener("change", saveBlocks);

    blockList.appendChild(div);
  }

  function loadBlocks() {
    const saved = localStorage.getItem(BLOCK_STORAGE_KEY);

    if (saved) {
      blockList.innerHTML = "";
      JSON.parse(saved).forEach(b =>
        createBlockItem(b.value, b.checked)
      );
    } else {
      // 初回のみHTML既存ブロックを保存
      saveBlocks();
    }
  }

  loadBlocks();

  if (addBlockBtn) {
    addBlockBtn.addEventListener("click", () => {
      const value = parseFloat(blockInput.value);
      if (isNaN(value)) return;

      createBlockItem(value, true);
      blockInput.value = "";
      saveBlocks();
    });
  }

  // =======================
  // UI
  // =======================

  addBtn.addEventListener("click", () => {
    const value = parseFloat(input.value);
    if (isNaN(value)) return;

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="mono">${value.toFixed(1)}</span>
      <button class="delete-btn">Delete</button>
    `;

    li.querySelector(".delete-btn").addEventListener("click", () => {
      li.remove();
    });

    targetList.appendChild(li);
    input.value = "";
  });

  clearBtn.addEventListener("click", () => {
    targetList.innerHTML = "";
    resultsContainer.innerHTML = "";
  });

  // =======================
  // Settings
  // =======================

  settingsBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  saveSettingsBtn.addEventListener("click", () => {
    applyLanguage(languageSelect.value);
    updateToleranceDisplay();
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.classList.add("hidden");
  });

  // =======================
  // Calculation
  // =======================

  calcBtn.addEventListener("click", () => {
    const targets = getTargets();
    const tolerance = parseFloat(toleranceInput.value) || 0.1;

    resultsContainer.innerHTML = "";

    targets.forEach(target => {
      const result = calculateCombination(target, tolerance);
      displayResult(target, result);
    });
  });

  function getTargets() {
    return Array.from(document.querySelectorAll(".target-list li"))
      .map(li => parseFloat(li.querySelector(".mono").textContent));
  }

  function getActiveBlocks() {
    return Array.from(document.querySelectorAll(".block-item"))
      .filter(item => item.querySelector("input").checked)
      .map(item => parseFloat(item.querySelector(".mono").textContent))
      .sort((a, b) => b - a);
  }

  function calculateCombination(target, tolerance) {
    const pins = [];
    for (let i = 3000; i >= 0; i -= 50) pins.push(i);

    const blocks = getActiveBlocks();
    let bestResult = null;

    for (let pin of pins) {
      if (pin > target) continue;

      const remainder = target - pin;
      const blockResult = searchBlocks(remainder, blocks, tolerance);

      if (blockResult) {
        const total = pin + blockResult.sum;
        const diff = Math.abs(total - target);

        if (!bestResult || diff < bestResult.diff ||
            blockResult.blocks.length < bestResult.blocks.length) {
          bestResult = { pin, blocks: blockResult.blocks, total, diff };
        }

        if (diff === 0) break;
      }
    }

    return bestResult;
  }

  function searchBlocks(target, blocks, tolerance) {
    let best = null;

    function dfs(currentSum, usedBlocks, startIndex) {
      const diff = Math.abs(currentSum - target);

      if (diff <= tolerance) {
        if (!best || diff < best.diff ||
            usedBlocks.length < best.blocks.length) {
          best = { sum: currentSum, blocks: [...usedBlocks], diff };
        }
      }

      if (usedBlocks.length >= 10) return;
      if (currentSum > target + tolerance) return;

      for (let i = startIndex; i < blocks.length; i++) {
        usedBlocks.push(blocks[i]);
        dfs(currentSum + blocks[i], usedBlocks, i);
        usedBlocks.pop();
      }
    }

    dfs(0, [], 0);
    return best;
  }

  function displayResult(target, result) {
    const div = document.createElement("div");
    div.className = "result-item";

    if (!result) {
      div.innerHTML = `
        <hr>
        <p><strong>${target} mm</strong></p>
        <p style="color:red;">${translations[currentLang].noSolution}</p>
      `;
    } else {
      div.innerHTML = `
        <hr>
        <p><strong>${target} mm</strong></p>
        <p style="color:#1565c0;">${translations[currentLang].pin} : ${result.pin}</p>
        <p style="color:#ef6c00;">${translations[currentLang].blocks} : ${result.blocks.join(" + ")}</p>
        <p><strong>${translations[currentLang].total} : ${result.total.toFixed(3)} mm</strong></p>
      `;
    }

    resultsContainer.appendChild(div);
  }

});
