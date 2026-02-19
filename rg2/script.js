document.addEventListener("DOMContentLoaded", () => {

  const input = document.querySelector(".length-input");
  const addBtn = document.querySelector(".btn-secondary");
  const list = document.querySelector(".target-list");
  const clearBtn = document.querySelector(".btn-danger");

  let targets = [];

  function renderList() {
    list.innerHTML = "";

    targets.forEach((value, index) => {
      const li = document.createElement("li");

      li.innerHTML = `
        <span class="mono">${value.toFixed(1)} mm</span>
        <button class="delete-btn" data-index="${index}">Delete</button>
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

// 背景クリックで閉じる
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});
