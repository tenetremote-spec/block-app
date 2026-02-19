// RG Support 2 - Lightweight Stable Version

document.addEventListener("DOMContentLoaded", () => {

  const { jsPDF } = window.jspdf || {};

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

  const BLOCK_STORAGE_KEY = "rg2_blocks";

  let currentLang = localStorage.getItem("rg2_lang") || "ja";

  // =======================
  // Language
  // =======================

  const translations = {
    ja:{add:"追加",clear:"クリア",calculate:"計算",pin:"ピン",blocks:"ブロック",total:"合計",noSolution:"解なし",savePDF:"PDF保存",toleranceDisplay:"許容誤差"},
    en:{add:"Add",clear:"Clear",calculate:"Calculate",pin:"Pin",blocks:"Blocks",total:"Total",noSolution:"No solution",savePDF:"Save PDF",toleranceDisplay:"Tolerance"},
    bn:{add:"যোগ",clear:"মুছুন",calculate:"হিসাব",pin:"পিন",blocks:"ব্লক",total:"মোট",noSolution:"সমাধান নেই",savePDF:"PDF সংরক্ষণ",toleranceDisplay:"সহনশীলতা"}
  };

  function applyLanguage(lang){
    currentLang=lang;
    localStorage.setItem("rg2_lang",lang);
    addBtn.textContent=translations[lang].add;
    clearBtn.textContent=translations[lang].clear;
    calcBtn.textContent=translations[lang].calculate;
    updateToleranceDisplay();
    languageSelect.value=lang;
  }

  function updateToleranceDisplay(){
    const t=parseFloat(toleranceInput.value)||0.1;
    toleranceDisplay.textContent=`${translations[currentLang].toleranceDisplay} : ±${t} mm`;
  }

  applyLanguage(currentLang);

  // =======================
  // Settings FIX
  // =======================

  if(settingsBtn){
    settingsBtn.onclick=()=>modal.classList.remove("hidden");
  }

  if(saveSettingsBtn){
    saveSettingsBtn.onclick=()=>{
      applyLanguage(languageSelect.value);
      modal.classList.add("hidden");
    };
  }

  window.onclick=(e)=>{
    if(e.target===modal) modal.classList.add("hidden");
  };

  document.addEventListener("keydown",(e)=>{
    if(e.key==="Escape") modal.classList.add("hidden");
  });

  // =======================
  // Block Persistence
  // =======================

  function saveBlocks(){
    const blocks=[...document.querySelectorAll(".block-item")].map(i=>({
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
    if(saved){
      blockList.innerHTML="";
      JSON.parse(saved).forEach(b=>createBlockItem(b.value,b.checked));
    }else{
      saveBlocks();
    }
  }

  loadBlocks();

  if(addBlockBtn){
    addBlockBtn.onclick=()=>{
      const v=parseFloat(blockInput.value);
      if(isNaN(v))return;
      createBlockItem(v,true);
      blockInput.value="";
      saveBlocks();
    };
  }

  // =======================
  // Target UI
  // =======================

  addBtn.onclick=()=>{
    const v=parseFloat(input.value);
    if(isNaN(v))return;
    const li=document.createElement("li");
    li.innerHTML=`<span class="mono">${v.toFixed(1)}</span>
    <button class="delete-btn">Delete</button>`;
    li.querySelector(".delete-btn").onclick=()=>li.remove();
    targetList.appendChild(li);
    input.value="";
  };

  clearBtn.onclick=()=>{
    targetList.innerHTML="";
    resultsContainer.innerHTML="";
  };

  // =======================
  // Lightweight Calculation
  // =======================

  calcBtn.onclick=()=>{

    resultsContainer.innerHTML="";
    const tolerance=parseFloat(toleranceInput.value)||0.1;
    const targets=getTargets().sort((a,b)=>b-a);
    const blocks=getActiveBlocks();

    let prevPin=3000;

    targets.forEach(target=>{

      const result=findFast(target,blocks,tolerance,prevPin);

      if(result){
        prevPin=result.pin;
        displayResult(target,result);
      }else{
        displayResult(target,{noSolution:true});
      }

    });

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
          total:pin+sum,
          diff:Math.abs(pin+sum-target)
        };
      }

    }

    return null;
  }

  function displayResult(target,result){

    const div=document.createElement("div");
    div.className="result-item";

    if(result.noSolution){
      div.innerHTML=`<hr><p><strong>${target} mm</strong></p>
      <p style="color:red;">${translations[currentLang].noSolution}</p>`;
    }else{
      div.innerHTML=`<hr>
      <p><strong>${target} mm</strong></p>
      <p>${translations[currentLang].pin} : ${result.pin}</p>
      <p>${translations[currentLang].blocks} : ${result.blocks.join(" + ")}</p>
      <p><strong>${translations[currentLang].total} : ${result.total.toFixed(3)} mm</strong></p>`;
    }

    resultsContainer.appendChild(div);
  }

});
