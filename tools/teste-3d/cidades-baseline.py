"""Serve a versão publicada anterior à compactação, compartilhando os assets intactos."""
import http.server
import os
import pathlib
import socketserver
import subprocess
import tempfile
import urllib.parse

raiz = pathlib.Path(__file__).resolve().parents[2]
commit = os.environ.get('REFERENCIA', 'fcde2264')
porta = int(os.environ.get('PORTA', '8701'))

with tempfile.TemporaryDirectory(prefix='alvorada-cidades-antes-') as pasta:
    base = pathlib.Path(pasta)
    # Congela todas as fontes: uma edição posterior não pode contaminar a base.
    arquivos = subprocess.check_output(
        ['git', 'ls-tree', '-r', '--name-only', commit, '--', 'src', 'index.html', 'sw.js', 'assets/firered'],
        cwd=raiz, text=True).splitlines()
    for arquivo in arquivos:
        r = subprocess.run(['git', 'show', commit + ':' + arquivo],
                           cwd=raiz, capture_output=True)
        if r.returncode == 0:
            destino = base / arquivo
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_bytes(r.stdout)

    class Servidor(http.server.SimpleHTTPRequestHandler):
        def translate_path(self, caminho):
            rel = urllib.parse.unquote(urllib.parse.urlsplit(caminho).path).lstrip('/') or 'index.html'
            if '..' in pathlib.PurePosixPath(rel).parts:
                return str(raiz / 'nao-encontrado')
            return str((base if (base / rel).is_file() else raiz) / rel)

        def end_headers(self):
            self.send_header('Cache-Control', 'no-store')
            super().end_headers()

        def log_message(self, *args):
            pass

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer.request_queue_size = 128
    with socketserver.ThreadingTCPServer(('127.0.0.1', porta), Servidor) as servidor:
        servidor.daemon_threads = True
        print(f'Referência {commit}: http://127.0.0.1:{porta}', flush=True)
        servidor.serve_forever()
