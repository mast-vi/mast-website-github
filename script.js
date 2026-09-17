const header=document.querySelector('[data-header]');
const menu=document.querySelector('[data-menu]');
const nav=document.querySelector('#main-nav');
const updateHeader=()=>header.classList.toggle('scrolled',scrollY>24);
updateHeader();addEventListener('scroll',updateHeader,{passive:true});
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open);document.body.style.overflow=open?'':'hidden'});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open');document.body.style.overflow=''}));
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
document.querySelector('[data-year]').textContent=new Date().getFullYear();

const conveyor=document.querySelector('[data-conveyor]');
const conveyorLine=document.querySelector('[data-conveyor-line]');
const processWord=document.querySelector('.process-word');
let ticking=false;
const animateScroll=()=>{
  if(conveyor&&conveyorLine){
    const rect=conveyor.getBoundingClientRect();
    const distance=conveyor.offsetHeight-innerHeight;
    const progress=Math.max(0,Math.min(1,-rect.top/distance));
    const travel=conveyorLine.scrollWidth+innerWidth*.15;
    conveyorLine.style.setProperty('--conveyor-x',`${-progress*travel}px`);
    conveyor.classList.toggle('products-active',rect.top<=innerHeight*.52&&rect.bottom>0);
  }
  if(processWord){
    const rect=processWord.parentElement.getBoundingClientRect();
    const progress=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));
    processWord.style.setProperty('--marquee-x',`${-progress*420}px`);
  }
  ticking=false;
};
const requestScrollAnimation=()=>{if(!ticking){requestAnimationFrame(animateScroll);ticking=true}};
addEventListener('scroll',requestScrollAnimation,{passive:true});
addEventListener('resize',requestScrollAnimation);
requestScrollAnimation();
