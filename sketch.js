// Global variables
let pieces = [];
const numPieces = 100;
const containerRadius = 300; // radius of the container sphere
const snapInterval = 2000; // milliseconds between snapping pieces
let lastSnapTime = 0;
let nextSnapIndex = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  // Create all puzzle pieces
  for (let i = 0; i < numPieces; i++) {
    pieces.push(new PuzzlePiece());
  }
}

function draw() {
  background(20);
  // Apply a slow global rotation so the container sphere rotates
  rotateY(frameCount * 0.01);
  rotateX(frameCount * 0.005);

  // Draw the container sphere (a translucent shell)
  noFill();
  stroke(255, 50);
  sphere(containerRadius);

  // Update and draw each puzzle piece
  for (let piece of pieces) {
    piece.update();
    piece.draw();
  }

  // Every snapInterval milliseconds, snap one unsnapped piece to the sphere's inner surface.
  if (millis() - lastSnapTime > snapInterval && nextSnapIndex < pieces.length) {
    pieces[nextSnapIndex].snap();
    nextSnapIndex++;
    lastSnapTime = millis();
  }
}

// --- PuzzlePiece class ---
class PuzzlePiece {
  constructor() {
    // Each piece is roughly square; choose a size between 30 and 60
    this.size = random(30, 60);
    // For collision, approximate the piece as a circle that circumscribes the square.
    this.radius = this.size * sqrt(2) / 2;

    // Place the piece at a random position inside the sphere (with enough margin)
    this.pos = this.randomPosition();
    // Give it a random velocity (random direction and speed between 1 and 3)
    this.vel = p5.Vector.random3D();
    this.vel.mult(random(1, 3));

    // Each piece also rotates as it moves
    this.rotation = createVector(random(TWO_PI), random(TWO_PI), random(TWO_PI));
    this.rotationSpeed = createVector(random(-0.01, 0.01), random(-0.01, 0.01), random(-0.01, 0.01));

    // Assign a bright random color
    this.color = color(random(100, 255), random(100, 255), random(100, 255));

    // For a jigsaw-like appearance, assign a "tab" configuration to each edge.
    // A value of 1 means a protruding tab; -1 means an inward notch.
    this.tabs = {
      top: random([1, -1]),
      right: random([1, -1]),
      bottom: random([1, -1]),
      left: random([1, -1])
    };

    // Store recent positions for the trail effect.
    this.trail = [];
    this.snapped = false; // when true, the piece no longer moves
  }

  // Generate a random position inside a sphere of radius (containerRadius - this.radius)
  randomPosition() {
    let r = containerRadius - this.radius;
    let pos;
    do {
      pos = createVector(random(-r, r), random(-r, r), random(-r, r));
    } while (pos.mag() > r);
    return pos;
  }

  update() {
    if (!this.snapped) {
      // Move and update rotation
      this.pos.add(this.vel);
      this.rotation.add(this.rotationSpeed);

      // Check for collision with the spherical boundary.
      if (this.pos.mag() + this.radius > containerRadius) {
        // Compute the normal (from center to the piece)
        let n = this.pos.copy().normalize();
        // Reflect the velocity: v = v - 2*(v·n)*n
        let dot = this.vel.dot(n);
        let reflection = p5.Vector.mult(n, 2 * dot);
        this.vel.sub(reflection);
        // Reposition the piece so it lies just inside the sphere.
        this.pos = n.mult(containerRadius - this.radius);
      }

      // Save current position for the fading trail.
      this.trail.push(this.pos.copy());
      if (this.trail.length > 50) {
        this.trail.shift();
      }
    }
  }

  // Snap the piece to the inner surface by projecting its position outward.
  snap() {
    let n = this.pos.copy().normalize();
    this.pos = n.mult(containerRadius - this.radius);
    this.vel.set(0, 0, 0);
    this.snapped = true;
  }

  draw() {
    // Draw the fading trail.
    noFill();
    // Draw individual line segments with alpha increasing along the trail.
    for (let i = 0; i < this.trail.length - 1; i++) {
      let alphaVal = map(i, 0, this.trail.length - 1, 50, 255);
      stroke(red(this.color), green(this.color), blue(this.color), alphaVal);
      line(this.trail[i].x, this.trail[i].y, this.trail[i].z,
           this.trail[i + 1].x, this.trail[i + 1].y, this.trail[i + 1].z);
    }

    // Draw the puzzle piece at its current position.
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    // Apply the piece’s rotation.
    rotateX(this.rotation.x);
    rotateY(this.rotation.y);
    rotateZ(this.rotation.z);
    fill(this.color);
    stroke(0);
    // Draw the custom puzzle piece shape (centered at 0,0)
    drawPuzzleShape(this.size, this.tabs);
    pop();
  }
}

// --- Function to draw a puzzle piece shape ---
// The shape is defined with its center at (0,0) and corners at ±size/2.
// Each edge uses a quadratic curve to form a tab (or notch) based on the provided configuration.
function drawPuzzleShape(s, tabs) {
  beginShape();
  // Start at top-left corner
  vertex(-s / 2, -s / 2);
  // Top edge: from left to right with a curve in the middle
  vertex(-s / 6, -s / 2);
  quadraticVertex(0, -s / 2 - tabs.top * (s / 3), s / 6, -s / 2);
  vertex(s / 2, -s / 2);
  // Right edge: from top to bottom
  vertex(s / 2, -s / 6);
  quadraticVertex(s / 2 + tabs.right * (s / 3), 0, s / 2, s / 6);
  vertex(s / 2, s / 2);
  // Bottom edge: from right to left
  vertex(s / 6, s / 2);
  quadraticVertex(0, s / 2 + tabs.bottom * (s / 3), -s / 6, s / 2);
  vertex(-s / 2, s / 2);
  // Left edge: from bottom to top
  vertex(-s / 2, s / 6);
  quadraticVertex(-s / 2 - tabs.left * (s / 3), 0, -s / 2, -s / 6);
  vertex(-s / 2, -s / 2);
  endShape(CLOSE);
}
