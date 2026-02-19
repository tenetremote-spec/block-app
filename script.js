// RG Support 2 - FINAL COMPLETE STABLE (完全段取り最小探索版)

const APP_VERSION = "2.0.0 - Full Setup Minimization DFS";

document.addEventListener("DOMContentLoaded", () => {

  // =======================
  // Elements（変更なし）
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
  const resultsTitle = document.querySelector(".results-title");

  const BLOCK_STORAGE_KEY = "rg2_blocks";

  let currentLang = localStorage.getItem("rg2_lang") || "ja";
  let lastResults = [];

  toleranceInput.value = "0";

  // =======================
  // Language（変更なし）
  // =======================

  const translations = {
    ja:{add:"追加",clear:"クリア",calculate:"計算",pin:"ピン",blocks:"ブロック",total:"合計",noSolution:"解なし",delete:"削除",toleranceDisplay:"許容誤差",settings:"設定",save:"保存",toleranceLabel:"許容誤差 (mm)",languageLabel:"言語",pinsLabel:"ピン (50mmピッチ / 固定)",blocksLabel:"ブロック",lengthPlaceholder:"寸法を入力",blockPlaceholder:"ブロック寸法",tolerancePlaceholder:"許容誤差",sort:"ソート",result:"結果"},
    en:{add:"Add",clear:"Clear",calculate:"Calculate",pin:"Pin",blocks:"Blocks",total:"Total",noSolution:"No solution",delete:"Delete",toleranceDisplay:"Tolerance",settings:"Settings",save:"Save",toleranceLabel:"Tolerance (mm)",languageLabel:"Language",pinsLabel:"Pins (50mm pitch / Fixed)",blocksLabel:"Blocks",lengthPlaceholder:"Enter length",blockPlaceholder:"Block size",tolerancePlaceholder:"Tolerance",sort:"Sort",result:"RESULT"},
    bn:{add:"যোগ",clear:"মুছুন",calculate:"হিসাব",pin:"পিন",blocks:"ব্লক",total:"মোট",noSolution:"সমাধান নেই",delete:"মুছুন",toleranceDisplay:"সহনশীলতা",settings:"সেটিংস",save:"সংরক্ষণ",toleranceLabel:"সহনশীলতা (mm)",languageLabel:"ভাষা",pinsLabel:"পিন (৫০মিমি পিচ / স্থির)",blocksLabel:"ব্লক",lengthPlaceholder:"মাত্রা লিখুন",blockPlaceholder:"ব্লক মাত্রা",tolerancePlaceholder:"সহনশীলতা",sort:"সাজান",result:"ফলাফল"}
  };

  function applyLanguage(lang){
    if(!translations[lang]) lang="ja";
    currentLang = lang;
    localStorage.setItem("rg2_lang", lang);

    addBtn.textContent = translations[lang].add;
    clearBtn.textContent = translations[lang].clear;
    calcBtn.textContent = translations[lang].calculate;
    saveSettingsBtn.textContent = translations[lang].save;
    addBlockBtn.textContent = translations[lang].add;

    input.placeholder = translations[lang].lengthPlaceholder;
    blockInput.placeholder = translations[lang].blockPlaceholder;
    toleranceInput.placeholder = translations[lang].tolerancePlaceholder;

    if(settingsTitle) settingsTitle.textContent = translations[lang].settings;
    if(toleranceLabel) toleranceLabel.textContent = translations[lang].toleranceLabel;
    if(languageLabel) languageLabel.textContent = translations[lang].languageLabel;
    if(pinsLabel) pinsLabel.textContent = translations[lang].pinsLabel;
    if(blocksLabel) blocksLabel.textContent = translations[lang].blocksLabel;
    if(resultsTitle) resultsTitle.textContent = translations[lang].result;

    updateToleranceDisplay();
    redrawResults();
    languageSelect.value = lang;
  }

  function updateToleranceDisplay(){
    const val = toleranceInput.value === "" ? "0" : toleranceInput.value;
    toleranceDisplay.textContent =
      `${translations[currentLang].toleranceDisplay} : ±${val} mm`;
  }

  toleranceInput.addEventListener("input", updateToleranceDisplay);

  settingsBtn.onclick = () => modal.classList.remove("hidden");
  saveSettingsBtn.onclick = () => {
    applyLanguage(languageSelect.value);
    modal.classList.add("hidden");
  };
  window.addEventListener("click", e=>{ if(e.target===modal) modal.classList.add("hidden");});
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") modal.classList.add("hidden");});

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

  clearBtn.onclick=()=>{
    targetList.innerHTML="";
    resultsContainer.innerHTML="";
    lastResults=[];
  };

  // =======================
  // 完全段取り最小探索
  // =======================

  calcBtn.onclick=()=>{

    resultsContainer.innerHTML="";
    lastResults=[];

    const tolerance=parseFloat(toleranceInput.value);
    const safeTolerance=isNaN(tolerance)?0:tolerance;

    const targets=getTargets().sort((a,b)=>b-a);
    const blocks=getActiveBlocks();

    let prevPin=3000;
    let prevBlocks=[];

    targets.forEach(target=>{

      const result=findOptimized(
        target,
        blocks,
        safeTolerance,
        prevPin,
        prevBlocks
      );

      if(result){
        prevPin=result.pin;
        prevBlocks=[...result.blocks];
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

  function findOptimized(target,blocks,tolerance,prevPin,prevBlocks){

    let best=null;
    let bestChanges=Infinity;

    for(let pin=prevPin;pin>=0;pin-=50){

      if(pin>target) continue;

      const remainder=target-pin;

      const result=dfsSearch(
        remainder,
        blocks,
        tolerance,
        prevBlocks,
        [],
        0,
        0,
        bestChanges
      );

      if(result && result.changes<bestChanges){
        bestChanges=result.changes;
        best={
          pin,
          blocks:result.blocks,
          total:pin+result.sum
        };
      }

      if(bestChanges===0) break;
    }

    return best;
  }

  function dfsSearch(target,blocks,tolerance,prevBlocks,current,sum,start,bestChanges){

    const error=Math.abs(sum-target);

    if(error<=tolerance){
      const changes=countChanges(prevBlocks,current);
      return {blocks:[...current],sum,changes};
    }

    if(sum>target+tolerance) return null;

    let best=null;

    for(let i=start;i<blocks.length;i++){

      current.push(blocks[i]);

      const changes=countChanges(prevBlocks,current);
      if(changes>=bestChanges){
        current.pop();
        continue;
      }

      const result=dfsSearch(
        target,
        blocks,
        tolerance,
        prevBlocks,
        current,
        sum+blocks[i],
        i,
        bestChanges
      );

      if(result){
        best=result;
        bestChanges=result.changes;
      }

      current.pop();
    }

    return best;
  }

  function countChanges(prev,next){
    const p=[...prev];
    let changes=0;
    next.forEach(b=>{
      const i=p.indexOf(b);
      if(i!==-1) p.splice(i,1);
      else changes++;
    });
    return changes+p.length;
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

  // =======================
  // Version Display（追加のみ）
  // =======================

  const versionTag = document.createElement("div");
  versionTag.style.position = "fixed";
  versionTag.style.bottom = "5px";
  versionTag.style.right = "10px";
  versionTag.style.fontSize = "11px";
  versionTag.style.opacity = "0.6";
  versionTag.style.pointerEvents = "none";
  versionTag.textContent = "ver " + APP_VERSION;
  document.body.appendChild(versionTag);

});
