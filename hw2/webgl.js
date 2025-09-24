const shaderCache = new Map();

function applyReplacements(source, replacements) {
   if (! replacements)
      return source;
   let result = source;
   for (const [key, value] of Object.entries(replacements)) {
      const token = new RegExp('\\{\\{' + key + '\\}}', 'g');
      result = result.replace(token, String(value));
   }
   return result;
}

async function getShaderSource({ inlineSource, url, label, replacements }) {
   if (inlineSource)
      return applyReplacements(inlineSource, replacements);
   if (! url)
      throw new Error('Missing ' + label + ' source');
   let base = shaderCache.get(url);
   if (! base) {
      const response = await fetch(url);
      if (! response.ok)
         throw new Error('Failed to load ' + label + ' from ' + url + ': ' + response.status);
      base = await response.text();
      shaderCache.set(url, base);
   }
   return applyReplacements(base, replacements);
}

function gl_start(canvas, scene) {
   setTimeout(async function() {
      gl = canvas.getContext('webgl2');
      canvas.setShaders = function(vertexShader, fragmentShader) {
	 gl.program = gl.createProgram();
         function addshader(type, src) {
            let shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (! gl.getShaderParameter(shader, gl.COMPILE_STATUS))
               console.log('Cannot compile shader:', gl.getShaderInfoLog(shader));
            gl.attachShader(gl.program, shader);
         };
         addshader(gl.VERTEX_SHADER, vertexShader);
         addshader(gl.FRAGMENT_SHADER, fragmentShader);
         gl.linkProgram(gl.program);
         if (! gl.getProgramParameter(gl.program, gl.LINK_STATUS))
            console.log('Could not link the shader program!');
         gl.useProgram(gl.program);
         gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1, 1,0,   1, 1,0,  -1,-1,0,
	                                                    1,-1,0,  -1,-1,0,   1, 1,0 ]), gl.STATIC_DRAW);
         let aPos = gl.getAttribLocation(gl.program, 'aPos');
         gl.enableVertexAttribArray(aPos);
         gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      }
      try {
         const vertexShaderSource = await getShaderSource({
            inlineSource: scene.vertexShader,
            url: scene.vertexShaderUrl,
            label: 'vertex shader',
            replacements: scene.vertexShaderReplacements
         });
         const fragmentShaderSource = await getShaderSource({
            inlineSource: scene.fragmentShader,
            url: scene.fragmentShaderUrl,
            label: 'fragment shader',
            replacements: scene.fragmentShaderReplacements
         });
         canvas.setShaders(vertexShaderSource, fragmentShaderSource);
         setInterval(function() {
            if (scene.update)
	       scene.update([0,0,7]);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
         }, 30);
      }
      catch (err) {
         console.error('Shader initialization failed:', err);
      }
   }, 100);
}
let gl;
let setUniform = (type,name,a,b,c) => (gl['uniform'+type])(gl.getUniformLocation(gl.program,name), a,b,c);
