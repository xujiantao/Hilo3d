(function () {
    var Class = Hilo3d.Class;
    var BasicLoader = Hilo3d.BasicLoader;
    var Node = Hilo3d.Node;
    var BasicMaterial = Hilo3d.BasicMaterial;
    var Geometry = Hilo3d.Geometry;
    var Mesh = Hilo3d.Mesh;
    var util = Hilo3d.util;
    var Matrix4 = Hilo3d.Matrix4;

    var OSGLoader = Class.create({
        Extends: BasicLoader,
        constructor: function () {
            OSGLoader.superclass.constructor.call(this);
        },
        getMaterial: function (data) {
            var material = new BasicMaterial();
            if (!data.StateSet['osg.StateSet'].AttributeList) {
                return material;
            }
            var values = data.StateSet['osg.StateSet'].AttributeList[0]['osg.Material'];
            material.name = values.Name;
            if (values.Diffuse) {
                material.diffuse.fromArray(values.Diffuse);
            }
            if (values.Emission) {
                material.emission.fromArray(values.Emission);
            }
            if (values.Shininess) {
                material.shininess = values.Shininess;
            }
            if (values.Specular) {
                material.specular.fromArray(values.Specular);
            }

            return material;
        },
        parseGeometry: function (parent, data, buffer) {
            var material = this.getMaterial(data);
            var attr = data.VertexAttributeList;
            var geometryData = {};
            if (attr.Normal) {
                var info = attr.Normal.Array.Float32Array;
                geometryData.normals = new Float32Array(buffer, info.Offset, info.Size * 3);
            }
            if (attr.Vertex) {
                var info = attr.Vertex.Array.Float32Array;
                geometryData.vertices = new Float32Array(buffer, info.Offset, info.Size * 3);
            }
            if (attr.TexCoord0) {
                var info = attr.TexCoord0.Array.Float32Array;
                geometryData.uvs = new Float32Array(buffer, info.Offset, info.Size * 2);
            }

            util.each(data.PrimitiveSetList, function (set) {
                if (set.DrawElementsUShort) {
                    var info = set.DrawElementsUShort.Indices.Array.Uint16Array;
                    var geometry = new Geometry({
                        vertices: geometryData.vertices,
                        normals: geometryData.normals,
                        uvs: geometryData.uvs,
                        indices: new Uint16Array(buffer, info.Offset, info.Size),
                        mode: set.DrawElementsUShort.Mode === 'TRIANGLE_STRIP' ? 5 : 4
                    });
                    var mesh = new Mesh({
                        geometry,
                        material
                    });
                    parent.addChild(mesh);
                }
            });
        },
        parseNode: function (parent, data, buffer) {
            var that = this;
            var node = new Node({
                name: data.Name
            });

            if (data.Matrix) {
                var mat = new Matrix4();
                mat.fromArray(data.Matrix);
                node.matrix = mat;
            }

            if (data.Children) {
                util.each(data.Children, function (c) {
                    if (c['osg.Node']) {
                        that.parseNode(node, c['osg.Node'], buffer);
                    } else if (c['osg.MatrixTransform']) {
                        that.parseNode(node, c['osg.MatrixTransform'], buffer);
                    } else if (c['osg.Geometry']) {
                        that.parseGeometry(node, c['osg.Geometry'], buffer);
                    }
                });
            }
            parent.addChild(node);
        },
        load: function (params) {
            var that = this;
            return Promise.all([
                that.loadRes(params.src, 'json'),
                that.loadRes(params.bin, 'buffer')
            ]).then(function (result) {
                var [json, buffer] = result;
                var rootNode = new Node();
                that.parseNode(rootNode, json['osg.Node'], buffer);
                return {
                    node: rootNode
                };
            }).catch(function (err) {
                console.warn('load gltf failed', err.message, err.stack);
                throw err;
            });
        }
    });

    Hilo3d.OSGLoader = OSGLoader;
    Hilo3d.LoadQueue.addLoader('osg', OSGLoader);
})();