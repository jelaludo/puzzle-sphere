// Global settings
let containerRadius = 300;
let snapInterval = 2000; // time between snapping pieces (in milliseconds)
let lastSnapTime = 0;
let nextSnapIndex = 0;
let trianglePieces = [];

// Icosahedron geometry (20 faces)
let icosaVertices = [];
let icosaFaces = [];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(RADIANS);

  // ---- Compute Icosahedron Vertices ----
  // An icosahedron has 12 vertices given by:
  // (0, ±1, ±φ), (±1, ±φ, 0), (±φ, 0, ±1)
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
  
  // Normalize each vertex and scale to containerRadius
  for (let v of tempVertices) {
    v.normalize();
    v.mult(containerRadius);
    icosaVertices.push(v);
  }
  
  // ---- Define the 20 Faces using vertex indices ----
  // (These indices correspond to the vertices above.)
  icosaFaces = [
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
  
  // ---- Create one moving TrianglePiece per face ----
  for (let face of icosaFaces) {
    // For each face, get the target vertices (make copies so we can animate separately)
    let targetVerts = [
      icosaVertices[face[0]].copy(),
      icosaVertices[face[1]].copy(),
      icosaVertices[face[2]].copy()
    ];
    trianglePieces.push(new TrianglePiece(targetVerts));
  }
}

function draw() {
  background(30);
  
  // Apply a slow global rotation for an appealing view
  rotateY(frameCount * 0.005);
  rotateX(frameCount * 0.003);
  
  // Draw the container sphere as a faint wireframe
  noFill();
  stroke(255, 50);
  sphere(containerRadius);
  
  // Periodically, snap one moving triangle into place.
  if (millis() - lastSnapTime > snapInterval && nextSnapIndex < trianglePieces.length) {
    trianglePieces[nextSnapIndex].snap();
    nextSnapIndex++;
    lastSnapTime = millis();
  }
  
  // Update and draw every triangle piece.
  for (let tp of trianglePieces) {
    tp.update();
    tp.draw();
  }
}

// ===================================================
// TrianglePiece class
// Each instance represents a triangle that is moving inside the sphere
// until it “snaps” to its target (its final icosahedron face).
// ===================================================
class TrianglePiece {
  constructor(targetVerts) {
    this.targetVerts = targetVerts; // target vertices for the final face
    
    // Compute the target centroid (average of the three vertices)
    this.targetCentroid = p5.Vector.add(
      p5.Vector.add(targetVerts[0], targetVerts[1]),
      targetVerts[2]
    ).div(3);
    
    // Determine side length using the distance between the first two target vertices
    this.sideLength = targetVerts[0].dist(targetVerts[1]);
    // For an equilateral triangle, the circumradius (distance from centroid to a vertex) is:
    this.circumRadius = this.sideLength * sqrt(3) / 3;
    
    // Start at a random position inside the container sphere (with a safety margin)
    this.pos = this.randomPosition();
    // Give it a random 3D velocity
    this.vel = p5.Vector.random3D();
    this.vel.mult(random(5, 9));
    
    // For a simple rotation effect while moving
    this.angle = random(TWO_PI);
    this.rotationSpeed = random(-0.05, 0.05);
    
    // Not snapped yet; once snapped, the triangle will stop moving.
    this.snapped = false;
    
    // Assign a random bright color.
    this.col = color(random(100, 255), random(100, 255), random(100, 255));
    
    // Maintain a trail of recent positions (for a fading effect)
    this.trail = [];
  }
  
  // Generate a random position within the sphere,
  // ensuring the entire triangle stays inside.
  randomPosition() {
    let r = containerRadius - this.circumRadius;
    let pos;
    do {
      pos = createVector(random(-r, r), random(-r, r), random(-r, r));
    } while (pos.mag() > r);
    return pos;
  }
  
  update() {
    if (!this.snapped) {
      // Update position and rotation if still moving.
      this.pos.add(this.vel);
      this.angle += this.rotationSpeed;
      
      // Bounce off the container boundary.
      if (this.pos.mag() + this.circumRadius > containerRadius) {
        let n = this.pos.copy().normalize();
        let dot = this.vel.dot(n);
        let reflection = p5.Vector.mult(n, 2 * dot);
        this.vel.sub(reflection);
        // Reposition just inside the boundary.
        this.pos = n.mult(containerRadius - this.circumRadius);
      }
      
      // Record the position for the trail.
      this.trail.push(this.pos.copy());
      if (this.trail.length > 30) {
        this.trail.shift();
      }
    }
  }
  
  // Snap the triangle into its final position on the icosahedron.
  snap() {
    this.snapped = true;
    this.pos = this.targetCentroid.copy();
    this.vel.set(0, 0, 0);
  }
  
  draw() {
    if (!this.snapped) {
      // Draw the trail for moving triangles.
      noFill();
      stroke(red(this.col), green(this.col), blue(this.col), 150);
      beginShape();
      for (let v of this.trail) {
        vertex(v.x, v.y, v.z);
      }
      endShape();
      
      // Draw the moving triangle.
      push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        // Rotate around Z for a simple spinning effect.
        rotateZ(this.angle);
        fill(this.col);
        stroke(0);
        // Draw an equilateral triangle centered at the origin.
        // For an equilateral triangle of side L, the height is: h = L * sqrt(3) / 2.
        let L = this.sideLength;
        let h = L * sqrt(3) / 2;
        // Vertices arranged so that the centroid is at (0,0):
        // (0, -2h/3), (-L/2, h/3), (L/2, h/3)
        beginShape();
          vertex(0, -2 * h / 3);
          vertex(-L/2, h/3);
          vertex(L/2, h/3);
        endShape(CLOSE);
      pop();
    } else {
      // Draw the snapped triangle directly using the target vertices.
      noStroke();
      fill(this.col);
      beginShape();
        for (let v of this.targetVerts) {
          vertex(v.x, v.y, v.z);
        }
      endShape(CLOSE);
    }
  }
}
