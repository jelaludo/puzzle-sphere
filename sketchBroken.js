// Global settings
let containerRadius = 300;
let snapInterval = 200; // Trigger a snap every 200ms
let lastSnapTime = 0;
let nextSnapIndex = 0;
let trianglePieces = [];

// Snap speed: fraction added to snap progress per frame (increase to make snapping faster)
let snapSpeed = 0.1; 

// Subdivision detail for the icosphere (more detail → more pieces)
let detail = 2; 

// Base icosahedron vertices and faces
let baseVertices = [];
let baseFaces = [];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(RADIANS);
  
  // ----- Build Base Icosahedron -----
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
  
  // Normalize and scale vertices so they lie on the final sphere.
  for (let v of tempVertices) {
    v.normalize();
    v.mult(containerRadius);
    baseVertices.push(v);
  }
  
  // Define the 20 faces (each is an array of three vertex indices).
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
  
  // ----- Subdivide Each Face to Create a Precise Icosphere -----
  let targetTriangles = [];
  for (let face of baseFaces) {
    let a = baseVertices[face[0]];
    let b = baseVertices[face[1]];
    let c = baseVertices[face[2]];
    let subdivided = subdivideTriangle(a, b, c, detail);
    targetTriangles = targetTriangles.concat(subdivided);
  }
  
  // Create a moving triangle piece for each subdivided triangle.
  for (let tri of targetTriangles) {
    trianglePieces.push(new TrianglePiece(tri));
  }
}

function draw() {
  background(30);
  
  // Apply a slow global rotation for a 3D view.
  rotateY(frameCount * 0.005);
  rotateX(frameCount * 0.003);
  
  // Every snapInterval, trigger one piece to start snapping.
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
// Helper function: Subdivide a triangle recursively.
// Each returned triangle is an array of three p5.Vector points.
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
// Each piece starts small and near the center, moves erratically,
// and then one by one snaps into its target position on the icosphere.
class TrianglePiece {
  constructor(targetVerts) {
    this.targetVerts = targetVerts; // Three vertices of the final triangle.
    
    // Compute the target centroid.
    this.targetCentroid = p5.Vector.add(
      p5.Vector.add(targetVerts[0], targetVerts[1]),
      targetVerts[2]
    ).div(3);
    
    // Estimate size based on the target triangle.
    this.approxRadius = (targetVerts[0].dist(this.targetCentroid) +
                         targetVerts[1].dist(this.targetCentroid) +
                         targetVerts[2].dist(this.targetCentroid)) / 3;
    
    // Spawn free pieces in a small central region.
    let initRegion = containerRadius / 10;
    this.pos = this.randomCentralPosition(initRegion);
    
    // Set a random 3D velocity for erratic motion.
    this.vel = p5.Vector.random3D();
    this.vel.mult(random(0.5, 1.0));
    
    this.angle = random(TWO_PI);
    this.rotationSpeed = random(-0.05, 0.05);
    
    // Snapping state.
    this.snapped = false;
    this.snapping = false;
    this.snapProgress = 0;
    this.initialSnapPosition = null;
    
    // Set a random bright color.
    this.col = color(random(100, 255), random(100, 255), random(100, 255));
  }
  
  // Generate a random position within a sphere of radius 'r' (centered at origin).
  randomCentralPosition(r) {
    let pos;
    do {
      pos = createVector(random(-r, r), random(-r, r), random(-r, r));
    } while (pos.mag() > r);
    return pos;
  }
  
  update() {
    if (this.snapping) {
      // Increase snap progress.
      this.snapProgress += snapSpeed;
      if (this.snapProgress >= 1) {
        this.snapProgress = 1;
        this.snapped = true;
        this.snapping = false;
      }
      // Interpolate position from initial to target centroid.
      this.pos = p5.Vector.lerp(this.initialSnapPosition, this.targetCentroid, this.snapProgress);
    } else if (!this.snapped) {
      // Erratic free movement.
      let jitter = p5.Vector.random3D().mult(0.2);
      this.vel.add(jitter);
      this.vel.limit(2);
      this.pos.add(this.vel);
      this.angle += this.rotationSpeed;
      
      // Bounce off the boundary.
      if (this.pos.mag() + this.approxRadius > containerRadius) {
        let n = this.pos.copy().normalize();
        let dot = this.vel.dot(n);
        let reflection = p5.Vector.mult(n, 2 * dot);
        this.vel.sub(reflection);
        this.pos = n.mult(containerRadius - this.approxRadius);
      }
    }
  }
  
  snap() {
    if (!this.snapped && !this.snapping) {
      this.snapping = true;
      this.snapProgress = 0;
      this.initialSnapPosition = this.pos.copy();
      this.vel.set(0, 0, 0);
    }
  }
  
  draw() {
    if (!this.snapped) {
      // Draw the free (hovering) piece.
      push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        rotateZ(this.angle);
        scale(0.05); // Draw free pieces at 1/20 size.
        noStroke();
        fill(red(this.col), green(this.col), blue(this.col), 180); // 30% transparent.
        let s = this.approxRadius * 2;
        let h = s * sqrt(3) / 2;
        beginShape();
          vertex(0, -2 * h / 3);
          vertex(-s / 2, h / 3);
          vertex(s / 2, h / 3);
        endShape(CLOSE);
      pop();
    } else {
      // Draw the snapped piece using its target vertices.
      // (Drawn in absolute coordinates so no additional translation is needed.)
      noStroke();
      fill(red(this.col), green(this.col), blue(this.col), 180);
      beginShape();
        // Adjust vertices relative to the target centroid.
        for (let v of this.targetVerts) {
          let rel = p5.Vector.sub(v, this.targetCentroid);
          vertex(rel.x, rel.y, rel.z);
        }
      endShape(CLOSE);
    }
  }
}
