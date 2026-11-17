const submitButton = document.getElementById("submitButton");
const deselectButton = document.getElementById("deselectButton");
const allTiles = document.querySelectorAll(".buttonTile");

const selected = [];

function buttonClick(element) {
    if (element.classList.contains("selected")) {
        element.classList.remove("selected");
        const index = selected.findIndex(item => item.innerText === element.innerText);
        if (index !== -1) {
            selected.splice(index, 1);
        }
    } else {
        selected.push(element);
        element.classList.add("selected");
    }
    if (selected.length === 4) {
        // Get all elements that aren't selected and make them non clickable
        const unClickedTiles = document.querySelectorAll('.buttonTile:not(.selected)');
        for (tile of unClickedTiles) {
            tile.disabled = true;
        }  
    } else {
        // Make all tiles clickable again
        invalidTiles = document.querySelectorAll('.buttonTile:disabled');
        for (tile of invalidTiles) {
            tile.disabled = false;
        }
    }
    submitButton.disabled = selected.length !== 4;
    deselectButton.disabled = selected.length === 0;
}

function submit() {
    console.log("SUBMIT");
}

function deselectAll() {
    selected.forEach(tile => {
        tile.classList.remove("selected");
    })
    selected.length = 0;
    submitButton.disabled = true;
    deselectButton.disabled = true;
    enableAll();
}

function enableAll() {
    allTiles.forEach(tile => tile.disabled = false);
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
    const temp = document.createElement('div');
    // Put the placeholder where el1 is
    el1.replaceWith(temp);
    // Move el1 to where el2 is
    el2.replaceWith(el1);
    // Move el2 to the placeholder's spot
    temp.replaceWith(el2);
}