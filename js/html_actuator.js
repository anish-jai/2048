// What each tile value looks like, from smallest to biggest
var FOOD_CHAIN = [
  { value: 2,    name: "Crumb",            icon: "crumb" },
  { value: 4,    name: "Cookie",           icon: "cookie" },
  { value: 8,    name: "Donut",            icon: "doughnut" },
  { value: 16,   name: "Cupcake",          icon: "cupcake" },
  { value: 32,   name: "Cake",             icon: "cake" },
  { value: 64,   name: "Bakery",           icon: "bakery" },
  { value: 128,  name: "Food Truck",       icon: "truck" },
  { value: 256,  name: "Food Chain",       icon: "chain" },
  { value: 512,  name: "Food City",        icon: "city" },
  { value: 1024, name: "Food Planet",      icon: "planet" },
  { value: 2048, name: "World Domination", icon: "crown" }
];

// Tiles past 2048 all share this look
var FOOD_CHAIN_SUPER = { name: "Galactic Snacks", icon: "ufo" };

function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");

  this.score = 0;

  this.renderLegend();
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  this.fillTile(inner, tile.value);

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.foodFor = function (value) {
  var food = FOOD_CHAIN_SUPER;

  FOOD_CHAIN.forEach(function (step) {
    if (step.value === value) food = step;
  });

  return food;
};

HTMLActuator.prototype.createIcon = function (food) {
  var icon = document.createElement("img");
  icon.src = "style/icons/" + food.icon + ".png";
  icon.alt = "";
  return icon;
};

HTMLActuator.prototype.fillTile = function (inner, value) {
  var food  = this.foodFor(value);
  var icon  = this.createIcon(food);
  var label = document.createElement("span");

  icon.classList.add("tile-icon");
  label.classList.add("tile-label");
  label.textContent = food.name;

  inner.appendChild(icon);
  inner.appendChild(label);
};

// Show the whole chain under the board. This also loads every icon up front,
// so that a new tile never appears without its picture.
HTMLActuator.prototype.renderLegend = function () {
  var self   = this;
  var legend = document.querySelector(".food-chain-legend");

  FOOD_CHAIN.forEach(function (food) {
    var step = document.createElement("div");
    step.classList.add("food-chain-step");
    step.appendChild(self.createIcon(food));
    step.appendChild(document.createTextNode(food.name));
    legend.appendChild(step);
  });
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "World domination!" : "Out of snacks!";

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};
