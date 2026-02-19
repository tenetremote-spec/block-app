// RG Support 2 - Sequential Optimization + PDF Stable Version

document.addEventListener("DOMContentLoaded", () => {

  const { jsPDF } = window.jspdf;

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
      total: "合計",
      savePDF: "PDF保存"
    },
    en: {
      add: "Add",
      clear: "Clear All",
      calculate: "Calculate",
      noSolution: "No solution within tolerance",
      toleranceDisplay: "Tolerance",
      pin: "Pin",
      blocks: "Blocks",
      total: "Total",
      savePDF: "Save PDF"
    },
    bn: {
      add: "যোগ",
      clear: "সব মুছুন",
      calculate: "হিসাব করুন",
      noSolution: "নির্ধারিত সীমার মধ্যে সমাধান নেই",
      toleranceDisplay: "সহনশীলতা",
      pin: "পিন",
      blocks: "ব্লক",
      total: "মোট",
      savePDF: "PDF সংরক্ষণ"
    }
  };

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("rg2_lang", lang);
    addBtn.textContent = translations[lang].add;
    clearBtn.textContent = translations[lang].clear;
    calcBtn.textContent = translations[lang].calculate;
    languageSelect.value = lang;
    updateToleranceDisplay();
  }

  function updateToleranceDisplay() {
    const tolerance = parseFloat(toleranceInput.value) || 0.1;
    toleranceDisplay.textContent =
      `${translations[currentLang].toleranceDisplay} : ±${tolerance} mm`;
  }

  applyLanguage(currentLang);

  // =======================
  // Block persistence
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
      JSON.parse(saved).forEach(b => createBlockItem(b.value, b.checked));
    } else {
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
  // UI target handling
  // =======================

  addBtn.addEventListener("click", () => {
    const value = parseFloat(input.value);
    if (isNaN(value)) return;

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="mono">${value.toFixed(1)}</span>
      <button class="delete-btn">Delete</button>
    `;
    li.querySelector(".delete-btn").addEventListener("click", () => li.remove());
    targetList.appendChild(li);
    input.value = "";
  });

  clearBtn.addEventListener("click", () => {
    targetList.innerHTML = "";
    resultsContainer.innerHTML = "";
  });

  // =======================
  // Core Sequential Optimization
  // =======================

  calcBtn.addEventListener("click", () => {

    const tolerance = parseFloat(toleranceInput.value) || 0.1;
    const targets = getTargets().sort((a,b)=>b-a); // 長い順固定
    const blocks = getActiveBlocks();

    resultsContainer.innerHTML = "";

    const finalResults = sequentialOptimize(targets, blocks, tolerance);

    finalResults.forEach(r => displayResult(r.target, r));

    createPDFButton(finalResults, tolerance);
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

  function sequentialOptimize(targets, blocks, tolerance) {

  const pins = [];
  for (let i = 3000; i >= 0; i -= 50) pins.push(i);

  let prevPin = 3000;
  const results = [];

  for (let target of targets) {

    let found = null;

    for (let pin of pins) {

      if (pin > target) continue;
      if (pin > prevPin) continue; // 不可逆

      const remainder = target - pin;
      const blockResult = searchBlocks(remainder, blocks, tolerance);

      if (blockResult) {
        const total = pin + blockResult.sum;
        const diff = Math.abs(total - target);

        found = {
          target,
          pin,
          blocks: blockResult.blocks,
          total,
          diff
        };

        break; // ← ここが重要（最初の最大Pin採用）
      }
    }

    if (!found) {
      results.push({ target, noSolution: true });
    } else {
      prevPin = found.pin;
      results.push(found);
    }
  }

  return results;
}


  function countBlockChange(prev, current) {
    const prevCount = {};
    const currCount = {};

    prev.forEach(b => prevCount[b] = (prevCount[b]||0)+1);
    current.forEach(b => currCount[b] = (currCount[b]||0)+1);

    const keys = new Set([...Object.keys(prevCount), ...Object.keys(currCount)]);
    let change = 0;

    keys.forEach(k => {
      change += Math.abs((prevCount[k]||0)-(currCount[k]||0));
    });

    return change;
  }

  function searchBlocks(target, blocks, tolerance) {
    let best = null;

    function dfs(sum, used, start) {

      const diff = Math.abs(sum - target);

      if (diff <= tolerance) {
        if (!best || diff < best.diff || used.length < best.blocks.length) {
          best = { sum, blocks:[...used], diff };
        }
      }

      if (sum > target + tolerance) return;
      if (used.length >= 10) return;

      for (let i=start;i<blocks.length;i++){
        used.push(blocks[i]);
        dfs(sum+blocks[i],used,i);
        used.pop();
      }
    }

    dfs(0,[],0);
    return best;
  }

  function displayResult(target, result) {

    const div = document.createElement("div");
    div.className="result-item";

    if(result.noSolution){
      div.innerHTML=`<hr><p><strong>${target} mm</strong></p>
      <p style="color:red;">${translations[currentLang].noSolution}</p>`;
    }else{
      div.innerHTML=`<hr>
      <p><strong>${target} mm</strong></p>
      <p style="color:#1565c0;">${translations[currentLang].pin} : ${result.pin}</p>
      <p style="color:#ef6c00;">${translations[currentLang].blocks} : ${result.blocks.join(" + ")}</p>
      <p><strong>${translations[currentLang].total} : ${result.total.toFixed(3)} mm</strong></p>`;
    }

    resultsContainer.appendChild(div);
  }

  // =======================
  // PDF
  // =======================

  function createPDFButton(results, tolerance){

    const btn=document.createElement("button");
    btn.textContent=translations[currentLang].savePDF;
    btn.className="calc-btn";
    btn.style.marginTop="20px";

    btn.addEventListener("click",()=>generatePDF(results,tolerance));

    resultsContainer.appendChild(btn);
  }

  function generatePDF(results,tolerance){

    const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    doc.setFont("courier");

    let y=20;

    results.forEach((r,index)=>{

      if(y>270){
        doc.addPage();
        y=20;
      }

      if(r.noSolution){
        doc.text(`${r.target} mm : No solution`,20,y);
      }else{
        doc.text(`Target : ${r.target} mm`,20,y);
        y+=6;
        doc.text(`Pin    : ${r.pin}`,20,y);
        y+=6;
        doc.text(`Blocks : ${r.blocks.join(" + ")}`,20,y);
        y+=6;
        doc.text(`Total  : ${r.total.toFixed(3)} mm`,20,y);
        y+=6;
        doc.text(`Error  : ${r.diff.toFixed(3)} mm`,20,y);
      }

      y+=10;
    });

    doc.text(`Tolerance ±${tolerance} mm`,20,285);

    doc.save("RG_Support_Result.pdf");
  }

});
