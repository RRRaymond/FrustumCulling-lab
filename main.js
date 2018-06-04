

window.onload = function () {
    threeStart();
}



var renderer;
function initThree() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer = new THREE.WebGLRenderer({
        antialias : true
    });
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);
    renderer.setClearColor(0xFFFFFF, 1.0);
}

var camera;
var frustum;
function initCamera() {
    camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    camera.position.x = 800;
    camera.position.y = 800;
    camera.position.z = 800;
    camera.lookAt(new THREE.Vector3(0,0,0));
    frustum = new THREE.Frustum();
    var projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    frustum.setFromMatrix( projScreenMatrix );
}

var scene;
function initScene() {
    scene = new THREE.Scene();
    var axes = new THREE.AxesHelper(1000);
    scene.add(axes);
}

var light;
function initLight() {
    light = new THREE.AmbientLight( "#606060" );
    light.position.set(10,10,10);
    scene.add(light);

    var pointColor = "#ff5808";
    var directionalLight = new THREE.DirectionalLight(pointColor);
    directionalLight.position.set(-40, 60, -10);
    directionalLight.castShadow = true;
    directionalLight.shadowCameraNear = 2;
    directionalLight.shadowCameraFar = 200;
    directionalLight.shadowCameraLeft = -50;
    directionalLight.shadowCameraRight = 50;
    directionalLight.shadowCameraTop = 50;
    directionalLight.shadowCameraBottom = -50;

    directionalLight.distance = 0;
    directionalLight.intensity = 0.5;
    directionalLight.shadowMapHeight = 1024;
    directionalLight.shadowMapWidth = 1024;


    scene.add(directionalLight);
}


function render() {
    delta = clock.getDelta();
    orbitControls.update(delta);
    stats.update();
    camera.updateMatrix();
    camera.updateMatrixWorld();
    var projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    frustum.setFromMatrix( projScreenMatrix );
    requestAnimationFrame(render);
    switch (controls.frustum){
        case "AABB":
            for(var i=3;i<scene.children.length;i++){
                if(frustum.intersectsBox(boxhelpers[i-3].geometry.boundingBox) === true){
                   scene.children[i].visible = true;
                }else{
                    scene.children[i].visible = false;
                }
            }
            break;
        case "Sphere":
            for(var i=3;i<scene.children.length;i++){
                if(frustum.intersectsSphere(boxhelpers[i-3].geometry.boundingSphere) === true){
                    scene.children[i].visible = true;
                }else{
                    scene.children[i].visible = false;
                }
            }
            break;
        default:
            for(var i=3;i<scene.children.length;i++){
                scene.children[i].visible = true;
            }
            break;
    }
    renderer.render(scene, camera);
}

function threeStart() {

    initThree();
    initCamera();
    initScene();
    initLight();
    initStats();


    initOribitControls();

    initGUI();

    loadModel();

    render();


}

var gun;
var boxhelpers = [];
function loadModel(){
    // texture
    var manager = new THREE.LoadingManager();
    manager.onProgress = function ( item, loaded, total ) {
        console.log( item, loaded, total );
    };
    var textureLoader = new THREE.TextureLoader( manager );
    var texture = textureLoader.load( 'obj/Difuuse_militar.jpg' );

    var loader = new THREE.OBJLoader();
    loader.load("obj/file.obj",function (loadedMesh) {
        var material = new THREE.MeshLambertMaterial({color: 0x5C3A21});

        loadedMesh.scale.set(0.01, 0.01, 0.01);
        // 加载完obj文件是一个场景组，遍历它的子元素，赋值纹理并且更新面和点的发现了
        loadedMesh.children.forEach(function (child) {
            //给每个子元素赋值纹理
            child.material.map = texture;
            //更新每个子元素的面和顶点的法向量
            child.geometry.computeFaceNormals();
            child.geometry.computeVertexNormals();
            child.frustumCulled= false;
        });

        var bh = new THREE.BoxHelper().setFromObject(loadedMesh);
        bh.geometry.computeBoundingBox();
        boxhelpers.push(bh);

        gun = loadedMesh;
        //添加到场景当中
        scene.add(loadedMesh);
    });
}


var orbitControls, clock, delta;
function initOribitControls() {
    //添加轨道控制器
    //新建一个轨道控制器
    orbitControls = new THREE.OrbitControls(camera, renderer.domElement, renderer.domElement);
    orbitControls.target = new THREE.Vector3(0, 0, 0);//控制焦点
    orbitControls.autoRotate = true;//将自动旋转打开
    orbitControls.autoRotateSpeed = 5;
    orbitControls.minDistance = 50;
    orbitControls.maxDistance = 3000;
    clock = new THREE.Clock();//用于更新轨道控制器
}




var controls;
function initGUI() {
    //存放有所有需要改变的属性的对象
    controls = new function () {
        this.autoRotate = true;
        this.focusOn = function () {
            camera.position.x = 100;
            camera.position.y = 100;
            camera.position.z = 100;
        };
        this.notFocus = function () {
            camera.position.x = 800;
            camera.position.y = 800;
            camera.position.z = 800;
        };
        this.add = function () {
            var obj = gun.clone();
            obj.position.set(Math.random()*1000, Math.random()*1000, Math.random()*1000);
            var bh = new THREE.BoxHelper().setFromObject(obj);
            bh.geometry.computeBoundingBox();
            boxhelpers.push(bh);
            scene.add(obj);
        };
        this.del = function () {
            if(scene.children.length > 4) {
                scene.children.pop();
            }
        };
        this.frustum = "NULL";
    };

    //创建dat.GUI，传递并设置属性
    var gui = new dat.GUI();
    var autoRotateController = gui.add(controls, 'autoRotate').name("自动旋转");
    gui.add(controls, 'focusOn').name("看近景");
    gui.add(controls, 'notFocus').name("看远景");
    gui.add(controls, 'add').name("添加物体");
    gui.add(controls, "del").name("删除物体");
    gui.add(controls, "frustum", ["NULL", "AABB", "Sphere"]).name("剔除算法");
    
    autoRotateController.onChange(function (value) {
        orbitControls.autoRotate = value;
    })

}

var stats;
function initStats(){
    stats = new Stats();
    //设置统计模式
    stats.setMode(0); // 0: fps, 1: ms
    //统计信息显示在左上角
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '30px';
    stats.domElement.style.top = '30px';
    //将统计对象添加到对应的<div>元素中
    document.getElementById("Stats-output").appendChild(stats.domElement);
    return stats;
}