const MOVEMENT_TIMING = 1000;
const BOUNCE_TIMING = 200;
const SHAKE_TIMING = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const groups = [
  { name: "test", answers: ["1", "2", "3", "4"] },
  { name: "test2", answers: ["5", "6", "7", "8"] },
  { name: "test3", answers: ["9", "10", "11", "12"] },
  { name: "test4", answers: ["13", "14", "15", "16"] },
];

// Combine all answers and permutate
const combinedAnswers = [
  ...groups[0].answers,
  ...groups[1].answers,
  ...groups[2].answers,
  ...groups[3].answers,
];

const shuffledAnswers = getRandomPermutation(combinedAnswers);

const tileGroup = document.querySelector(".tileGroup");

shuffledAnswers.forEach((answer, index) => {
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("buttonContainer");
  const button = document.createElement("button");
  button.classList.add("buttonTile");
  button.id = `tile_${index}`;
  button.addEventListener("click", buttonClick);
  button.innerHTML = answer;
  buttonContainer.append(button);
  tileGroup.append(buttonContainer);
});

const submitButton = document.getElementById("submitButton");
const deselectButton = document.getElementById("deselectButton");
let allTiles = document.querySelectorAll(".buttonTile");

const selected = [];
let currentRow = 0;
let lives = 4;
const attemptedAnswers = [];

const livesSpan = document.getElementById("lives");
livesSpan.innerHTML = "* ".repeat(lives);

function buttonClick() {
  if (this.classList.contains("selected")) {
    this.classList.remove("selected");
    const index = selected.findIndex(
      (item) => item.innerText === this.innerText,
    );
    if (index !== -1) {
      selected.splice(index, 1);
    }
  } else {
    selected.push(this);
    this.classList.add("selected");
  }
  if (selected.length === 4) {
    // Get all elements that aren't selected and make them non clickable
    const unClickedTiles = document.querySelectorAll(
      ".buttonTile:not(.selected)",
    );
    for (tile of unClickedTiles) {
      tile.disabled = true;
    }
  } else {
    // Make all in play tiles clickable again
    allTiles.forEach((tile) => {
      tile.disabled = false;
    });
  }
  submitButton.disabled = selected.length !== 4;
  deselectButton.disabled = selected.length === 0;
}

async function bounceTile(tile) {
  tile.animate(
    [
      { transform: "translateY(0px)" },
      { transform: "translateY(-10px)" },
      { transform: "translateY(0px)" }, // Return to start
    ],
    {
      duration: BOUNCE_TIMING,
      easing: "ease-in-out",
    },
  );
  await sleep(BOUNCE_TIMING / 2);
}

function shakeTile(tile) {
  tile.animate(
    [
      { transform: "translateX(0px)" },
      { transform: "translateX(-10px)" },
      { transform: "translateX(10px)" },
      { transform: "translateX(-10px)" },
      { transform: "translateX(10px)" },
      { transform: "translateX(0px)" }, // Return to start
    ],
    {
      duration: SHAKE_TIMING,
      easing: "ease-in-out",
    },
  );
}

async function submit() {
  // how many of the selected element match on of the groups
  selectedAnswers = selected.map((tile) => tile.innerText);
  // If we've already tried this answer, notify and return early
  for (let i = 0; i < attemptedAnswers.length; i++) {
    const numDifferingElements = new Set(selectedAnswers).difference(
      new Set(attemptedAnswers[i]),
    ).size;
    if (numDifferingElements === 0) {
      console.log("ALREADY TRIED THIS ANSWER");
      return;
    }
  }

  // Bounce the selected tiles
  for (const tile of selected) {
    await bounceTile(tile);
  }
  await sleep(500);

  attemptedAnswers.push(selectedAnswers);
  for (let i = 0; i < groups.length; i++) {
    const numDifferingElements = new Set(selectedAnswers).difference(
      new Set(groups[i].answers),
    ).size;
    if (numDifferingElements === 0) {
      console.log("SUCCESS");
      moveSuccesfulAnswer(groups[i]);
      return;
    } else if (numDifferingElements === 1) {
      console.log("ONE AWAY");
    }
  }
  // Shake wrong answer
  for (const tile of selected) {
    shakeTile(tile);
  }
  lives--;
  submitButton.disabled = true;
  livesSpan.innerHTML = "* ".repeat(lives);
  console.log("WRONG ANSWER");
}

async function moveSuccesfulAnswer(answerGroup) {
  // Find tiles to move. I.e. selected tiles that aren't in the correct row
  const tilesToMove = selected.filter((tile) => {
    const index = [...tile.parentElement.parentElement.children].indexOf(
      tile.parentElement,
    );

    return index > 3 + currentRow;
  });
  const totalTiles = document.querySelectorAll(".buttonTile");
  const tilesInRow = Array.from(totalTiles).slice(0, 4);
  const emptySpaces = tilesInRow.filter(
    (tile) => !tile.classList.contains("selected"),
  );
  const animations = [];
  for (let i = 0; i < tilesToMove.length; i++) {
    animations.push(swapElementsAnimated(tilesToMove[i], emptySpaces[i]));
  }
  await Promise.all(animations);

  // Add new div with category
  const categoryContainer = document.createElement("div");
  categoryContainer.classList.add("categoryContainer");
  categoryContainer.style.height = `${allTiles[0].offsetHeight - 5}px`;
  const categoryText = document.createElement("p");
  categoryText.innerHTML = answerGroup.name;
  categoryContainer.append(categoryText);
  const categoryAnswers = document.createElement("p");
  categoryAnswers.innerHTML = `${answerGroup.answers[0]}, ${answerGroup.answers[1]}, ${answerGroup.answers[2]}, ${answerGroup.answers[3]}`;
  categoryContainer.append(categoryAnswers);

  // Prepend to the tilegroup
  tileGroup.insertBefore(
    categoryContainer,
    tileGroup.children[currentRow] || null,
  );

  // Delete the completed tiles
  selected.forEach((tile) => {
    tile.parentElement.remove();
  });
  allTiles = document.querySelectorAll(".buttonTile");
  currentRow++;
  deselectAll();
}

function deselectAll() {
  selected.forEach((tile) => {
    tile.classList.remove("selected");
  });
  selected.length = 0;
  submitButton.disabled = true;
  deselectButton.disabled = true;
  enableAll();
}

function enableAll() {
  allTiles.forEach((tile) => (tile.disabled = false));
}

function shuffle() {
  const newLayout = getRandomPermutation(allTiles);
  for (let i = 0; i < allTiles.length; i++) {
    swapElements(allTiles[i], newLayout[i]);
  }
}

function getRandomPermutation(array) {
  const result = [...array]; // Copy array to avoid mutating the original

  for (let i = result.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements at i and j
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function swapElements(el1, el2) {
  // Create a temporary placeholder
  const temp = document.createElement("div");
  // Put the placeholder where el1 is
  el1.replaceWith(temp);
  // Move el1 to where el2 is
  el2.replaceWith(el1);
  // Move el2 to the placeholder's spot
  temp.replaceWith(el2);
}

function swapElementsAnimated(el1, el2) {
  // 1. FIRST: Record the starting positions of both buttons
  const rectA = el1.getBoundingClientRect();
  const rectB = el2.getBoundingClientRect();

  // Create a temporary placeholder
  const temp = document.createElement("div");
  // Put the placeholder where el1 is
  el1.replaceWith(temp);
  // Move el1 to where el2 is
  el2.replaceWith(el1);
  // Move el2 to the placeholder's spot
  temp.replaceWith(el2);

  // Measure their new positions immediately after the swap
  const newRectA = el1.getBoundingClientRect();
  const newRectB = el2.getBoundingClientRect();

  // 3. INVERT: Calculate the distance each button moved
  const deltaXA = rectA.left - newRectA.left;
  const deltaYA = rectA.top - newRectA.top;

  const deltaXB = rectB.left - newRectB.left;
  const deltaYB = rectB.top - newRectB.top;

  // 4. PLAY: Animate from their old coordinates to their new coordinates
  const timing = {
    duration: MOVEMENT_TIMING,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)", // Smooth deceleration
  };

  const anim1 = el1.animate(
    [
      { transform: `translate(${deltaXA}px, ${deltaYA}px)` },
      { transform: "translate(0, 0)" },
    ],
    timing,
  );

  const anim2 = el2.animate(
    [
      { transform: `translate(${deltaXB}px, ${deltaYB}px)` },
      { transform: "translate(0, 0)" },
    ],
    timing,
  );
  return Promise.all([anim1.finished, anim2.finished]);
}
