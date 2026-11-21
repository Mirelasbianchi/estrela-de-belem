# Servidor local para testar o jogo sem cache (o navegador sempre pega a versão mais nova).
# Uso: python serve.py   ->  http://localhost:8123/jogo/
import http.server, socketserver, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True


with Server(('', PORT), NoCache) as httpd:
    print(f'Servindo em http://localhost:{PORT}/jogo/')
    httpd.serve_forever()
