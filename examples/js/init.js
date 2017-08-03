// window.onerror = function (err) {
//     alert(err)
// }
function $(id) {
    return document.getElementById(id);
}
var camera = new Hilo3d.PerspectiveCamera({
    aspect: innerWidth / innerHeight,
    far: 100,
    near: 0.1,
    z: 3
});
var stage = new Hilo3d.Stage({
    container: $('container'),
    camera: camera,
    clearColor: new Hilo3d.Color(0.4, 0.4, 0.4),
    width: innerWidth,
    height: innerHeight
});

var renderer = stage.renderer;
var gl;

var directionLight = new Hilo3d.DirectionalLight({
    color:new Hilo3d.Color(1, 1, 1),
    direction:new Hilo3d.Vector3(0, -1, 0)
}).addTo(stage);

var ambientLight = new Hilo3d.AmbientLight({
    color:new Hilo3d.Color(1, 1, 1),
    amount: .5
}).addTo(stage);

var ticker = new Hilo3d.Ticker(60);
ticker.addTick(stage);
ticker.addTick(Hilo3d.Tween);
ticker.addTick(Hilo3d.Animation);
var stats = new Stats(ticker, stage.renderer.renderInfo);
var orbitControls = new OrbitControls(stage, {
    isLockMove:true
});

setTimeout(function(){
    ticker.start(true);
    gl = renderer.gl;
}, 10);