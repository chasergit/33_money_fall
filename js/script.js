"use strict"


import * as THREE from "./three_172.js";


let ticket_front_path="./images/ticket_front.png";
let ticket_back_path="./images/ticket_back.png";
let html_margin=100;
let fall_count=5000;
let fireworks_max=20;


window.addEventListener("resize",on_window_resize);


let ticket_top_style=document.getElementById("ticket_top").style;
let ticket_align=document.getElementById("ticket_align");


function on_window_resize(){
let pre=ticket_top_style.display;
ticket_top_style.display="flex";
let wraper_width=ticket_align.offsetWidth+html_margin;
let wraper_height=ticket_align.offsetHeight+html_margin;
ticket_align.style.scale=Math.min(window.innerWidth/wraper_width,window.innerHeight/wraper_height);
ticket_top_style.display=pre;
}


document.addEventListener("DOMContentLoaded",()=>{
on_window_resize();
});


setInterval(on_window_resize,1000);


let tex=[];
let texture_loader=new THREE.TextureLoader();
tex["tickets"]=texture_loader.load(ticket_front_path,()=>{ loaded++; if(loaded==2){ loop(); } });
tex["tickets"].colorSpace=THREE.SRGBColorSpace;
tex["back"]=texture_loader.load(ticket_back_path,()=>{ loaded++; if(loaded==2){ loop(); } });
tex["back"].colorSpace=THREE.SRGBColorSpace;


window.ticket_start=0;
let showed=0;
let loaded=0;


let mesh=[];
let mat=[];
let vs=[];
let fs=[];


window.tex=tex;
window.mat=mat;
window.mesh=mesh;


let isAutoLaunch=true;


let gravity=new THREE.Vector3(0,-0.005,0);
let friction=0.998;
let textureSize=128.0;
let fireworks_instances=[];
let fireworks_particles_size=100;


vs["firework"]=`
precision mediump float;
attribute vec3 position;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float size;
attribute float adjustSize;
uniform vec3 cameraPosition;
varying float distanceCamera;
attribute vec3 velocity;
attribute vec4 color;
varying vec4 vColor;
void main(){
vColor=color;
vec4 modelViewPosition=modelViewMatrix*vec4(position,1.0);
gl_PointSize=size*adjustSize*(100.0/length(modelViewPosition.xyz));
gl_Position=projectionMatrix*modelViewPosition;
}
`;


fs["firework"]=`
precision mediump float;
uniform sampler2D texture;
varying vec4 vColor;
void main(){
vec4 color=vec4(texture2D(texture,gl_PointCoord));
gl_FragColor=color*vColor;
}
`;


function getOffsetXYZ(i){
let offset=3;
let index=i*offset;
let x=index;
let y=index+1;
let z=index+2;
return {x,y,z};
}


function getOffsetRGBA(i){
let offset=4;
let index=i*offset;
let r=index;
let g=index+1;
let b=index+2;
let a=index+3;
return {r,g,b,a};
}


function getRandomNum(max=0,min=0){
return Math.floor(Math.random()*(max+1-min))+min;
}


function launchFireWorks(){
if(fireworks_instances.length>fireworks_max){ return; }
let fw=Math.random()>8?new BasicFIreWorks():new RichFIreWorks();
fireworks_instances.push(fw);
scene.add(fw.meshGroup);
}


function autoLaunch(){
if(!isAutoLaunch){ return; }
if(Math.random()>0.7){ launchFireWorks(); }
}


function drawRadialGradation(ctx,canvasRadius,canvasW,canvasH){
ctx.save();
let gradient=ctx.createRadialGradient(canvasRadius,canvasRadius,0,canvasRadius,canvasRadius,canvasRadius);
gradient.addColorStop(0.0,"rgba(255,255,255,1.0)");
gradient.addColorStop(0.5,"rgba(255,255,255,0.5)");
gradient.addColorStop(1.0,"rgba(255,255,255,0)");
ctx.fillStyle=gradient;
ctx.fillRect(0,0,canvasW,canvasH);
ctx.restore();
}


function getTexture(){
let canvas=document.createElement("canvas");
let ctx=canvas.getContext("2d");
let diameter=textureSize;
canvas.width=diameter;
canvas.height=diameter;
let canvasRadius=diameter/2;
drawRadialGradation(ctx,canvasRadius,canvas.width,canvas.height);
let texture=new THREE.Texture(canvas);
texture.type=THREE.FloatType;
texture.needsUpdate=true;
return texture;
}


let canvasTexture=getTexture();


function getPointMesh(num,vels,type){


let bufferGeometry=new THREE.BufferGeometry();
let vertices=[];
let velocities=[];
let colors=[];
let adjustSizes=[];
let masses=[];
let colorType=Math.random()>0.3?"single":"multiple";
let singleColor=getRandomNum(100,20)*0.01;
let multipleColor=()=>getRandomNum(100,1)*0.01;
let rgbType;
let rgbTypeDice=Math.random();


if(rgbTypeDice>0.66){ rgbType="red"; }
else if(rgbTypeDice>0.33){ rgbType="green"; }
else{ rgbType="blue"; }


for(let i=0;i<num;i++){
let pos=new THREE.Vector3(0,0,0);
vertices.push(pos.x,pos.y,pos.z);
velocities.push(vels[i].x,vels[i].y,vels[i].z);
if(type==="seed"){
let size;
if(type==="trail"){ size=Math.random()*0.1+0.1; }
else{ size=Math.pow(vels[i].y,2)*0.04; }
if(i===0){ size*=1.1; }
adjustSizes.push(size);
masses.push(size*0.017);
colors.push(1.0,1.0,1.0,1.0);
}
else{
let size=getRandomNum(fireworks_particles_size,10)*0.001;
adjustSizes.push(size);
masses.push(size*0.017);
if(colorType==="multiple"){
colors.push(multipleColor(),multipleColor(),multipleColor(),1.0);
}
else{
switch(rgbType){
case "red":colors.push(singleColor,0.1,0.1,1.0);
break;
case "green":colors.push(0.1,singleColor,0.1,1.0);
break;
case "blue":colors.push(0.1,0.1,singleColor,1.0);
break;
default:colors.push(singleColor,0.1,0.1,1.0);}
}
}
}


bufferGeometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3).setUsage(THREE.DynamicDrawUsage));
bufferGeometry.setAttribute("velocity",new THREE.Float32BufferAttribute(velocities,3).setUsage(THREE.DynamicDrawUsage));
bufferGeometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,4).setUsage(THREE.DynamicDrawUsage));
bufferGeometry.setAttribute("adjustSize",new THREE.Float32BufferAttribute(adjustSizes,1).setUsage(THREE.DynamicDrawUsage));
bufferGeometry.setAttribute("mass",new THREE.Float32BufferAttribute(masses,1).setUsage(THREE.DynamicDrawUsage));


mat["fireworks"]=new THREE.RawShaderMaterial({
uniforms:{
size:{value:textureSize},
texture:{value:canvasTexture}
},
transparent:true,
depthWrite:false,
blending:THREE.AdditiveBlending,
vertexShader:vs["firework"],
fragmentShader:fs["firework"]
});


return new THREE.Points(bufferGeometry,mat["fireworks"]);
}


class ParticleMesh {


constructor(num,vels,type){
this.particleNum=num;
this.timerStartFading=10;
this.mesh=getPointMesh(num,vels,type);
}


update(gravity){


if(this.timerStartFading>0){ this.timerStartFading-=0.3; }
let {position,velocity,color,mass}=this.mesh.geometry.attributes;
let decrementRandom=()=>Math.random()>0.5?0.98:0.96;
let decrementByVel=v=>Math.random()>0.5?0:(1-v)*0.1;
for(let i=0;i<this.particleNum;i++){
let {x,y,z}=getOffsetXYZ(i);
velocity.array[y]+=gravity.y-mass.array[i];
velocity.array[x]*=friction;
velocity.array[z]*=friction;
velocity.array[y]*=friction;
position.array[x]+=velocity.array[x];
position.array[y]+=velocity.array[y];
position.array[z]+=velocity.array[z];
let {a}=getOffsetRGBA(i);
if(this.timerStartFading<=0){
color.array[a]*=decrementRandom()-decrementByVel(color.array[a]);
if(color.array[a]<0.001){ color.array[a]=0; }
}
}
position.needsUpdate=true;
velocity.needsUpdate=true;
color.needsUpdate=true;
}
disposeAll(){
this.mesh.geometry.dispose();
this.mesh.material.dispose();
}
}


class ParticleSeedMesh extends ParticleMesh {
constructor(num,vels){
super(num,vels,"seed");
}
update(gravity){
let {position,velocity,color,mass}=this.mesh.geometry.attributes;
let decrementRandom=()=>Math.random()>0.3?0.99:0.96;
let decrementByVel=v=>Math.random()>0.3?0:(1-v)*0.1;
let shake=()=>Math.random()>0.5?0.05:-0.05;
let dice=()=>Math.random()>0.1;
let _f=friction*0.98;
for(let i=0;i<this.particleNum;i++){
let {x,y,z}=getOffsetXYZ(i);
velocity.array[y]+=gravity.y-mass.array[i];
velocity.array[x]*=_f;
velocity.array[z]*=_f;
velocity.array[y]*=_f;
position.array[x]+=velocity.array[x];
position.array[y]+=velocity.array[y];
position.array[z]+=velocity.array[z];
if(dice()){ position.array[x]+=shake(); }
if(dice()){ position.array[z]+=shake(); }
let {a}=getOffsetRGBA(i);
color.array[a]*=decrementRandom()-decrementByVel(color.array[a]);
if(color.array[a]<0.001){ color.array[a]=0; }
}
position.needsUpdate=true;
velocity.needsUpdate=true;
color.needsUpdate=true;
}
}


class ParticleTailMesh extends ParticleMesh {
constructor(num,vels){
super(num,vels,"trail");
}
update(gravity){
let {position,velocity,color,mass}=this.mesh.geometry.attributes;
let decrementRandom=()=>Math.random()>0.3?0.98:0.95;
let shake=()=>Math.random()>0.5?0.05:-0.05;
let dice=()=>Math.random()>0.2;
for(let i=0;i<this.particleNum;i++){
let {x,y,z}=getOffsetXYZ(i);
velocity.array[y]+=gravity.y-mass.array[i];
velocity.array[x]*=friction;
velocity.array[z]*=friction;
velocity.array[y]*=friction;
position.array[x]+=velocity.array[x];
position.array[y]+=velocity.array[y];
position.array[z]+=velocity.array[z];
if(dice()){ position.array[x]+=shake(); }
if(dice()){ position.array[z]+=shake(); }
let {a}=getOffsetRGBA(i);
color.array[a]*=decrementRandom();
if(color.array[a]<0.001){ color.array[a]=0; }
}
position.needsUpdate=true;
velocity.needsUpdate=true;
color.needsUpdate=true;
}
}


class BasicFIreWorks{
constructor(){
this.meshGroup=new THREE.Group();
this.isExplode=false;
let max=400;
let min=150;
this.petalsNum=getRandomNum(max,min);
this.life=150;
this.seed=this.getSeed();
this.meshGroup.add(this.seed.mesh);
this.flowerSizeRate=THREE.MathUtils.mapLinear(this.petalsNum,min,max,0.4,0.7);
this.flower;
}
getSeed(){
let num=40;
let vels=[];
for(let i=0;i<num;i++){
let vx=0;
let vy=i===0?Math.random()*2.5+0.9:Math.random()*2.0+0.4;
vy*=1.5;
let vz=0;
vels.push(new THREE.Vector3(vx,vy,vz));
}
let pm=new ParticleSeedMesh(num,vels);
let x=Math.random()*300-150;
let y=-70;
let z=Math.random()*300-150;
pm.mesh.position.set(x,y,z);
return pm;
}
explode(pos){
this.isExplode=true;
this.flower=this.getFlower(pos);
this.meshGroup.add(this.flower.mesh);
this.meshGroup.remove(this.seed.mesh);
this.seed.disposeAll();
}
getFlower(pos){
let num=this.petalsNum;
let vels=[];
let radius;
let dice=Math.random();


if(dice>0.5){
for(let i=0;i<num;i++){
radius=getRandomNum(120,60)*0.01;
let theta=THREE.MathUtils.degToRad(Math.random()*180);
let phi=THREE.MathUtils.degToRad(Math.random()*360);
let vx=Math.sin(theta)*Math.cos(phi)*radius;
let vy=Math.sin(theta)*Math.sin(phi)*radius;
let vz=Math.cos(theta)*radius;
let vel=new THREE.Vector3(vx,vy,vz);
vel.multiplyScalar(this.flowerSizeRate);
vels.push(vel);
}
}
else{
let zStep=180/num;
let trad=360*(Math.random()*20+1)/num;
let xStep=trad;
let yStep=trad;
radius=getRandomNum(120,60)*0.01;
for(let i=0;i<num;i++){
let sphereRate=Math.sin(THREE.MathUtils.degToRad(zStep*i));
let vz=Math.cos(THREE.MathUtils.degToRad(zStep*i))*radius;
let vx=Math.cos(THREE.MathUtils.degToRad(xStep*i))*sphereRate*radius;
let vy=Math.sin(THREE.MathUtils.degToRad(yStep*i))*sphereRate*radius;
let vel=new THREE.Vector3(vx,vy,vz);
vel.multiplyScalar(this.flowerSizeRate);
vels.push(vel);
}
}


let particleMesh=new ParticleMesh(num,vels);
particleMesh.mesh.position.set(pos.x,pos.y,pos.z);
return particleMesh;
}
update(gravity){
if(!this.isExplode){
this.drawTail();
}else {
this.flower.update(gravity);
if(this.life>0){ this.life-=1; }
}
}
drawTail(){
this.seed.update(gravity);
let {position,velocity}=this.seed.mesh.geometry.attributes;
let count=0;
let isComplete=true;


for(let i=0,l=velocity.array.length;i<l;i++){
let v=velocity.array[i];
let index=i%3;
if(index===1 && v>0){
count++;
}
}


isComplete=count==0;
if(!isComplete){ return; }
let {x,y,z}=this.seed.mesh.position;
let flowerPos=new THREE.Vector3(x,y,z);
let highestPos=0;
let offsetPos;
for(let i=0,l=position.array.length;i<l;i++){
let p=position.array[i];
let index=i%3;
if(index===1 && p>highestPos){
highestPos=p;
offsetPos=new THREE.Vector3(position.array[i-1],p,position.array[i+2]);
}
}
flowerPos.add(offsetPos);
this.explode(flowerPos);
}
}


class RichFIreWorks extends BasicFIreWorks {
constructor(){
super();
let max=150;
let min=100;
this.petalsNum=getRandomNum(max,min);
this.flowerSizeRate=THREE.MathUtils.mapLinear(this.petalsNum,min,max,0.4,0.7);
this.tailMeshGroup=new THREE.Group();
this.tails=[];
}
explode(pos){
this.isExplode=true;
this.flower=this.getFlower(pos);
this.tails=this.getTail();
this.meshGroup.add(this.flower.mesh);
this.meshGroup.add(this.tailMeshGroup);
}
getTail(){
let tails=[];
let num=10;
let {color:petalColor}=this.flower.mesh.geometry.attributes;


for(let i=0;i<this.petalsNum;i++){
let vels=[];


for(let j=0;j<num;j++){
let vx=0;
let vy=0;
let vz=0;
vels.push(new THREE.Vector3(vx,vy,vz));
}


let tail=new ParticleTailMesh(num,vels);
let {r,g,b,a}=getOffsetRGBA(i);
let petalR=petalColor.array[r];
let petalG=petalColor.array[g];
let petalB=petalColor.array[b];
let petalA=petalColor.array[a];
let {position,color}=tail.mesh.geometry.attributes;


for(let k=0;k<position.count;k++){
let {r,g,b,a}=getOffsetRGBA(k);
color.array[r]=petalR;
color.array[g]=petalG;
color.array[b]=petalB;
color.array[a]=petalA;
}

let {x,y,z}=this.flower.mesh.position;
tail.mesh.position.set(x,y,z);
tails.push(tail);
this.tailMeshGroup.add(tail.mesh);
}
return tails;
}
update(gravity){
if(!this.isExplode){
this.drawTail();
}
else{
this.flower.update(gravity);


let {position:flowerGeometory}=this.flower.mesh.geometry.attributes;


for(let i=0,l=this.tails.length;i<l;i++){
let tail=this.tails[i];
tail.update(gravity);
let {x,y,z}=getOffsetXYZ(i);
let flowerPos=new THREE.Vector3(
flowerGeometory.array[x],
flowerGeometory.array[y],
flowerGeometory.array[z]);
let {position,velocity}=tail.mesh.geometry.attributes;
for(let k=0;k<position.count;k++){
let {x,y,z}=getOffsetXYZ(k);
let desiredVelocity=new THREE.Vector3();
let tailPos=new THREE.Vector3(position.array[x],position.array[y],position.array[z]);
let tailVel=new THREE.Vector3(velocity.array[x],velocity.array[y],velocity.array[z]);
desiredVelocity.subVectors(flowerPos,tailPos);
let steer=desiredVelocity.sub(tailVel);
steer.normalize();
steer.multiplyScalar(Math.random()*0.0003*this.life);
velocity.array[x]+=steer.x;
velocity.array[y]+=steer.y;
velocity.array[z]+=steer.z;
}
velocity.needsUpdate=true;
}

if(this.life>0){ this.life-=1.2; }
}
}
}


function onResize(){
let width=window.innerWidth;
let height=window.innerHeight;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width,height);
camera.aspect=width/height;
camera.updateProjectionMatrix();
}


let scene=new THREE.Scene();


let camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,3000);
camera.position.set(0,0,170);
camera.lookAt(0,0,0);


let renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,transparent:true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(new THREE.Color(0x000000),0);
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;


let project=document.getElementById("project");
project.appendChild(renderer.domElement);


function planeCurve(g, z){
	
  let p = g.parameters;
  let hw = p.width * 0.5;
  
  let a = new THREE.Vector2(-hw, 0);
  let b = new THREE.Vector2(0, z);
  let c = new THREE.Vector2(hw, 0);
  
  let ab = new THREE.Vector2().subVectors(a, b);
  let bc = new THREE.Vector2().subVectors(b, c);
  let ac = new THREE.Vector2().subVectors(a, c);
  
  let r = (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));
  
  let center = new THREE.Vector2(0, z - r);
  let baseV = new THREE.Vector2().subVectors(a, center);
  let baseAngle = baseV.angle() - (Math.PI * 0.5);
  let arc = baseAngle * 2;
  
  let uv = g.attributes.uv;
  let pos = g.attributes.position;
  let mainV = new THREE.Vector2();
  for (let i = 0; i < uv.count; i++){
  	let uvRatio = 1 - uv.getX(i);
    let y = pos.getY(i);
    mainV.copy(c).rotateAround(center, (arc * uvRatio));
    pos.setXYZ(i, mainV.x, y, -mainV.y);
  }
  
  pos.needsUpdate = true;
  return g;
}


let fall_geometry=planeCurve(new THREE.PlaneGeometry(40,20,10,1),10);
let dummy=new THREE.Object3D();


mat["fall"]=new THREE.MeshBasicMaterial();
mat["fall"].map=tex["tickets"];
mat["fall"].side=THREE.DoubleSide;
mat["fall"].forceSinglePass=true;
mat["fall"].transparent=true;


let planeUniforms={
backTexture:{value:tex["back"]}
};


mat["fall"].onBeforeCompile=shader=>{
shader.uniforms.backTexture=planeUniforms.backTexture;
shader.fragmentShader=`
uniform sampler2D backTexture;
`+shader.fragmentShader;
shader.fragmentShader=shader.fragmentShader.replace(
`#include <map_fragment>`,
`#ifdef USE_MAP
vec4 sampledDiffuseColor=gl_FrontFacing?texture2D(map,vMapUv):texture2D(backTexture,vMapUv);
diffuseColor*=sampledDiffuseColor;
#endif`
);
};


mesh["fall"]=new THREE.InstancedMesh(fall_geometry,mat["fall"],fall_count);
mesh["fall"].instanceMatrix.setUsage(THREE.DynamicDrawUsage);
mesh["fall"].frustumCulled=false;
mesh["fall"].position.set(0,20,-200);
scene.add(mesh["fall"]);


let fall_speeds=[];
let fall_rotation_y=[];
let fall_rotation_z=[];


for(let n=0;n<fall_count;n++){
dummy.position.set((Math.random()-0.5)*600,(Math.random()-0.5)*600+600,(Math.random()-0.5)*400);
//dummy.rotation.set(0,(Math.random()-0.5)*6.28,(Math.random()-0.5)*6.28);
fall_rotation_y.push((Math.random()-0.5)*6.28);
fall_rotation_z.push((Math.random()-0.5)*6.28);
dummy.updateMatrix();
mesh["fall"].setMatrixAt(n,dummy.matrix);
fall_speeds.push(Math.random()*1.5+2);
}
mesh["fall"].instanceMatrix.needsUpdate=true;


window.addEventListener("resize",onResize);


let time=0;


let fireworks_started=0;
let fireworks_n=0;


let ticket_status=0;
let ticket_n=0;


let ticket_top=0.1;
let fall_y=true;
let fall_out_n=0;


let ticket_border_style=document.getElementById("ticket_border").style;


function loop(){


requestAnimationFrame(loop);


if(!ticket_start){ return; }
if(!showed){ showed=1; project.style.display="block"; }


time++;


let exploadedIndexList=[];


for(let i=fireworks_instances.length-1;i>=0;i--){
let instance=fireworks_instances[i];
instance.update(gravity);
if(instance.isExplode){ exploadedIndexList.push(i); }
}


for(let i=0,l=exploadedIndexList.length;i<l;i++){
let index=exploadedIndexList[i];
let instance=fireworks_instances[index];
if(!instance){ return; }


instance.meshGroup.remove(instance.seed.mesh);
instance.seed.disposeAll();
if(instance.life<=0){
scene.remove(instance.meshGroup);
if(instance.tailMeshGroup){
instance.tails.forEach(v=>{
v.disposeAll();
});
}
instance.flower.disposeAll();
fireworks_instances.splice(index,1);
}
}


//mesh["fall"].rotation.y-=0.015;


for(let n=0;n<fall_count;n++){
mesh["fall"].getMatrixAt(n,dummy.matrix);
dummy.matrix.decompose(dummy.position,dummy.quaternion,dummy.scale);
fall_rotation_y[n]+=0.05*fall_speeds[n]*0.5;
fall_rotation_z[n]+=0.03*fall_speeds[n]*0.5;
dummy.rotation.x=0;
dummy.rotation.y=fall_rotation_y[n];
dummy.rotation.z=fall_rotation_z[n];
dummy.position.y-=fall_speeds[n];
if(fall_y && dummy.position.y<-300){ dummy.position.y+=600; }
dummy.updateMatrix();
mesh["fall"].setMatrixAt(n,dummy.matrix);
}


mesh["fall"].instanceMatrix.needsUpdate=true;


ticket_border_style.background="rgba(119,192,38,"+(0.6+Math.sin(time/6)*0.4)+")";


if(fireworks_started){
fireworks_n++;	
if(fireworks_n>1){
fireworks_n=0;
autoLaunch();	
}	
}


if(ticket_status==0){
ticket_n++;
if(ticket_n>60*3){
ticket_status=1;	
ticket_top_style.display="flex";
on_window_resize();
}
}


if(ticket_status==1){
ticket_status=2;		
}


if(ticket_status==2){
fall_y=false;
ticket_status=3;
}


if(ticket_status==3){
fall_out_n++;
if(fall_out_n>60*7){
ticket_status=4;
fireworks_started=1;
scene.remove(mesh["fall"]);
}
}


if(ticket_status==4){
project.style.zIndex=100;
ticket_top_style.zIndex=101;
ticket_status=5;
}


if(ticket_status==5){
ticket_top+=0.04;
if(ticket_top>0.8){
ticket_top=0.8;
ticket_status=6;
}
ticket_top_style.background="rgba(0,0,0,"+ticket_top+")";
}


if(ticket_status==6){
ticket_top_style.background="rgba(0,0,0,0)";	
renderer.setClearAlpha(0.8);
ticket_status=7;
}


renderer.render(scene,camera);


}