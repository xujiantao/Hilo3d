(function () {
    var Class = Hilo3d.Class;
    var CubeTexture = Hilo3d.CubeTexture;
    var FrameBuffer = Hilo3d.FrameBuffer;

    var LookAtMap = [
        [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1],
        [0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, -1, 0, 0, -1, 0]
    ];

    var SphereCubeTexture = Class.create({
        Extends: CubeTexture,
        isSphereCubeTexture: true,
        className: 'SphereCubeTexture',

        width: 512,
        height: 512,
        renderer: null,

        constructor: function (params) {
            SphereCubeTexture.superclass.constructor.call(this, params);
        },

        createFrameBuffer: function () {
            this.fbo = new FrameBuffer(this.renderer, {
                target: this.target,
                width: this.width,
                height: this.height,
                createTexture: function () {
                    const state = this.state;
                    const gl = state.gl;
                    const texture = gl.createTexture();

                    gl.activeTexture(gl.TEXTURE0 + Hilo3d.capabilities.MAX_TEXTURE_INDEX);
                    gl.bindTexture(this.target, texture);

                    for (let i = 0; i < 6; i++) {
                        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGB, this.width, this.height, 0, gl.RGB, this.type, null);
                    }

                    gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                        console.warn('Framebuffer is not complete', gl.checkFramebufferStatus(gl.FRAMEBUFFER));
                    }
                    return texture;
                },
                bindTexture: function (index) {
                    index = index || 0;
                    const gl = this.gl;
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, this.attachment, gl.TEXTURE_CUBE_MAP_POSITIVE_X + index, this.texture, 0);
                }
            });
        },

        init: function () {
            if (this._inited) {
                return;
            }
            this._inited = true;
            var sphere = new Hilo3d.Mesh({
                geometry: new Hilo3d.SphereGeometry({
                    radius: 1,
                    heightSegments: 32,
                    widthSegments: 64,
                }),
                material: new Hilo3d.BasicMaterial({
                    lightType: 'NONE',
                    side: Hilo3d.constants.BACK,
                    diffuse: new Hilo3d.Texture({
                        wrapT: Hilo3d.constants.CLAMP_TO_EDGE,
                        wrapS: Hilo3d.constants.CLAMP_TO_EDGE,
                        image: this.image
                    })
                })
            });
            var camera = new Hilo3d.PerspectiveCamera({
                aspect: 1,
                fov: 90,
                far: 2,
                near: 0.1,
            });

            this.createFrameBuffer();

            const fbo = this.fbo;
            const renderer = this.renderer;
            console.time('SphereCubeTexture')
            fbo.bind();
            var pos = new Hilo3d.Vector3;
            renderer.state.viewport(0, 0, this.width, this.height);
            for (var i = 0; i < 6; i++) {
                fbo.bindTexture(i);
                pos.fromArray(LookAtMap[0], i * 3);
                camera.up.fromArray(LookAtMap[1], i * 3);
                camera.lookAt(pos);
                renderer.render(sphere, camera);
            }
            fbo.unbind();
            renderer.viewport();
            console.timeEnd('SphereCubeTexture')
        },
        getGLTexture() {
            this.init();
            return this.fbo.texture;
        },
        destroy(gl) {

        }
    });

    Hilo3d.SphereCubeTexture = SphereCubeTexture;

    var BasicLoader = Hilo3d.BasicLoader;
    var SphereCubeTextureLoader = Class.create({
        Extends: BasicLoader,
        constructor: function () {
            SphereCubeTextureLoader.superclass.constructor.call(this);
        },
        load: function (params) {
            return this.loadImg(params.src).then(img => {
                return new SphereCubeTexture({
                    width: params.width || 512,
                    height: params.height || 512,
                    renderer: params.renderer,
                    image: img
                });
            });
        }
    });
    Hilo3d.SphereCubeTextureLoader = SphereCubeTextureLoader;
    Hilo3d.LoadQueue.addLoader('SphereCubeTexture', SphereCubeTextureLoader);
})();