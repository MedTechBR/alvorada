# Compara a base numa pasta temporária, sem trocar os arquivos da árvore de trabalho.
# Um Chrome por vez; o servidor auxiliar e a pasta são liberados mesmo em erro.
import subprocess,os,tempfile,pathlib,tarfile,shutil,sys
repo=pathlib.Path(__file__).resolve().parents[2]
base=sys.argv[1] if len(sys.argv)>1 else '77a4f217'
with tempfile.TemporaryDirectory(prefix='alvorada-base-') as tmp:
 root=pathlib.Path(tmp)
 for p in repo.iterdir():
  if p.name not in ['.git','src','tools']: (root/p.name).symlink_to(p,target_is_directory=p.is_dir())
 data=subprocess.check_output(['git','archive',base,'src'],cwd=repo)
 archive=root/'src.tar';archive.write_bytes(data)
 with tarfile.open(archive) as tar:tar.extractall(root,filter='data')
 (root/'tools').mkdir();shutil.copy(repo/'tools/serve.py',root/'tools/serve.py')
 for p in (repo/'tools').iterdir():
  if p.name!='serve.py':(root/'tools'/p.name).symlink_to(p,target_is_directory=p.is_dir())
 server=subprocess.Popen(['python3',str(root/'tools/serve.py'),'8701'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  for etapa,porta,ref in [('antes','8701',base),('depois','8700',subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip())]:
   env={**os.environ,'PORTA':porta,'REF_COMMIT':ref,'FPS_LIVRE':'0'}
   for script,arg in [('referencia-desempenho.mjs','expansao-60-'+etapa),('pintura-expansao.mjs',etapa)]:
    print(etapa,script,flush=True)
    with open(repo/f'tools/resultados/expansao-pintada/{script}-{etapa}.log','w') as log:
     subprocess.run(['node','tools/teste-3d/'+script,arg],cwd=repo,env=env,stdout=log,stderr=subprocess.STDOUT,check=True)
 finally:server.terminate();server.wait()

subprocess.run(['node','tools/teste-3d/referencia-comparar.mjs','expansao-60-antes','expansao-60-depois','expansao-60-comparacao'],cwd=repo,check=True)
