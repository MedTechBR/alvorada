// Enquadra os combatentes, sem deixar o treinador parado puxar a câmera.
// A aproximação é suave e os controles recebem margem própria no celular.
export function cameraBatalha(g,anterior,dt=1/60){
 const es=[g.lead,...g.entities.filter(e=>e.side!=='ally'&&e.mon)].filter(e=>e?.alive&&!e.dead);
 if(!es.length)return{x:g.cam.x,y:g.cam.y,z:2};
 const xs=es.map(e=>e.x),ys=es.map(e=>e.y),alturas=es.map(e=>Math.min(90,e.topH??24));
 const x0=Math.min(...xs)-42,x1=Math.max(...xs)+42,y0=Math.min(...ys.map((y,i)=>y-alturas[i]))-24,y1=Math.max(...ys)+30;
 const z=Math.max(.9,Math.min(innerHeight<=450?1.35:1.75,(innerWidth-180)/(x1-x0),(innerHeight-112)/(y1-y0)));
 const alvo={x:(x0+x1)/2,y:(y0+y1)/2,z},k=1-Math.exp(-Math.min(.05,dt)*7);
 if(!anterior)return alvo;
 return{x:anterior.x+(alvo.x-anterior.x)*k,y:anterior.y+(alvo.y-anterior.y)*k,z:anterior.z+(z-anterior.z)*k};
}
