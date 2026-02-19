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

  let currentLang = localStorage.getItem("lang") || "ja";

  function applyLanguage(lang) {
    const t = translations[lang];

    document.querySelector(".btn-secondary").textContent = t.add;
    document.querySelector(".btn-danger").textContent = t.clear;
    document.querySelector(".btn-primary.full").textContent = t.calculate;
    document.querySelector(".length-input").placeholder = t.placeholder;
    document.querySelector(".modal h2").textContent = t.settings;
    document.querySelector(".setting-group label").textContent = t.tolerance;
    document.querySelectorAll(".setting-group label")[2].textContent = t.blocks;
    document.querySelector(".modal .btn-primary").textContent = t.save;

    renderList(); // 削除ボタン再描画
  }

  // ===== Elements =====
  const input = document.querySelector(".length-input");
  const addBtn = document.querySelector(".btn-secondary");
  const list = document.querySelector(".target-list");
  const clearBtn = document.querySelector(".btn-danger");
  const languageSelect = document.querySelector("select");

  let targets = [];

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

  addBtn.addEventListener("click", () => {
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      targets.push(value);
      input.value = "";
      renderList();
    }
  });

  list.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const index = e.target.getAttribute("data-index");
      targets.splice(index, 1);
      renderList();
    }
  });

  clearBtn.addEventListener("click", () => {
    targets = [];
    renderList();
  });

  // ===== Modal Control =====
  const settingsBtn = document.querySelector(".settings-btn");
  const modal = document.querySelector(".modal");
  const saveBtn = document.querySelector(".modal .btn-primary");

  settingsBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  saveBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // ===== Language Switch =====
  languageSelect.value = currentLang;
  applyLanguage(currentLang);

  languageSelect.addEventListener("change", (e) => {
    currentLang = e.target.value;
    localStorage.setItem("lang", currentLang);
    applyLanguage(currentLang);
  });

});
