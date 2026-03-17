document.addEventListener('DOMContentLoaded',()=>{
  const o=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('v');o.unobserve(x.target)}})},{threshold:.1,rootMargin:'0px 0px -50px 0px'});
  document.querySelectorAll('header.fade,section[data-s="1"]').forEach(e=>e.classList.add('v'));
  setTimeout(()=>document.querySelectorAll('.fade').forEach(e=>o.observe(e)),100);

  const tw=document.getElementById('tw');
  if(tw){
    const p=["writing about football tactics","building with Jekyll and JavaScript","reading and watching","analyzing the Premier League"];
    let i=0,c=0,d=false;
    !function t(){const s=p[i];d?(tw.textContent=s.substring(0,--c)):(tw.textContent=s.substring(0,++c));let n=d?50:100;if(!d&&c===s.length){n=1500;d=true}else if(d&&c===0){d=false;i=(i+1)%p.length;n=500}setTimeout(t,n)}()
  }

  const b=document.getElementById('moreBtn'),w=document.getElementById('wip'),t=document.getElementById('moreTxt');
  if(b&&w)b.onclick=()=>{const x=b.classList.toggle('open');w.classList.toggle('show');t.textContent=x?'Hide in-progress projects':'Show in-progress projects'}
});
