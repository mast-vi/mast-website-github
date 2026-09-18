import * as THREE from 'three';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/environments/RoomEnvironment.js';

export async function createShowroom(section,machines,captions){
  const stage=section.querySelector('.showroom-stage'),host=section.querySelector('.showroom-webgl');
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  // Migliorata la luminosità complessiva e la risposta cromatica
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  renderer.toneMappingExposure=0.95;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
@@ -40,34 +40,32 @@ export async function createShowroom(section,machines,captions){
  plane(12,20,crop(back,.15,.02,.70,.31),[0,0,-2],[-Math.PI/2,0,0]);
  plane(12,20,crop(back,.14,.79,.72,.21),[0,5,-2],[Math.PI/2,0,0]);

  // Ombra a terra più morbida e realistica
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(12,20),new THREE.ShadowMaterial({opacity:.28}));
  // Ombra a terra morbida
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(12,20),new THREE.ShadowMaterial({opacity:.25}));
  shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.006,-2);shadow.receiveShadow=true;scene.add(shadow);

  // Luci calibrate per rendering industriale
  scene.add(new THREE.HemisphereLight(0xffffff,0x9aa0a6,.75));
  const key=new THREE.DirectionalLight(0xffffff,1.35);
  // Luci della scena
  scene.add(new THREE.HemisphereLight(0xffffff,0x7d858c,.6));
  const key=new THREE.DirectionalLight(0xffffff,1.3);
  key.position.set(-3,4.6,4);
  key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);
  key.shadow.radius=5; // Ombra più sfumata e naturale
  key.shadow.radius=4;
  Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.2,far:28});
  key.shadow.bias=-0.0001;
  key.shadow.normalBias=.025;
  key.shadow.normalBias=.02;
  key.target.position.set(-3,0,-2);
  scene.add(key,key.target);

  const fill=new THREE.DirectionalLight(0xeaf2ff,.45);fill.position.set(5,4,-4);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xfff5ea,.3);rim.position.set(-5,3,-5);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xeaf2ff,.4);fill.position.set(5,4,-4);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xfff2dc,.25);rim.position.set(-5,3,-5);scene.add(rim);

  // Risoluzione mappa cubica portata a 256 per riflessi metallici molto più nitidi
  const target=new THREE.WebGLCubeRenderTarget(256,{type:THREE.HalfFloatType});
  const cube=new THREE.CubeCamera(.1,50,target);
  cube.position.set(-2,1.6,-1);
  cube.update(renderer,scene);
  const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromCubemap(target.texture);
  scene.environment=env.texture;
  pmrem.dispose();target.dispose();
  // Generatore di riflessi da studio HDR (fondamentale per dare lucentezza e contrasto all'acciaio inox)
  const pmrem=new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const roomEnv=new RoomEnvironment();
  scene.environment=pmrem.fromScene(roomEnv,0.04).texture;
  pmrem.dispose();
  roomEnv.dispose();

  const adjustedMaterials=new Set();
  machines.forEach((m,i)=>{
@@ -85,41 +83,25 @@ export async function createShowroom(section,machines,captions){
        adjustedMaterials.add(mat);

        const hsl={};
        if(mat.color) mat.color.getHSL(hsl);
        if(mat.color)mat.color.getHSL(hsl);

        // Identifica solo i metalli (grigi neutri o parti chiamate AISI / Acciaio)
        const namedMetal=/AISI|ACCIAIO|MICROPALLINATURA|SemiPolished|AL6082|ZINCATURA|\bSB\b/i.test(mat.name);
        const neutralMetal=mat.color&&hsl.s<.12&&hsl.l>.15&&hsl.l<.9&&!/NERO|SmoothBlack|NBR|BIANCO|Default/i.test(mat.name);
        const isBlue=hsl.h>0.52&&hsl.h<0.68&&hsl.s>0.3; // Rileva i componenti blu CAD

        if(mat.isMeshStandardMaterial){
          if(namedMetal||neutralMetal){
            // Acciaio Inox satinato/spazzolato
            mat.metalness=namedMetal?.92:.85;
            mat.roughness=/MICROPALLINATURA/i.test(mat.name)?.45:namedMetal?.28:.35;
            mat.envMapIntensity=1.25; // Riflesso della stanza ben visibile sul metallo
          } else if(isBlue){
            // Plastica/silicone industriale opaca (non finta plastica lucida)
            mat.metalness=0.05;
            mat.roughness=0.38;
            mat.envMapIntensity=0.6;
          } else {
            mat.metalness=Math.min(mat.metalness,.15);
            mat.roughness=Math.max(mat.roughness,.35);
            mat.envMapIntensity=0.5;
        const neutralMetal=mat.color&&hsl.s<.10&&hsl.l>.15&&hsl.l<.92&&!/NERO|SmoothBlack|NBR|BIANCO|Default/i.test(mat.name);

        if(namedMetal||neutralMetal){
          if(mat.isMeshStandardMaterial||mat.isMeshPhysicalMaterial){
            // Impostazioni per Acciaio Inox satinato alimentare
            mat.metalness=0.96;
            mat.roughness=/MICROPALLINATURA/i.test(mat.name)?0.42:0.22;
            mat.envMapIntensity=1.4; // Massima reattività ai riflessi di luce
          }
        }

        if(mat.color){
          if(namedMetal||neutralMetal){
            // Schiarisce il metallo per evitare l'effetto "plastica grigio topo"
            mat.color.setHSL(hsl.h, hsl.s * 0.4, Math.min(0.92, hsl.l * 1.15));
          } else if(isBlue){
            // Desatura il blu elettrico trasformandolo in un blu industriale fotorealistico (tipo RAL 5010/5015)
            mat.color.setHSL(0.58, 0.65, 0.38);
          } else {
            mat.color.setHSL(hsl.h, Math.min(1, hsl.s * 0.95), hsl.l);
          if(mat.color){
            // Tonalità argentata luminosa (evita il grigio topo scuro)
            mat.color.setRGB(0.88, 0.89, 0.91);
          }
        }
        // I colori originali (il blu originale, il rosso delle ruote, il display verde) non vengono toccati.
        mat.needsUpdate=true;
      });
    });
