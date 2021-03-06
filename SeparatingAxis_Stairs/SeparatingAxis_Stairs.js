let polygonColliders = [];
let player = [
    {x : 64, y : 64},
    {x : 64, y : 128},
    {x : 128, y :128}, 
    {x : 128, y : 64}
  ];

function setup() {
  createCanvas(512, 512);
  /*
  polygonColliders.push([
    {x : 15, y : 32},
    {x : 15, y : 120},
    {x : 30, y : 140},
    {x : 64, y : 128},
    {x : 94, y : 32}
    
  ]);*/
  
  polygonColliders.push([
    {x : 16, y : 128}, //Bottom left
    {x : 16, y : 64}, //Top left
    {x : 256, y : 128}
  ]);
  
  //cache the bounds!
  
  polygonColliders.push([
    {x : 256, y : 128}, //Bottom left
    {x : 512, y : 128}, //Top left
    {x : 512, y : 64}
  ]);
  
  
  moveObject(polygonColliders[0], 40, 60);
  moveObject(polygonColliders[1], 40, 140);
  //moveObject(polygonColliders[2], 40, 60);
  //run();
}

function checkKeys() {
  let offsetx = 0;
  let offsety = 0;
  if (keyIsDown(LEFT_ARROW)) {
    offsetx = -2;
  } 
  if (keyIsDown(RIGHT_ARROW)) {
    offsetx = 2;
  } 
  if (keyIsDown(UP_ARROW)) {
    offsety = -2;
  } 
  if (keyIsDown(DOWN_ARROW)) {
    offsety = 2;
  }
  moveObject(player, offsetx, offsety);
}

function moveObject(obj, xo, yo){
  obj.map(function(x){
    x.x += xo;
    x.y += yo;
  });
}

function draw() {
  checkKeys();
  background(255);
  noFill(); //Gets override if they two collide.
  
  //Time to determine the collisions
  //Project each points on to the axis, and check...
  //In reality, we would probably do things differently - probably only check player against the walls. 
  //In other words...? 
  //Anyways, this would work for any shape. For now we are just checking the two.
  let isColliding = false;
  let pushawayDistance = Number.MAX_VALUE;
  let pushawayAxis;
  for(let i = 0; i < polygonColliders.length; i++){
    let mapObj = polygonColliders[i];
    let collisionInfo = checkandresolveCollision(mapObj, player);
    isColliding = isColliding || collisionInfo.isColliding; //Change the collision to yes, if any of the polygons collide with teh player.
    
    if(Math.abs(collisionInfo.pushawayDistance) <= Math.abs(pushawayDistance)){
      pushawayDistance = collisionInfo.pushawayDistance;
      pushawayAxis = collisionInfo.pushawayAxis;
    }
    //pushawayDistance = collisionInfo.pushawayDistance;
    //pushawayAxis = collisionInfo.pushawayAxis;
  }
  
  if(isColliding){
    
    console.log(pushawayDistance);
    
    fill(128, 0, 0);
    //moveObject(polygonColliders[1], pdX, pdY);
    
    //Now, push away the objects!
    let distance = Math.sign(pushawayDistance) * Math.sqrt(Math.abs(pushawayDistance));
    if(pushawayAxis === "x"){
      moveObject(player, distance, 0);
    }
    else if(pushawayAxis === "y"){
      moveObject(player, 0, distance);
    }
    else{
      //Based on the slope, we can calculate out the x-y ratio.
      //x = 1, y = slope.
      //Then we need to normalize this value.
      let slopelen = sqrt(1 + pushawayAxis * pushawayAxis);
      let xratio = 1 / slopelen;
      let yratio = pushawayAxis / slopelen;
      
      moveObject(player, distance * xratio, distance * yratio);
      
    }
    //let xpushaway = pushawayAxis*/
  }
  
  for(let i = 0; i < polygonColliders.length; i++){
    let polygon = polygonColliders[i];
    strokeWeight(1);
    stroke(0);
    beginShape();
    for(let j = 0; j < polygon.length; j++){
      let v = polygon[j];
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
  }
  //Stroke the player as well!
  stroke(0);
  beginShape();
  for(let j = 0; j < player.length; j++){
    let v = player[j];
    vertex(v.x, v.y);
  }
  endShape(CLOSE);
}

function checkandresolveCollision(){
  let polygons = arguments;
  let poly1 = polygons[0];
  let poly2 = polygons[1];
  
  let checkedAxis = getAxisToCheck(poly1, poly2); //Keep a list axis that we need to compare here.
  let isColliding = true; //Assumes that they are colliding. If we found out that they are not, then change isColliding.
  
  let mpdX = Number.MAX_VALUE;
  let mpdY = Number.MAX_VALUE;
  let pushawayDistance = Number.MAX_VALUE;
  let pushawayAxis;
  for(let i = 0; i < checkedAxis.length; i++){
    //For each shape, keep track of its maximum and minimum.
    let projected = [];
    for(let j = 0; j < arguments.length; j++){
      let polygon = arguments[j];
      let minPos = Number.MAX_VALUE;
      let maxPos = -Number.MAX_VALUE;
      for(let k = 0; k < polygon.length; k++){
        let point = polygon[k];
        let pCoord = projectPoint(point, checkedAxis[i]); //Project each vertex on to the equation.
        //Calculate the maximum and minimum.
        if(pCoord < minPos){
          minPos = pCoord;
        }
        if(pCoord > maxPos){
          maxPos = pCoord;
        }
      }
      projected.push({min : minPos, max : maxPos});
    }
    //Finally, check along the axis:
    let collision = checkCollisionAlongAxis(projected[0], projected[1]);
    if(!collision){
      isColliding = false; //If there's not a collision going on, we can stop here!
      break;
    }else{
      //Check the distance, whether it is smaller or larger than the minimum pushaway distance.
      //If it is smaller than the minimum, then we should use this distance and this axis instead.
      //let deepness1 = projected[1].min - projected[0].max;
      if(checkedAxis[i] == "y"){
        let distance;
        if(projected[1].min > projected[0].min){
          //Push towards the "right"?
          distance = projected[0].max - projected[1].min;
        }
        else{
          distance = projected[0].min - projected[1].max;
        }
        if(Math.abs(distance) < Math.abs(pushawayDistance)){
          pushawayDistance = distance;
          pushawayAxis = checkedAxis[i];
        }
      }
    }
  }
  return {isColliding : isColliding, pushawayDistance : pushawayDistance, pushawayAxis : pushawayAxis};
}


function checkCollisionAlongAxis(p1, p2){
  if(p1.max > p2.min && p2.max > p1.min){
    return true;
  }
  else if(p1.min < p2.max && p2.min < p1.max){
    return true;
  }
  return false;
}

function getAxisToCheck(){
  let polygons = arguments;
  let checkedAxis = [];
   for(let i = 0; i < polygons.length; i++){
    let polygon = polygons[i];
    for(let j = 0; j < polygon.length; j++){ //Need to be able to loop back.
      let p1 = polygon[j];
      let p2 = polygon[(j+1) % polygon.length]; //Loop back included
      let axis = getAxis(p1, p2); 
      //TODO: Check if the axis has been checked before already.
      if(checkedAxis.includes(axis.k)){
        continue;
      }
      else{
        checkedAxis.push(axis.k);
      }
    }
  }
  return checkedAxis;
}
/*
function getAxisToCheck(){
  let checkedAxis = [];
  for(let i = 0; i < polygonColliders.length; i++){
    let polygon = polygonColliders[i];
    for(let j = 0; j < polygon.length; j++){ //Need to be able to loop back.
      let p1 = polygon[j];
      let p2 = polygon[(j+1) % polygon.length]; //Loop back included
      let axis = getAxis(p1, p2); 
      //TODO: Check if the axis has been checked before already.
      if(checkedAxis.includes(axis.k)){
        continue;
      }
      else{
        checkedAxis.push(axis.k);
      }
    }
  }
  return checkedAxis;
}*/

//This will be the axis we project on to.
function getAxis(pa, pb){
  //We will assume that the axis always pass through origin.
  if(pa.x - pb.x == 0){ //It is aligned with the y axis. The axis we will be checking will the the x axis then.
     return {k : "x", b : 0};
  }
  else if(pa.y - pb.y == 0){
    return {k : "y", b : 0}; //Aligned with the x axis.
  }
  return {k : -1/((pa.y - pb.y)/(pa.x - pb.x)), b : 0};
}

//Get intercept from the slope and the points
function getIntercept(slope, pa){
  //y = kx + b
  //pa.y = pa.x * slope + b
  let b = pa.y - pa.x * slope;
  return b;
}

//Project point onto an equation { k = ..., b = ..., origin = ...}
function projectPoint(point, k){
  //If the axis is axis aligned, then we don't need to project it. just calculate lol.
  //Bad practice, in java you would probably do classes with a enum to keep track of this.
  //I'm just being lazy.
  if(k === "x"){
    return point.x;
  }
  if(k === "y"){
    return point.y;
  }
  
  let ik = -1/k; //Inverse of k
  let ib = getIntercept(ik, point); //Using the inverse of k, solve intercept.
  //solve intersection
  return getIntersection({k:k, b:0}, {k:ik, b:ib});
}

function getIntersection(eqa, eqb){
  //kx + b = ikx + ib
  let rx = (eqb.b - eqa.b) / (eqa.k - eqb.k); //Resolved x
  let ry = eqa.k * rx + eqa.b;
  //return {x : rx, y : ry};
  //just return the distance to the origin (squared) lol
  let sign = (rx >= 0)?1:-1;
  return sign * (rx * rx + ry * ry);
}
