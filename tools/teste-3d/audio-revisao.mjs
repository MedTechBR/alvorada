// Grava o sintetizador real para revisar batalha e exploração, sem abrir outra instância de Chrome.
import {sessao,sleep} from './rb-lib.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
const s=await sessao({W:844,H:390,cel:true,port:process.env.PORT ?? 8700,qs:'nosw'});
try{
  await s.P.raw('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await s.P.raw('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter'});
  await s.P.ev(`(async()=>{game.app.ticker.stop();await game.audio.unlock();await game.audio.ctx.resume();window.__som=game.audio.ctx.createMediaStreamDestination();game.audio.musicGain.connect(__som);return true;})()`);
  for(const tema of ['battle','forest']){
    await s.P.ev(`(()=>{window.__partes=[];window.__gravador=new MediaRecorder(__som.stream);__gravador.ondataavailable=e=>__partes.push(e.data);__gravador.start();game.audio.music('${tema}');return game.audio.ctx.state;})()`);
    await sleep(14000);
    const data=await s.P.ev(`new Promise(r=>{__gravador.onstop=async()=>{const b=new Blob(__partes,{type:'audio/webm'});const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(b);};__gravador.stop();})`);
    mkdirSync('tools/shots/trilha',{recursive:true});writeFileSync('tools/shots/trilha/'+tema+'.webm',Buffer.from(data,'base64'));
    console.log('Gravado:',tema);
  }
  const erros=s.erros().filter(x=>/EXC|Error/.test(x));console.log({erros});if(erros.length)process.exitCode=1;
}finally{s.kill();}
