import * as THREE from 'three';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';

export async function createShowroom(section,machines,captions){
  const stage=section.querySelector('.showroom-stage'),host=section.querySelector('.showroom-webgl');
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.8;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#e1e4e5');
  const camera=new THREE.PerspectiveCamera(53,1,.08,100);
  const textures=new THREE.TextureLoader(),loader=new GLTFLoader();
  const assets=await Promise.all([
    ...['room-back','room-left','room-right'].map(n=>textures.loadAsync(`assets/${n}.webp`)),
    ...machines.map(m=>loader.loadAsync(m.model))
  ]).catch(error=>{renderer.dispose();renderer.domElement.remove();throw error;});
  const [back,left,right]=assets;
  [back,left,right].forEach(t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());});
  // Three source images map to perpendicular room surfaces. Rear source also
  // supplies the ceiling and floor through separate UV regions.
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
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(12,20),new THREE.ShadowMaterial({opacity:.23}));
  shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.006,-2);shadow.receiveShadow=true;scene.add(shadow);
  scene.add(new THREE.HemisphereLight(0xf5faff,0x858e97,.65));
  const key=new THREE.DirectionalLight(0xffffff,1.25);key.position.set(-3,4.6,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.radius=3;
  Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.2,far:28});key.shadow.normalBias=.02;
  key.target.position.set(-3,0,-2);scene.add(key,key.target);
  const fill=new THREE.DirectionalLight(0xeaf2ff,.35);fill.position.set(5,4,-4);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xfff2dc,.18);rim.position.set(-5,3,-5);scene.add(rim);
  // Capture the approved room for physical reflections on original metal materials.
  const target=new THREE.WebGLCubeRenderTarget(128,{type:THREE.HalfFloatType});
  const cube=new THREE.CubeCamera(.1,50,target);cube.position.set(-2,1.6,-1);cube.update(renderer,scene);
  const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromCubemap(target.texture);
  scene.environment=env.texture;pmrem.dispose();target.dispose();
  const adjustedMaterials=new Set();
  machines.forEach((m,i)=>{
    const content=assets[i+3].scene;content.rotation.x=m.correctionX??0;content.updateMatrixWorld(true);
    let bounds=new THREE.Box3().setFromObject(content);
    content.scale.setScalar(m.height/bounds.getSize(new THREE.Vector3()).y);content.updateMatrixWorld(true);
    bounds=new THREE.Box3().setFromObject(content);const center=bounds.getCenter(new THREE.Vector3());
    content.position.set(-center.x,-bounds.min.y,-center.z);
    content.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
      (Array.isArray(o.material)?o.material:[o.material]).forEach(mat=>{
        if(adjustedMaterials.has(mat))return;
        adjustedMaterials.add(mat);
        const hsl={};
        if(mat.color)mat.color.getHSL(hsl);
        const namedMetal=/AISI|ACCIAIO|MICROPALLINATURA|SemiPolished|AL6082|ZINCATURA|\bSB\b/i.test(mat.name);
        const neutralMetal=mat.color&&hsl.s<.09&&hsl.l>.16&&hsl.l<.88&&!/NERO|SmoothBlack|NBR|BIANCO|Default/i.test(mat.name);
        if(mat.isMeshStandardMaterial){
          mat.envMapIntensity=namedMetal?.62:neutralMetal?.48:.32;
          if(namedMetal||neutralMetal){
            mat.metalness=namedMetal?.94:.72;
            mat.roughness=/MICROPALLINATURA/i.test(mat.name)?.56:namedMetal?.34:.44;
          }else{
            mat.metalness=Math.min(mat.metalness,.12);
            mat.roughness=Math.max(mat.roughness,.42);
          }
        }
        if(mat.color){
          mat.color.setHSL(hsl.h,Math.min(1,hsl.s*(hsl.s>.1?1.28:1)),hsl.l);
          mat.color.multiplyScalar(namedMetal?.66:neutralMetal?.7:.76);
        }
        mat.needsUpdate=true;
      });});
    const group=new THREE.Group();group.add(content);group.position.set(...m.position);group.rotation.y=m.rotationY??0;scene.add(group);
  });
  const pose={x:0,y:1.7,z:9.8,tx:0,ty:1.6,tz:-10},aim=new THREE.Vector3();let frame=0;
  const draw=()=>{frame=0;camera.position.set(pose.x,pose.y,pose.z);aim.set(pose.tx,pose.ty,pose.tz);camera.lookAt(aim);renderer.render(scene,camera);};
  const requestDraw=()=>{if(!frame)frame=requestAnimationFrame(draw);};
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<701?62:53;camera.updateProjectionMatrix();requestDraw();};
  section.classList.add('has-3d');gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  media.add({mobile:'(max-width: 700px)',desktop:'(min-width: 701px)',reduced:'(prefers-reduced-motion: reduce)'},context=>{
    const {mobile,reduced}=context.conditions;
    const finalPose=m=>{const p=m.position,side=m.side==='left'?-1:1;
      return {x:p[0]-side*(mobile?1.8:1.5),y:mobile?1.55:1.35,z:p[2]+(mobile?2.8:2.5),
        tx:p[0]-side*(mobile?.05:.67),ty:mobile?.2:.95,tz:p[2]};};
    if(reduced){Object.assign(pose,finalPose(machines[0]));section.classList.add('reduced-scene');resize();return()=>section.classList.remove('reduced-scene');}
    section.classList.add('has-motion');Object.assign(pose,{x:0,y:1.7,z:9.8,tx:0,ty:1.6,tz:-10});
    gsap.set(captions,{autoAlpha:0,y:20});captions.forEach(c=>{c.inert=true;});
    const doors=section.querySelector('.showroom-doors');
    const timeline=gsap.timeline({defaults:{ease:'none'},onUpdate:()=>{requestDraw();captions.forEach(c=>{c.inert=Number(gsap.getProperty(c,'opacity'))<.85;});},
      scrollTrigger:{trigger:section,pin:stage,start:'top top',end:()=>`+=${innerHeight*(2.2+machines.length*1.8)}`,scrub:mobile?.45:.65,anticipatePin:1,invalidateOnRefresh:true}});
    timeline.to(section.querySelector('.showroom-entry'),{autoAlpha:0,duration:.25},.04)
      .to(section.querySelector('.showroom-door-left'),{xPercent:-55,duration:1.05,ease:'power1.inOut'},.08)
      .to(section.querySelector('.showroom-door-right'),{xPercent:55,duration:1.05,ease:'power1.inOut'},.08)
      .to(doors,{scale:1.25,duration:1.3},.2).to(doors,{autoAlpha:0,duration:.2},1.15)
      .to(section.querySelector('.showroom-heading'),{autoAlpha:0,duration:.3},.6)
      // Camera physically passes the doorway (z=8), then goes directly to DM40.
      .to(pose,{z:5.2,tx:machines[0].position[0]*.28,ty:1.2,duration:1.2,ease:'power1.inOut'},.25);
    machines.forEach((m,i)=>{const start=1.45+i*3;
      if(i)timeline.to(captions[i-1],{autoAlpha:0,y:20,duration:.25},start-.25);
      timeline.to(pose,{...finalPose(m),duration:1.85,ease:'power1.inOut'},start)
        .to(captions[i],{autoAlpha:1,y:0,duration:.4},start+1.7)
        .to(section.querySelector('.showroom-shade'),{opacity:1,duration:.4},start+1.65)
        .to({},{duration:.75},start+2.1);});
    timeline.fromTo(section.querySelector('.showroom-progress span'),{scaleX:0},{scaleX:1,duration:timeline.duration()},0);resize();
    return()=>{section.classList.remove('has-motion');captions.forEach(c=>{c.inert=false;});};
  });
  const observer=new ResizeObserver(resize);observer.observe(host);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();media.revert();section.classList.remove('has-3d','has-motion');observer.disconnect();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestDraw();});
  resize();draw();ScrollTrigger.refresh();document.fonts?.ready.then(()=>ScrollTrigger.refresh());
}
