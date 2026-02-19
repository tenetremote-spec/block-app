document.addEventListener("DOMContentLoaded", () => {

  // ===== Translation Data =====
  const translations = {
    ja: {
      add: "追加",
      delete: "削除",
      clear: "全削除",
      calculate: "計算",
      settings: "設定",
      tolerance: "許容差",
      blocks: "ブロック",
      save: "保存",
      placeholder: "長さを入力 (mm)"
    },
    en: {
      add: "Add",
      delete: "Delete",
      clear: "Clear All",
      calculate: "Calculate",
      settings: "Settings",
      tolerance: "Tolerance",
      blocks: "Blocks",
      save: "Save",
      placeholder: "Enter length (mm)"
    },
    bn: {
      add: "যোগ",
      delete: "মুছুন",
      clear: "সব মুছুন",
      calculate: "গণনা",
      settings: "সেটিংস",
      tolerance: "টলারেন্স",
      blocks: "ব্লক",
      save: "সংরক্ষণ",
      placeholder: "দৈর্ঘ্য লিখুন (mm)"
    }
  };

  // ===== State =====
  let currentLang = localStorage.getItem("lang") || "ja";
  let tolerance = parseFloat(localStorage.getItem("tolerance")) || 0.1;
  let targets = [];

  // ===== Elements =====
  const input = document.querySelector(".length-input");
  const addBtn = document.querySelector(".btn-secondary");
  const list = document.querySelector(".target-list");
  const clearBtn = document.querySelector(".btn-danger");
  const languageSelect = document.querySelector("select");
  const settingsBtn = document.querySelector(".settings-btn");
  const modal = document.querySelector(".modal");
  const saveBtn = document.querySelector(".modal .btn-primary");
  const toleranceInput = document.querySelector(
    '.setting-group input[type="number"]'
  );

  // ===== Apply Language =====
  function applyLanguage(lang) {
    const t = translations[lang];

    document.querySelector(".btn-secondary").textContent = t.add;
    document.querySelector(".btn-danger").textContent = t.clear;
    document.querySelector(".btn-primary.full").textContent = t.calculate;
    document.querySelector(".length-input").placeholder = t.placeholder;
    document.querySelector(".modal h2").textContent = t.settings;

    document.querySelectorAll(".setting-group label")[0].textContent =
      t.tolerance;
    document.querySelectorAll(".setting-group label")[2].textContent =
      t.blocks;

    document.querySelector(".modal .btn-primary").textContent = t.save;

    document.querySelector(".tolerance-display").textContent =
      `${t.tolerance} : ±${tolerance} mm`;

    renderList();
  }

  // ===== Render List =====
  function renderList() {
    list.innerHTML = "";

    targets.forEach((value, index) => {
      const li = document.createElement("li");

      li.innerHTML = `
        <span class="mono">${value.toFixed(1)} mm</span>
        <button class="delete-btn" data-index="${index}">
          ${translations[currentLang].delete}
        </button>
      `;

      list.appendChild(li);
    });
  }

  // ===== Add Target =====
  addBtn.addEventListener("click", () => {
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      targets.push(value);
      input.value = "";
      renderList();
    }
  });

  // ===== Delete Target =====
  list.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const index = e.target.getAttribute("data-index");
      targets.splice(index, 1);
      renderList();
    }
  });

  // ===== Clear All =====
  clearBtn.addEventListener("click", () => {
    targets = [];
    renderList();
  });

  // ===== Modal Control =====
  settingsBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  saveBtn.addEventListener("click", () => {

    const newTolerance = parseFloat(toleranceInput.value);

    if (!isNaN(newTolerance)) {
      tolerance = newTolerance;
      localStorage.setItem("tolerance", tolerance);
    }

    modal.classList.add("hidden");
    applyLanguage(currentLang);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // ===== Language Switch =====
  languageSelect.value = currentLang;
  toleranceInput.value = tolerance;
  applyLanguage(currentLang);

  languageSelect.addEventListener("change", (e) => {
    currentLang = e.target.value;
    localStorage.setItem("lang", currentLang);
    applyLanguage(currentLang);
  });

});
