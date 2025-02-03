// Global settings
let containerRadius = 300;
let snapInterval = 200; // Trigger one snap every 200ms
let lastSnapTime = 0;
let nextSnapIndex = 0;
let trianglePieces = [];

// Controls how quickly a piece snaps (increase to snap faster)
let snapSpeed = 0.1; 

// Set subdivision detail to 1 (fewer pieces)
let detail = 1;

// Storage for the base icosahedron vertices and faces
let baseVertices = [];
let baseFaces = [];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(RADIANS);
  
  // ----- Build the Base Icosahedron -----
  let phi = (1 + sqrt(5)) / 2;
  let tempVertices = [
    createVector(-1,  phi, 0),
    createVector( 1,  phi, 0),
    createVector(-1, -phi, 0),
    createVector( 1, -phi, 0),
    createVector(0, -1,  phi),
    createVector(0,  1,  phi),
    createVector(0, -1, -phi),
    createVector(0,  1, -phi),
    createVector( phi, 0, -1),
    createVector( phi, 0,  1),
    createVector(-phi, 0, -1),
    createVector(-phi, 0,  1)
  ];
  
  // Normalize and scale vertices so they lie on the sphere
  for (let v of tempVertices) {
    v.normalize();
    v.mult(containerRadius);
    baseVertices.push(v);
  }
  
  // Define the 20 faces (each face is an array of three vertex indices)
  baseFaces = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1]
  ];
  
  // ----- Subdivide Each Face to Create the Refined Icosphere -----
  let targetTriangles = [];
  for (let face of baseFaces) {
    let a = baseVertices[face[0]];
    let b = baseVertices[face[1]];
    let c = baseVertices[face[2]];
    let subdivided = subdivideTriangle(a, b, c, detail);
    targetTriangles = targetTriangles.concat(subdivided);
  }
  
  // Create a triangle piece for each subdivided target triangle.
  for (let tri of targetTriangles) {
    trianglePieces.push(new TrianglePiece(tri));
  }
  
  // Randomize the order in which pieces snap.
  trianglePieces = shuffle(trianglePieces);
}

function draw() {
  background(30);
  
  // Apply a slow global rotation for a dynamic 3D view.
  rotateY(frameCount * 0.005);
  rotateX(frameCount * 0.003);
  
  // Every snapInterval, trigger one piece to snap.
  if (millis() - lastSnapTime > snapInterval && nextSnapIndex < trianglePieces.length) {
    trianglePieces[nextSnapIndex].snap();
    nextSnapIndex++;
    lastSnapTime = millis();
  }
  
  // Update and draw all pieces.
  for (let piece of trianglePieces) {
    piece.update();
    piece.draw();
  }
}

// ---------------------------------------------------
// Helper: Recursively subdivide a triangle.
// Returns an array of triangles (each a 3-element array of p5.Vector).
function subdivideTriangle(v1, v2, v3, detail) {
  if (detail <= 0) {
    return [[v1.copy(), v2.copy(), v3.copy()]];
  }
  
  // Compute midpoints.
  let m1 = p5.Vector.add(v1, v2).mult(0.5);
  let m2 = p5.Vector.add(v2, v3).mult(0.5);
  let m3 = p5.Vector.add(v3, v1).mult(0.5);
  
  // Project midpoints onto the sphere.
  m1.normalize().mult(containerRadius);
  m2.normalize().mult(containerRadius);
  m3.normalize().mult(containerRadius);
  
  // Recursively subdivide the 4 new triangles.
  let t1 = subdivideTriangle(v1, m1, m3, detail - 1);
  let t2 = subdivideTriangle(m1, v2, m2, detail - 1);
  let t3 = subdivideTriangle(m3, m2, v3, detail - 1);
  let t4 = subdivideTriangle(m1, m2, m3, detail - 1);
  
  return t1.concat(t2, t3, t4);
}

// ---------------------------------------------------
// TrianglePiece Class
// Each piece starts as a tiny triangle near the center, hovering with a gentle oscillation,
// and then one by one it snaps (flies outward) to its target position on the sphere.
class TrianglePiece {
  constructor(targetVerts) {
    this.targetVerts = targetVerts; // Array of three p5.Vectors (the final triangle's vertices)
    
    // Compute the target centroid (final position).
    this.targetCentroid = p5.Vector.add(
      p5.Vector.add(targetVerts[0], targetVerts[1]),
      targetVerts[2]
    ).div(3);
    
    // Estimate a size based on the target triangle.
    this.approxRadius = (
      targetVerts[0].dist(this.targetCentroid) +
      targetVerts[1].dist(this.targetCentroid) +
      targetVerts[2].dist(this.targetCentroid)
    ) / 3;
    
    // Initially, spawn the piece in a very small central region.
    this.pos = this.randomCentralPosition(containerRadius / 20);
    // Save the initial position for hovering calculations.
    this.startPos = this.pos.copy();
    
    // Set the initial drawn scale (very small).
    this.scaleVal = 0.05;
    
    // Free (hovering) pieces will oscillate slightly.
    this.hoverPhase = random(TWO_PI);
    this.hoverAmp = random(2, 5);  // small amplitude in pixels
    this.hoverFreq = 0.05;         // frequency for the oscillation
    
    // Snapping state.
    this.snapped = false;   // Has finished snapping.
    this.snapping = false;  // Currently in the process of snapping.
    this.snapProgress = 0;  // Interpolation progress (0 to 1).
    this.initialSnapPosition = null;
    
    // Random bright color with some transparency.
    this.col = color(random(100, 255), random(100, 255), random(100, 255), 180);
    
    // For rotation of the free piece.
    this.angle = random(TWO_PI);
    this.rotationSpeed = random(-0.05, 0.05);
  }
  
  // Returns a random position within a sphere of radius r (centered at the origin).
  randomCentralPosition(r) {
    let pos;
    do {
      pos = createVector(random(-r, r), random(-r, r), random(-r, r));
    } while (pos.mag() > r);
    return pos;
  }
  
  // Begin the snapping process.
  snap() {
    if (!this.snapped && !this.snapping) {
      this.snapping = true;
      this.snapProgress = 0;
      this.initialSnapPosition = this.pos.copy();
    }
  }
  
  update() {
    if (this.snapping) {
      // Increase snap progress.
      this.snapProgress += snapSpeed;
      if (this.snapProgress >= 1) {
        this.snapProgress = 1;
        this.snapped = true;
        this.snapping = false;
        // Ensure final position and scale.
        this.pos = this.targetCentroid.copy();
        this.scaleVal = 1;
      } else {
        // Interpolate position from the initial central location to the target centroid.
        this.pos = p5.Vector.lerp(this.initialSnapPosition, this.targetCentroid, this.snapProgress);
        // Interpolate scale from 0.05 to full size.
        this.scaleVal = lerp(0.05, 1, this.snapProgress);
      }
    } else if (!this.snapped) {
      // In free mode, update the hovering position.
      // Compute a small oscillation offset.
      let offset = createVector(
        sin(frameCount * this.hoverFreq + this.hoverPhase),
        cos(frameCount * this.hoverFreq + this.hoverPhase),
        sin(frameCount * this.hoverFreq + this.hoverPhase / 2)
      );
      offset.mult(this.hoverAmp);
      // Set current position as the original start position plus the oscillation.
      this.pos = p5.Vector.add(this.startPos, offset);
      // Also update the rotation angle.
      this.angle += this.rotationSpeed;
    }
    // Once snapped, no update is needed.
  }
  
  draw() {
    if (this.snapped) {
      // Draw the full-size piece at its final target position.
      push();
        translate(this.targetCentroid.x, this.targetCentroid.y, this.targetCentroid.z);
        scale(1);
        noStroke();
        fill(this.col);
        beginShape();
          // Draw the triangle using vertices relative to the target centroid.
          for (let v of this.targetVerts) {
            let rel = p5.Vector.sub(v, this.targetCentroid);
            vertex(rel.x, rel.y, rel.z);
          }
        endShape(CLOSE);
      pop();
    } else {
      // Draw the free (hovering or snapping) piece at its current position and scale.
      push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        rotateZ(this.angle);
        scale(this.scaleVal);
        noStroke();
        fill(this.col);
        // Draw a generic equilateral triangle.
        let s = this.approxRadius * 2;
        let h = s * sqrt(3) / 2;
        beginShape();
          vertex(0, -2 * h / 3);
          vertex(-s / 2, h / 3);
          vertex(s / 2, h / 3);
        endShape(CLOSE);
      pop();
    }
  }
}
