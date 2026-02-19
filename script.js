// RG Support 2 - Basic Calculation Engine

const calcBtn = document.querySelector(".calc-btn");
const resultsContainer = document.querySelector(".results-container");
const toleranceInput = document.querySelector(".tolerance-input");

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
  const items = document.querySelectorAll(".target-list li");
  return Array.from(items).map(li =>
    parseFloat(li.querySelector(".mono").textContent)
  );
}

function getActiveBlocks() {
  const blockItems = document.querySelectorAll(".block-item");
  return Array.from(blockItems)
    .filter(item => item.querySelector("input").checked)
    .map(item => parseFloat(item.querySelector(".mono").textContent))
    .sort((a, b) => b - a);
}

function calculateCombination(target, tolerance) {
  const pins = [];
  for (let i = 3000; i >= 0; i -= 50) {
    pins.push(i);
  }

  const blocks = getActiveBlocks();
  let bestResult = null;

  for (let pin of pins) {
    if (pin > target) continue;

    const remainder = target - pin;

    const blockResult = searchBlocks(remainder, blocks, tolerance);

    if (blockResult) {
      const total = pin + blockResult.sum;
      const diff = Math.abs(total - target);

      if (!bestResult || diff < bestResult.diff) {
        bestResult = {
          pin,
          blocks: blockResult.blocks,
          total,
          diff
        };
      }

      if (diff === 0) break; // perfect match
    }
  }

  return bestResult;
}

function searchBlocks(target, blocks, tolerance) {
  let best = null;

  function dfs(currentSum, usedBlocks, startIndex) {
    const diff = Math.abs(currentSum - target);

    if (diff <= tolerance) {
      if (!best || diff < best.diff || usedBlocks.length < best.blocks.length) {
        best = {
          sum: currentSum,
          blocks: [...usedBlocks],
          diff
        };
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
      <p style="color:red;">No solution within tolerance</p>
    `;
  } else {
    div.innerHTML = `
      <hr>
      <p><strong>${target} mm</strong></p>
      <p style="color:#1565c0;">Pin : ${result.pin}</p>
      <p style="color:#ef6c00;">Blocks : ${result.blocks.join(" + ")}</p>
      <p><strong>Total : ${result.total.toFixed(3)} mm</strong></p>
    `;
  }

  resultsContainer.appendChild(div);
}
