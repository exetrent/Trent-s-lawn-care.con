import * as THREE from 'three';
const host=document.getElementById('scene');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x010302);
scene.fog=new THREE.FogExp2(0x020403,.018);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,100);
camera.position.set(0,4.9,17.5);
camera.lookAt(0,4.7,-12);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
host.appendChild(renderer.domElement);
const mat=(color,rough=.72,metal=.08)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
function box(size,pos,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh}
box([30,.5,34],[0,-.25,-2],mat(0x171513,.92));
box([30,13,.6],[0,6,-18],mat(0x070a08,.82));
box([.6,13,34],[-15,6,-2],mat(0x080a09,.84));
box([.6,13,34],[15,6,-2],mat(0x080a09,.84));
box([30,.35,34],[0,12.4,-2],mat(0x050706,.96));
box([18.8,9.6,.8],[0,6,-17.25],mat(0x090b0a,.36,.55));
box([17.7,8.5,.18],[0,6,-16.8],new THREE.MeshStandardMaterial({color:0x141918,emissive:0x8dffaf,emissiveIntensity:.12,roughness:.25}));
for(let row=0;row<4;row++){
 const z=8-row*4.25,y=.7+row*.68;
 box([25,.72,4.05],[0,y-.58,z],mat(0x090a09,.95));
 for(let col=-4;col<=4;col++){
  const x=col*2.55;
  box([2.02,1.3,1.72],[x,y,z],mat(col%2?0x321015:0x3f1018,.58,.04));
  box([2.02,2.18,.58],[x,y+1.36,z+.65],mat(col%2?0x43131b:0x57131f,.55,.04));
  box([.34,.28,.8],[x-1.06,y+.55,z-.05],mat(0x161918,.35,.65));
  box([.34,.28,.8],[x+1.06,y+.55,z-.05],mat(0x161918,.35,.65));
 }
}
for(const x of [-11.5,11.5])for(const z of [-13,-7,-1,5]){
 const strip=box([.35,.12,2.8],[x,.16,z],new THREE.MeshStandardMaterial({color:0xff7a18,emissive:0xff5b00,emissiveIntensity:2.8}));strip.castShadow=false;
}
const textureLoader=new THREE.TextureLoader();
textureLoader.load('https://www.goodfreephotos.com/albums/united-states/kentucky/louisville/skyline-of-downtown-louisville-kentucky.jpg',texture=>{
 texture.colorSpace=THREE.SRGBColorSpace;
 const glass=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
 const left=new THREE.Mesh(new THREE.PlaneGeometry(14,7),glass);left.position.set(-14.65,6,-3);left.rotation.y=Math.PI/2;scene.add(left);
 const right=left.clone();right.position.x=14.65;right.rotation.y=-Math.PI/2;scene.add(right);
});
const ambient=new THREE.HemisphereLight(0x718a7b,0x090504,.72);scene.add(ambient);
const key=new THREE.SpotLight(0xfff1d1,1250,55,Math.PI/4,.6,1.3);key.position.set(0,11,10);key.target.position.set(0,4,-13);key.castShadow=true;scene.add(key,key.target);
const screenGlow=new THREE.PointLight(0xa8ffd1,160,24,2);screenGlow.position.set(0,7,-13);scene.add(screenGlow);
const orange=new THREE.PointLight(0xff6a00,115,20,2);orange.position.set(-11,4,-2);scene.add(orange);
const blue=new THREE.PointLight(0x235dff,80,20,2);blue.position.set(11,4,-2);scene.add(blue);
function neonBar(w,h,x,y,z,color){const mesh=box([w,h,.16],[x,y,z],new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:3,roughness:.22}));mesh.castShadow=false}
neonBar(10,.14,0,10.3,-16.7,0xc9ef57);neonBar(.14,1.5,-5.1,9.62,-16.7,0xc9ef57);neonBar(.14,1.5,5.1,9.62,-16.7,0xc9ef57);
let targetX=0,targetY=0;
addEventListener('pointermove',event=>{targetX=(event.clientX/innerWidth-.5)*.24;targetY=(event.clientY/innerHeight-.5)*.10});
let dim=false;document.getElementById('lights')?.addEventListener('click',event=>{dim=!dim;ambient.intensity=dim?.25:.72;key.intensity=dim?260:1250;orange.intensity=dim?40:115;blue.intensity=dim?30:80;screenGlow.intensity=dim?95:160;event.currentTarget.textContent=dim?'Raise lights':'Dim lights'});
function animate(){requestAnimationFrame(animate);camera.rotation.y+=(targetX-camera.rotation.y)*.035;camera.rotation.x+=(-targetY-camera.rotation.x)*.035;renderer.render(scene,camera)}animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
document.getElementById('fullscreen')?.addEventListener('click',async()=>{try{await document.documentElement.requestFullscreen()}catch{document.getElementById('status').textContent='Fullscreen is not available in this browser.'}});