import * as THREE from 'three';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/environments/RoomEnvironment.js';

// Generatore procedurale della micro-granulosità tipica della micropallinatura con microsfere
function createBeadBlastedTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);

  for (let i = 0; i < imgData.data.length; i += 4) {
    // Genera perturbazioni microscopiche (vettore normale RGB) per simulare l'impatto delle microsfere
    const nx = Math.floor(128 + (Math.random() - 0.5) * 45);
    const ny = Math.floor(128 + (Math.random() - 0.5) * 45);
    imgData.data[i] = nx;
    imgData.data[i + 1] = ny;
    imgData.data[i + 2] = 255;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(40, 40); // Frequenza fitta per micro-granuli realistici
  return texture;
}

export async function createShowroom(section,machines,captions){
  const stage=section.querySelector('.showroom-stage'),host=section.querySelector('.showroom-webgl');
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);

  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#e1e4e5');
  const camera=new THREE.PerspectiveCamera(53,1,.08,100);
  const textures=new THREE.TextureLoader(),loader=new GLTFLoader();
  const assets=await Promise.all([
    ...['room-back','room-left','room-right'].map(n=>textures.loadAsync(`assets/${n}.webp`)),
    ...machines.map(m=>loader.loadAsync(m.model))
  ]).catch(error=>{renderer.dispose();renderer.domElement.remove();throw error;});

  const [back,left,right]=assets;
  [back,left,right].forEach(t=>{
    t.colorSpace=THREE.SRGBColorSpace;
    t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  });

  const crop=(texture,x,y,w,h)=>{const t=texture.clone();t.offset.set(x,y);t.repeat.set(w,h);t.needsUpdate=true;return t;};
  const plane=(w,h,map,p,r)=>{
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,toneMapped:false}));
    mesh.position.set(...p);mesh.rotation.set(...r);scene.add(mesh);return mesh;
  };

  plane(12,5,crop(back,.145,.36,.71,.42),[0,2.5,-12],[0,0,0]);
  plane(20,5,crop(left,0,.17,1,.83),[-6,2.5,-2],[0,Math.PI/2,0]);
  plane(20,5,crop(right,0,.17,1,.83),[6,2.5,-2],[0,-Math.PI/2,0]);
  plane(12,20,crop(back,.15,.02,.70,.31),[0,0,-2],[-Math.PI/2,0,0]);
  plane(12,20,crop(back,.14,.79,.72,.21),[0,5,-2],[Math.PI/2,0,0]);

  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(12,20),new THREE.ShadowMaterial({opacity:.25}));
  shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.006,-2);shadow.receiveShadow=true;scene.add(shadow);

  // Luci calibrate per esaltare le superfici micropallinate (morbide e graduate)
  scene.add(new THREE.HemisphereLight(0xffffff,0x7d858c,.65));
  const key=new THREE.DirectionalLight(0xffffff,1.3);
  key.position.set(-3,4.6,4);
  key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);
  key.shadow.radius=4;
  Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.2,far:28});
  key.shadow.normalBias=.02;
  key.target.position.set(-3,0,-2);
  scene.add(key,key.target);

  const fill=new THREE.Dir
