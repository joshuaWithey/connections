const MOVEMENT_TIMING = 1000;
const BOUNCE_TIMING = 200;
const SHAKE_TIMING = 500;
const SHUFFLE_FADE_TIMING = 200;
const POPUP_FADE_TIMING = 300;
const POPUP_TIMING = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const groups = [
  { name: "test", answers: ["1", "2", "3", "4"], color: "green" },
  { name: "test2", answers: ["5", "6", "7", "8"], color: "yellow" },
  { name: "test3", answers: ["9", "10", "11", "12"], color: "blue" },
  { name: "test4", answers: ["13", "14", "15", "16"], color: "purple" },
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

combinedAnswers.forEach((answer, index) => {
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("buttonContainer");
  const button = document.createElement("button");
  button.classList.add("buttonTile");
  button.id = `tile_${index}`;
  button.addEventListener("pointerup", buttonClick);
  button.addEventListener("pointerdown", tilePress);
  const buttonText = document.createElement("span");
  buttonText.classList.add("tileText");
  buttonText.innerHTML = answer;
  button.append(buttonText);
  buttonContainer.append(button);
  tileGroup.append(buttonContainer);
});

const shuffleButton = document.getElementById("shuffleButton");
const submitButton = document.getElementById("submitButton");
const deselectButton = document.getElementById("deselectButton");
const popup = document.getElementById("popup");
let allTiles = document.querySelectorAll(".buttonTile");

const selected = [];
let currentRow = 0;
let lives = 4;
const attemptedAnswers = [];

const livesSpan = document.getElementById("lives");
livesSpan.innerHTML = "* ".repeat(lives);

let tileAnimationActive = null;

function buttonClick() {
  // if (this.classList.contains("selected")) {
  //   this.classList.remove("selected");
  //   const index = selected.findIndex(
  //     (item) => item.innerText === this.innerText,
  //   );
  //   if (index !== -1) {
  //     selected.splice(index, 1);
  //   }
  // } else {
  //   selected.push(this);
  //   this.classList.add("selected");
  // }
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
  if (selected.length === 4) {
    submitButton.classList.add("available");
    submitButton.disabled = false;
  } else {
    submitButton.classList.remove("available");
    submitButton.disabled = true;
  }
  deselectButton.disabled = selected.length === 0;
}

function tilePress(event) {
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
  // Shrink the element
  this.animate(
    [
      { transform: "scale(1)" }, // Starting state (enlarged)
      { transform: "scale(0.8)" }, // Ending state (normal)
    ],
    {
      duration: 500,
      easing: "ease-out",
      fill: "forwards",
    },
  );
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

async function animateCategory(category) {
  category.animate(
    [
      { opacity: 0, transform: "scale(1.2)" }, // Starting state (enlarged)
      { opacity: 1, transform: "scale(1)" }, // Ending state (normal)
    ],
    {
      duration: 500,
      easing: "ease-out",
    },
  );
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

async function showPopupMessage(text) {
  popup.innerHTML = text;
  popup.classList.add("display");
  const fadeIn = popup.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: POPUP_FADE_TIMING,
    easing: "ease-out",
  });
  await Promise.all([fadeIn.finished]);
  await sleep(POPUP_TIMING);
  const fadeOut = popup.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: POPUP_FADE_TIMING,
    easing: "ease-out",
  });
  await Promise.all([fadeOut.finished]);
  popup.classList.remove("display");
}

async function submit() {
  submitButton.disabled = true;
  // how many of the selected element match on of the groups
  selectedAnswers = selected.map((tile) => tile.innerText);
  // If we've already tried this answer, notify and return early
  for (let i = 0; i < attemptedAnswers.length; i++) {
    const numDifferingElements = new Set(selectedAnswers).difference(
      new Set(attemptedAnswers[i]),
    ).size;
    if (numDifferingElements === 0) {
      showPopupMessage("Already guessed!");
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
      showPopupMessage("One away...");
    }
  }
  // Shake wrong answer
  for (const tile of selected) {
    shakeTile(tile);
  }
  lives--;
  livesSpan.innerHTML = "* ".repeat(lives);
  console.log("WRONG ANSWER");
  submitButton.classList.remove("available");
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
  categoryContainer.classList.add(answerGroup.color);
  categoryContainer.classList.add("categoryContainer");
  categoryContainer.style.height = `${allTiles[0].offsetHeight - 5}px`;
  const categoryText = document.createElement("p");
  categoryText.innerHTML = answerGroup.name;
  categoryContainer.append(categoryText);
  const categoryAnswers = document.createElement("p");
  categoryAnswers.innerHTML = `${answerGroup.answers[0]}, ${answerGroup.answers[1]}, ${answerGroup.answers[2]}, ${answerGroup.answers[3]}`;
  categoryContainer.append(categoryAnswers);

  // Delete the completed tiles
  selected.forEach((tile) => {
    tile.parentElement.remove();
  });
  // Prepend to the tilegroup
  tileGroup.insertBefore(
    categoryContainer,
    tileGroup.children[currentRow] || null,
  );
  //   Animate
  await animateCategory(categoryContainer);

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
  submitButton.classList.remove("available");
  deselectButton.disabled = true;
  enableAll();
}

function enableAll() {
  allTiles.forEach((tile) => (tile.disabled = false));
}

async function shuffle() {
  shuffleButton.disabled = true;
  const newLayout = getRandomPermutation(allTiles);
  for (let i = 0; i < allTiles.length; i++) {
    swapElements(allTiles[i], newLayout[i]);
  }
  for (let i = 0; i < allTiles.length; i++) {
    const innerText = allTiles[i].children[0];
    innerText.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: SHUFFLE_FADE_TIMING,
      easing: "ease-out",
    });
  }
  await sleep(SHUFFLE_FADE_TIMING);
  shuffleButton.disabled = false;
}

function getRandomPermutation(array) {
  const result = [...array]; // Copy array to avoid mutating the original

  for (let i = result.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i - 1
    const j = Math.floor(Math.random() * i);

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

  swapElements(el1, el2);

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
