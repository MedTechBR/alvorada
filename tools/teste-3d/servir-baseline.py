import http.server,socketserver,pathlib,subprocess,tempfile,urllib.parse,sys
# Baseline local da revisão: arquivos de execução alterados vêm do commit original; assets são compartilhados.
raiz=pathlib.Path(__file__).resolve().parents[2]
base=pathlib.Path(tempfile.mkdtemp(prefix='alvorada-baseline-'))
for p in subprocess.check_output(['git','diff','--name-only','855089f0','--','src','index.html'],cwd=raiz,text=True).splitlines():
 r=subprocess.run(['git','show','855089f0:'+p],cwd=raiz,capture_output=True)
 if r.returncode==0:
  destino=base/p;destino.parent.mkdir(parents=True,exist_ok=True);destino.write_bytes(r.stdout)
class Servidor(http.server.SimpleHTTPRequestHandler):
 def translate_path(self,p):
  rel=urllib.parse.unquote(urllib.parse.urlsplit(p).path).lstrip('/') or 'index.html'
  if '..' in pathlib.PurePosixPath(rel).parts:return str(raiz/'nao-encontrado')
  return str((base if (base/rel).is_file() else raiz)/rel)
 def end_headers(self):self.send_header('Cache-Control','no-store');super().end_headers()
 def log_message(self,*a):pass
socketserver.ThreadingTCPServer.allow_reuse_address=True
socketserver.ThreadingTCPServer.request_queue_size=128
with socketserver.ThreadingTCPServer(('127.0.0.1',8701),Servidor) as s:s.daemon_threads=True;s.serve_forever()
