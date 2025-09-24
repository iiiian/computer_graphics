# WebGL Homework 2

## Local development

1. Install the uv package manager if it is not already available.
2. From the project root run `uv run python serve.py --host 127.0.0.1 --port 8000`.
3. Open `http://127.0.0.1:8000/index.html` in your browser.

The Python helper sets a text mime type for shader files so browsers can fetch them without extra configuration. All vertex and fragment shaders now live under `shaders/`; some fragments use placeholders like `{{NS}}` that are replaced from the scene scripts at load time so you can tweak loop counts without editing GLSL by hand.
