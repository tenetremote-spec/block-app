// RG Support 2 - FINAL STABLE (A Base + Safe Sort + Full Language + Full Calc)

document.addEventListener("DOMContentLoaded", () => {

  // =======================
  // Elements
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

  const blockInput = document.querySelector(".block-input");
  const addBlockBtn = document.querySelector(".add-block-btn");
  const blockList = document.querySelector(".block-list");

  const settingsTitle = document.querySelector(".settings-title");
  const toleranceLabel = document.querySelector(".tolerance-label");
  const languageLabel = document.querySelector(".language-label");
  const pinsLabel = document.querySelector(".pins-label");
  const blocksLabel = document.querySelector(".blocks-label");

  const BLOCK_STORAGE_KEY = "rg2_blocks";

  let currentLang = localStorage.getItem("rg2_lang") || "ja";
  let lastResults = [];
  let blockSortDesc = true;

  // =======================
  // Language
  // =======================

  const translations = {
    ja:{
      add:"追加",clear:"クリア",calculate:"計算",
      pin:"ピン",blocks:"ブロック",total:"合計",
      noSolution:"解なし",delete:"削除",
      toleranceDisplay:"許容誤差",
      settings:"設定",save:"保存",
      toleranceLabel:"許容誤差 (mm)",
      languageLabel:"言語",
      pinsLabel:"ピン (50mmピッチ / 固定)",
      blocksLabel:"ブロック",
      lengthPlaceholder:"寸法を入力",
      blockPlaceholder:"ブロック寸法",
      tolerancePlaceholder:"許容誤差",
      sort:"ソート"
    },
    en:{
      add:"Add",clear:"Clear",calculate:"Calculate",
      pin:"Pin",blocks:"Blocks",total:"Total",
      noSolution:"No solution",delete:"Delete",
      toleranceDisplay:"Tolerance",
      settings:"Settings",save:"Save",
      toleranceLabel:"Tolerance (mm)",
      languageLabel:"Language",
      pinsLabel:"Pins (50mm pitch / Fixed)",
      blocksLabel:"Blocks",
      lengthPlaceholder:"Enter length",
      blockPlaceholder:"Block size",
      tolerancePlaceholder:"Tolerance",
      sort:"Sort"
    }
  };

  function applyLanguage(lang){
    currentLang = lang;
    localStorage.setItem("rg2_lang", lang);

    addBtn.textContent = translations[lang].add;
    clearBtn.textContent = translations[lang].clear;
    calcBtn.textContent = translations[lang].calculate;
    saveSettingsBtn.textContent = translations[lang].save;

    input.placeholder = translations[lang].lengthPlaceholder;
    blockInput.placeholder = translations[lang].blockPlaceholder;
    toleranceInput.placeholder = translations[lang].tolerancePlaceholder;

    if(settingsTitle) settingsTitle.textContent = translations[lang].settings;
    if(toleranceLabel) toleranceLabel.textContent = translations[lang].toleranceLabel;
    if(languageLabel) languageLabel.textContent = translations[lang].languageLabel;
    if(pinsLabel) pinsLabel.textContent = translations[lang].pinsLabel;
    if(blocksLabel) blocksLabel.textContent = translations[lang].blocksLabel;

    updateToleranceDisplay();
    refreshDeleteButtons();
    redrawResults();
    updateSortButton();

    languageSelect.value = lang;
  }

  function updateToleranceDisplay(){
    const val = toleranceInput.value === "" ? "0" : toleranceInput.value;
    toleranceDisplay.textContent =
      `${translations[currentLang].toleranceDisplay} : ±${val} mm`;
  }

  toleranceInput.addEventListener("input", updateToleranceDisplay);

  // =======================
  // Settings (完全復活)
  // =======================

  settingsBtn.onclick = () => modal.classList.remove("hidden");

  saveSettingsBtn.onclick = () => {
    applyLanguage(languageSelect.value);
    modal.classList.add("hidden");
  };

  window.addEventListener("click", (e)=>{
    if(e.target === modal){
      modal.classList.add("hidden");
    }
  });

  document.addEventListener("keydown",(e)=>{
    if(e.key==="Escape") modal.classList.add("hidden");
  });

  // =======================
  // Block Persistence
  // =======================

  function saveBlocks(){
    const blocks=[...blockList.children].map(i=>({
      value:parseFloat(i.querySelector(".mono").textContent),
      checked:i.querySelector("input").checked
    }));
    localStorage.setItem(BLOCK_STORAGE_KEY,JSON.stringify(blocks));
  }

  function createBlockItem(value,checked=true){
    const div=document.createElement("div");
    div.className="block-item";
    div.innerHTML=`
      <span class="mono">${value}</span>
      <input type="checkbox" ${checked?"checked":""}>
      <button class="delete-btn small">✕</button>
    `;
    div.querySelector(".delete-btn").onclick=()=>{div.remove();saveBlocks();};
    div.querySelector("input").onchange=saveBlocks;
    blockList.appendChild(div);
  }

  function loadBlocks(){
    const saved=localStorage.getItem(BLOCK_STORAGE_KEY);
    if(!saved) return;
    blockList.innerHTML="";
    JSON.parse(saved).forEach(b=>createBlockItem(b.value,b.checked));
  }

  loadBlocks();

  // =======================
  // Block Sort（UIのみ）
  // =======================

  const sortBtn = document.createElement("button");
  sortBtn.className="sort-btn";
  blockList.parentNode.insertBefore(sortBtn, blockList);

  sortBtn.onclick=()=>{
    blockSortDesc = !blockSortDesc;
    sortBlocksUI();
  };

  function sortBlocksUI(){
    const items=[...blockList.children];

    items.sort((a,b)=>{
      const av=parseFloat(a.querySelector(".mono").textContent);
      const bv=parseFloat(b.querySelector(".mono").textContent);
      return blockSortDesc?bv-av:av-bv;
    });

    blockList.innerHTML="";
    items.forEach(i=>blockList.appendChild(i));
    saveBlocks();
    updateSortButton();
  }

  function updateSortButton(){
    sortBtn.textContent =
      translations[currentLang].sort + " : " + (blockSortDesc?"↓":"↑");
  }

  updateSortButton();

  // =======================
  // Add Block（壊さない構成）
  // =======================

  addBlockBtn.onclick=()=>{
    const v=parseFloat(blockInput.value);
    if(isNaN(v))return;
    createBlockItem(v,true);
    blockInput.value="";
    saveBlocks();
    sortBlocksUI();
  };

  // =======================
  // Add Target（完全復活）
  // =======================

  addBtn.onclick=()=>{
    const v=parseFloat(input.value);
    if(isNaN(v))return;

    const li=document.createElement("li");
    li.innerHTML=`
      <span class="mono">${v.toFixed(1)}</span>
      <button class="delete-btn">${translations[currentLang].delete}</button>
    `;
    li.querySelector(".delete-btn").onclick=()=>li.remove();

    targetList.appendChild(li);
    input.value="";
  };

  function refreshDeleteButtons(){
    document.querySelectorAll(".target-list .delete-btn").forEach(btn=>{
      btn.textContent=translations[currentLang].delete;
    });
  }

  clearBtn.onclick=()=>{
    targetList.innerHTML="";
    resultsContainer.innerHTML="";
    lastResults=[];
  };

  // =======================
  // Calculation（設計思想維持）
  // =======================

  calcBtn.onclick=()=>{

    resultsContainer.innerHTML="";
    lastResults=[];

    const tolerance=parseFloat(toleranceInput.value);
    const safeTolerance=isNaN(tolerance)?0:tolerance;

    const targets=getTargets().sort((a,b)=>b-a);
    const blocks=getActiveBlocks();

    let prevPin=3000;

    targets.forEach(target=>{
      const result=findFast(target,blocks,safeTolerance,prevPin);

      if(result){
        prevPin=result.pin;
        lastResults.push({target,...result});
      }else{
        lastResults.push({target,noSolution:true});
      }
    });

    redrawResults();
  };

  function getTargets(){
    return [...document.querySelectorAll(".target-list li")]
      .map(li=>parseFloat(li.querySelector(".mono").textContent));
  }

  function getActiveBlocks(){
    return [...document.querySelectorAll(".block-item")]
      .filter(i=>i.querySelector("input").checked)
      .map(i=>parseFloat(i.querySelector(".mono").textContent))
      .sort((a,b)=>b-a);
  }

  function findFast(target,blocks,tolerance,prevPin){

    for(let pin=prevPin;pin>=0;pin-=50){

      if(pin>target)continue;

      let remainder=target-pin;
      let sum=0;
      let used=[];

      for(let b of blocks){
        while(sum+b<=remainder+tolerance){
          sum+=b;
          used.push(b);
        }
      }

      if(Math.abs(sum-remainder)<=tolerance){
        return{
          pin,
          blocks:used,
          total:pin+sum
        };
      }
    }
    return null;
  }

  function redrawResults(){
    resultsContainer.innerHTML="";
    lastResults.forEach(displayResult);
  }

  function displayResult(result){

    const div=document.createElement("div");
    div.className="result-item";

    if(result.noSolution){
      div.innerHTML=`
        <hr>
        <p><strong>${result.target} mm</strong></p>
        <p style="color:red;">${translations[currentLang].noSolution}</p>
      `;
    }else{
      div.innerHTML=`
        <hr>
        <p><strong>${result.target} mm</strong></p>
        <p>${translations[currentLang].pin} : ${result.pin}</p>
        <p>${translations[currentLang].blocks} : ${result.blocks.join(" + ")}</p>
        <p><strong>${translations[currentLang].total} : ${result.total.toFixed(3)} mm</strong></p>
      `;
    }

    resultsContainer.appendChild(div);
  }

  applyLanguage(currentLang);

});
