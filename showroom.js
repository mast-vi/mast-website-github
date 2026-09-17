(() => {
  const section = document.querySelector('.showroom');
  if (!section) return;
  // Add records here to place future products on either side of the room.
  const machines = [{ id:'dm40', name:'Dosatrice DM-40', category:'Dosaggio volumetrico',
    description:'Dal liquido agli impasti più corposi. Un dosaggio delicato, anche con prodotti montati e particelle solide.',
    image:'assets/dm40-new.png', model:'assets/dm40.glb', href:'macchinari/dm-40/',
    side:'left', position:[-3.4,0,-1.5], height:1.65,
    correctionX:-Math.atan2(.686498629,.727131097), rotationY:.38 }];
  const captions = machines.map((m,i) => {
    const figure=document.createElement('figure'); figure.className='showroom-machine'; figure.style.order=i*2+1;
    const img=new Image();img.src=m.image;img.alt=m.name;figure.append(img);
    section.querySelector('[data-showroom-machines]').append(figure);
    const c=document.createElement('article');c.className='showroom-caption';c.style.order=i*2+2;
    const k=document.createElement('p');k.className='eyebrow';k.textContent=`${String(i+1).padStart(2,'0')} / ${m.category}`;
    const h=document.createElement('h3');h.textContent=m.name;
    const p=document.createElement('p');p.textContent=m.description;
    const a=document.createElement('a');a.className='button button-primary';a.href=m.href;a.textContent='Vai alla scheda macchina';
    c.append(k,h,p,a);section.querySelector('[data-showroom-captions]').append(c);return c;
  });
  const fallback=()=>{
    section.classList.remove('has-3d','has-motion','is-loading');
    section.setAttribute('aria-busy','false');
    captions.forEach(c=>{c.inert=false;c.removeAttribute('style');});
  };
  if (!window.gsap || !window.ScrollTrigger) {fallback();return;}
  // Begin loading immediately; the closed door is the only initial surface.
  // The original photograph is reserved for a genuine loading/WebGL failure.
  (async()=>{
    try {
      const {createShowroom}=await import('./showroom-3d.js?v=13');
      await createShowroom(section,machines,captions);
      section.classList.remove('is-loading');
      section.setAttribute('aria-busy','false');
      section.querySelector('[data-entry-hint]').textContent='Scorri per entrare nel laboratorio ↓';
    }catch(error){console.warn('3D unavailable; original product photo displayed.',error);fallback();}
  })();
})();
