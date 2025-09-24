import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class ShaderAwareHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.vert': 'text/plain',
        '.frag': 'text/plain',
    }


def run_server(host: str, port: int, directory: Path) -> None:
    handler = partial(ShaderAwareHandler, directory=str(directory))
    with ThreadingHTTPServer((host, port), handler) as httpd:
        print(f"Serving {directory} at http://{host}:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Serve the WebGL homework with shader files.')
    parser.add_argument('--host', default='127.0.0.1', help='Host interface to bind (default: 127.0.0.1)')
    parser.add_argument('--port', type=int, default=8000, help='Port to listen on (default: 8000)')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent,
                        help='Directory to serve (default: project root)')
    args = parser.parse_args()

    run_server(args.host, args.port, args.root)
