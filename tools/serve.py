# Servidor local de desenvolvimento: igual ao http.server, mas sem cache (sempre serve o código novo)
import http.server, socketserver, sys, os

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()
    def log_message(self, *a):
        pass
    # Só para testes locais: POST /__shot?n=nome salva um JPEG em tools/shots/
    def do_POST(self):
        from urllib.parse import urlparse, parse_qs
        u = urlparse(self.path)
        if u.path != '/__shot' or self.client_address[0] not in ('127.0.0.1', '::1'):
            self.send_error(404); return
        name = ''.join(c for c in parse_qs(u.query).get('n', ['shot'])[0] if c.isalnum() or c in '-_')[:40] or 'shot'
        data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        os.makedirs('tools/shots', exist_ok=True)
        with open(f'tools/shots/{name}.jpg', 'wb') as f: f.write(data)
        self.send_response(204); self.end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8642
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
socketserver.ThreadingTCPServer.allow_reuse_address = True
socketserver.ThreadingTCPServer.request_queue_size = 128  # muitas texturas ao mesmo tempo
with socketserver.ThreadingTCPServer(('127.0.0.1' if os.environ.get('LOCAL_ONLY') else '0.0.0.0', port), NoCache) as s:
    s.daemon_threads = True
    s.serve_forever()
