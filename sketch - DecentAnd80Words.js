// Global settings for the icosphere animation
let containerRadius = 300;
let snapInterval = 200; // Trigger one snap every 200ms
let lastSnapTime = 0;
let nextSnapIndex = 0;
let trianglePieces = [];
let snapSpeed = 0.1;   // Controls how quickly a piece snaps
let detail = 1;        // Subdivision detail: 1 yields 80 pieces (20 faces × 4 pieces)
let baseVertices = [];
let baseFaces = [];

// Word lists (your list of 215 words)
let wordList = [
  "Armbar",
  "RNC",
  "Kimura",
  "Hip Escape",
  "Shrimp",
  "Breakfall",
  "Frame",
  "Problem awareness",
  "Timing & Triggers",
  "Precision",
  "Bail out",
  "Chaining Threats",
  "Hiding Intent",
  "Varying Intensity",
  "Fluid Momentum",
  "Identify Wedges",
  "carotid fit",
  "entanglements",
  "Hand-Feet coordination",
  "breathing",
  "Finding angles",
  "Calm under pressure",
  "deliberate practice",
  "predictable reactions",
  "learn & adapt",
  "Strategy, gameplan",
  "breaking their will",
  "dictating tempo",
  "offensive defense",
  "endgame - no fear",
  "Side Control",
  "Back Mount",
  "Mount",
  "Kimura Control",
  "Trap Triangle",
  "Neon Belly",
  "North-South",
  "Scarf Hold / Kesa",
  "Reverse Scarf Hold",
  "Crucifix",
  "Headlocks",
  "Turtle Control",
  "Gift-Wrap",
  "cross-body ride/hook",
  "Lockdown",
  "outside scorpion",
  "411_Cross Ashi",
  "Kiss of the dragon",
  "Crab Ride",
  "Top Lock",
  "Hand Stickiness",
  "Leg Stickiness",
  "Live Toes/Hooks",
  "Eliminate/Create Slack",
  "Posture / alignment",
  "Pressure (apply, accept, release)",
  "Loading their weight",
  "Loading your weight",
  "Overlapping pressures",
  "Disconnecting",
  "Head usage (drive/post/lead)",
  "Grips (types,  sequences)",
  "胸細分化セパレーション",
  "Hips engagement (one, both, switch)",
  "Form Tension - 掤",
  "GUILLOTINES",
  "TRIANGLE STRANGLES",
  "Side triangle",
  "Bow & Arrow",
  "Ezekiel",
  "no-gi Ezekiel",
  "Gift Wrap Chokes",
  "Ninja",
  "Brabo",
  "D'arce",
  "Anaconda",
  "Russian tie system",
  "headlock",
  "Sotomusou",
  "Falcon Grip",
  "knee-bar dive",
  "Side Control",
  "Back Mount",
  "Mount",
  "Kimura Control",
  "Trap Triangle",
  "Neon Belly",
  "North-South",
  "Scarf Hold / Kesa",
  "Reverse Scarf Hold",
  "Crucifix",
  "Headlocks",
  "Turtle Control",
  "Gift-Wrap",
  "cross-body ride/hook",
  "Lockdown",
  "outside scorpion",
  "411_Cross Ashi",
  "Kiss of the dragon",
  "Crab Ride",
  "Top Lock",
  "reverse armlock",
  "Americana",
  "Omoplata",
  "Gogoplata",
  "Katagatame",
  "Baratoplata from guard",
  "Baratoplata from mount",
  "Wristlocks",
  "Back Crucifix Arm Lock",
  "Biceps Slicer",
  "Double Legs",
  "Singe Leg",
  "Ankle Pick",
  "Duck under",
  "Hip Throw",
  "Inside trip",
  "High Crotch",
  "Lateral Drop",
  "Switch (Wrestling)",
  "Bodylock",
  "Osotogari",
  "Fireman's Carry",
  "Shoulder Throw",
  "Kani basami*",
  "knee-tap",
  "Outside Trip",
  "Posts removal/recovery",
  "Stapling",
  "stiff arm",
  "Falling weight",
  "kaina wo kaesu",
  "switch base",
  "Wet Dog / Vibrate",
  "one-limb-two-points",
  "Kipping",
  "disrupt their head",
  "Armpit grip",
  "hand interception",
  "end of levers control",
  "Pendulum",
  "伸張・回転・圧縮　ERC",
  "Small muscles to hold...",
  "one-limb-two-points",
  "elbow under frame",
  "Unweighted legs",
  "Level changes",
  "Isolate Limbs",
  "hip block",
  "Hip heist",
  "Shrimps (Rising, Elegant, etc.)",
  "Backstep",
  "Inversions / Granby",
  "knee-elbow connection",
  "elbow-hip  connection",
  "bridges",
  "arm-under roll",
  "inside/outside  shoulder escapes",
  "technical stand-up",
  "windshield wiper",
  "blading",
  "Achiles ankle lock",
  "Kneebar",
  "Toe Hold",
  "Outside Sankaku",
  "Saddle entries",
  "Calf slicer",
  "Heel hook*",
  "Twister",
  "scissor",
  "butterfly",
  "pendulum/flower",
  "KoB sweep",
  "Lockdown",
  "hip-bump",
  "base-collar-drag",
  "butterfly snap-down",
  "Elevator Sweep",
  "Tomoenage",
  "Udegatame Sweep",
  "Taniotoshi",
  "Osoto, kosoto",
  "Ouchi, kouchi",
  "sasaetsurikomi",
  "Ogoshi",
  "Tomoenage",
  "open",
  "closed",
  "Clamp Guard",
  "Side Scissors",
  "Top Lock",
  "half-guard",
  "50/50",
  "Butterfly",
  "Williams",
  "Spider",
  "Sit-up",
  "Lapel Guards",
  "DLR",
  "Lasso",
  "X-Guard",
  "Vice Guard",
  "Tomoe",
  "half-guard top",
  "Over-Under",
  "Double Under",
  "Torreando",
  "Keenan grip",
  "Lovato HQ",
  "Gordon Floating",
  "Leg Drag",
  "Kimura Trap",
  "Sambo Achiles",
  "DLR",
  "Lucas Knee Cut"
];

let availableWords = wordList.slice();
let displayWords = []; // Words that have been assigned and will appear in the word cloud

// DOM element for the word cloud.
let wordCloud;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(RADIANS);
  
  // Create a DOM element for the word cloud (positioned in the upper left corner).
  wordCloud = createDiv('');
  wordCloud.position(10, 10);
  wordCloud.style('color', 'white');
  wordCloud.style('font-size', '16px');
  wordCloud.style('width', '300px');
  
  // Build the base icosahedron.
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
  for (let v of tempVertices) {
    v.normalize();
    v.mult(containerRadius);
    baseVertices.push(v);
  }
  
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
  
  // Subdivide each face (detail = 1 gives 4 pieces per face; 20 faces × 4 = 80 pieces).
  let targetTriangles = [];
  for (let face of baseFaces) {
    let a = baseVertices[face[0]];
    let b = baseVertices[face[1]];
    let c = baseVertices[face[2]];
    let subdivided = subdivideTriangle(a, b, c, detail);
    targetTriangles = targetTriangles.concat(subdivided);
  }
  
  // Create a triangle piece for each target triangle.
  for (let tri of targetTriangles) {
    trianglePieces.push(new TrianglePiece(tri));
  }
  
  // Randomize the order in which pieces will snap.
  trianglePieces = shuffle(trianglePieces);
}

function draw() {
  background(30);
  
  // Apply a slow global rotation for a dynamic 3D view.
  rotateY(frameCount * 0.005);
  rotateX(frameCount * 0.003);
  
  // Every snapInterval milliseconds, trigger one piece to snap.
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
  
  // Update the word cloud display.
  updateWordCloud();
}

// Recursively subdivide a triangle.
function subdivideTriangle(v1, v2, v3, detail) {
  if (detail <= 0) {
    return [[v1.copy(), v2.copy(), v3.copy()]];
  }
  let m1 = p5.Vector.add(v1, v2).mult(0.5);
  let m2 = p5.Vector.add(v2, v3).mult(0.5);
  let m3 = p5.Vector.add(v3, v1).mult(0.5);
  m1.normalize().mult(containerRadius);
  m2.normalize().mult(containerRadius);
  m3.normalize().mult(containerRadius);
  let t1 = subdivideTriangle(v1, m1, m3, detail - 1);
  let t2 = subdivideTriangle(m1, v2, m2, detail - 1);
  let t3 = subdivideTriangle(m3, m2, v3, detail - 1);
  let t4 = subdivideTriangle(m1, m2, m3, detail - 1);
  return t1.concat(t2, t3, t4);
}

// TrianglePiece class: each piece hovers near the center then snaps to its target.
class TrianglePiece {
  constructor(targetVerts) {
    this.targetVerts = targetVerts;
    this.targetCentroid = p5.Vector.add(
      p5.Vector.add(targetVerts[0], targetVerts[1]),
      targetVerts[2]
    ).div(3);
    this.approxRadius = (
      targetVerts[0].dist(this.targetCentroid) +
      targetVerts[1].dist(this.targetCentroid) +
      targetVerts[2].dist(this.targetCentroid)
    ) / 3;
    this.pos = this.randomCentralPosition(containerRadius / 20);
    this.startPos = this.pos.copy();
    this.scaleVal = 0.05;
    this.hoverPhase = random(TWO_PI);
    this.hoverAmp = random(10, 20);
    this.hoverFreq = 0.05;
    this.snapped = false;
    this.snapping = false;
    this.snapProgress = 0;
    this.initialSnapPosition = null;
    this.assignedWord = null;
    this.col = color(random(100, 255), random(100, 255), random(100, 255), 180);
    this.angle = random(TWO_PI);
    this.rotationSpeed = random(-0.05, 0.05);
  }
  
  randomCentralPosition(r) {
    let pos;
    do {
      pos = createVector(random(-r, r), random(-r, r), random(-r, r));
    } while (pos.mag() > r);
    return pos;
  }
  
  snap() {
    if (!this.snapped && !this.snapping) {
      this.snapping = true;
      this.snapProgress = 0;
      this.initialSnapPosition = this.pos.copy();
    }
  }
  
  update() {
    if (this.snapping) {
      this.snapProgress += snapSpeed;
      if (this.snapProgress >= 1) {
        this.snapProgress = 1;
        this.snapped = true;
        this.snapping = false;
        this.pos = this.targetCentroid.copy();
        this.scaleVal = 1;
        if (this.assignedWord === null && availableWords.length > 0) {
          let index = floor(random(availableWords.length));
          this.assignedWord = availableWords.splice(index, 1)[0];
          displayWords.push(this.assignedWord);
        }
      } else {
        this.pos = p5.Vector.lerp(this.initialSnapPosition, this.targetCentroid, this.snapProgress);
        this.scaleVal = lerp(0.05, 1, this.snapProgress);
      }
    } else if (!this.snapped) {
      let offset = createVector(
        sin(frameCount * this.hoverFreq + this.hoverPhase),
        cos(frameCount * this.hoverFreq + this.hoverPhase),
        sin(frameCount * this.hoverFreq + this.hoverPhase / 2)
      );
      offset.mult(this.hoverAmp);
      this.pos = p5.Vector.add(this.startPos, offset);
      this.angle += this.rotationSpeed;
    }
  }
  
  draw() {
    if (this.snapped) {
      push();
        translate(this.targetCentroid.x, this.targetCentroid.y, this.targetCentroid.z);
        scale(1);
        noStroke();
        fill(this.col);
        beginShape();
          for (let v of this.targetVerts) {
            let rel = p5.Vector.sub(v, this.targetCentroid);
            vertex(rel.x, rel.y, rel.z);
          }
        endShape(CLOSE);
      pop();
    } else {
      push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        rotateZ(this.angle);
        scale(this.scaleVal);
        noStroke();
        fill(this.col);
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

// Update the word cloud in the DOM.
function updateWordCloud() {
  let html = "";
  for (let i = 0; i < displayWords.length; i++) {
    // Highlight the most recently added word.
    if (i === displayWords.length - 1) {
      html += '<span style="color: yellow; font-weight: bold; margin-right: 5px;">' + displayWords[i] + '</span>';
    } else {
      html += '<span style="margin-right: 5px;">' + displayWords[i] + '</span>';
    }
  }
  wordCloud.html(html);
}
