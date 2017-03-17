/// <reference types="@argonjs/argon" />
/// <reference types="three" />
// grab some handles on APIs we use
var Cesium = Argon.Cesium;
var Cartesian3 = Argon.Cesium.Cartesian3;
var ReferenceFrame = Argon.Cesium.ReferenceFrame;
var JulianDate = Argon.Cesium.JulianDate;
var CesiumMath = Argon.Cesium.CesiumMath;

var app = Argon.init();

app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D;
scene.add(camera);
scene.add(userLocation);

// add light to the scene
scene.add(new THREE.AmbientLight(0x443333));
var light = new THREE.DirectionalLight(0xffddcc, 1);
light.position.set(1, 0.75, 0.5);
scene.add(light);
var light = new THREE.DirectionalLight(0xccccff, 1);
light.position.set(-1, 0.75, -0.5);
scene.add(light);


var cssRenderer = new THREE.CSS3DArgonRenderer();
var hud = new THREE.CSS3DArgonHUD();
var renderer = new THREE.WebGLRenderer({
    alpha: true,
    logarithmicDepthBuffer: true
});
renderer.setPixelRatio(window.devicePixelRatio);

app.view.element.appendChild(renderer.domElement);
app.view.element.appendChild(cssRenderer.domElement);
app.view.element.appendChild(hud.domElement);

var hudContent = document.getElementById('hud');
hud.appendChild(hudContent);
var locationElements = hudContent.getElementsByClassName('location');

var hudDescription = document.getElementById('description');
hudContent.appendChild(hudDescription);


// -- LOAD SCENES --
var tramScene = new THREE.Object3D();
var tramBase = new THREE.Object3D();
var tramFrame = new THREE.Object3D();
var platform = new THREE.Object3D();
var invisibilityContainer = new THREE.Object3D();
var portal = new THREE.Object3D();
var canvas = new THREE.Object3D();
var sky = new THREE.Object3D();
var ground = new THREE.Object3D();
var stadshuset = new THREE.Object3D();
loadTramScene();
tramScene.rotation.y = Math.PI;
tramScene.translateX(-1);

var graffitiTramScene = new THREE.Object3D();
var graffitiTramBg = new THREE.Object3D();
var graffitiTram = new THREE.Object3D();
var graffitiMaskingPlane = new THREE.Object3D();
loadgraffitiScene();
graffitiTramScene.scale.set(0.25, 0.35, 0.25);

var tramObj = new THREE.Object3D();
var tramObjBase = new THREE.Object3D();
var tramObjFrame = new THREE.Object3D();
loadTramObj();
tramObj.translateX(-5);
tramObj.translateZ(-10);
tramObj.translateY(-10);
tramObj.scale.set(10.0, 10.0, 10.0);

//var llaBox = new Cesium.Cartographic(CesiumMath.toRadians(18.071689), CesiumMath.toRadians(59.351256), 29.25);
//var cartesianBox = Cesium.Ellipsoid.WGS84.cartographicToCartesian(llaBox);

var cesiumPosition = Cartesian3.fromDegrees(18.071689, 59.351256, 29.25);            
   



var boxGeoObject = new THREE.Object3D();
var box = new THREE.Object3D();
var loader = new THREE.TextureLoader();
loader.load('box.png', function (texture) {
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({ map: texture });
    var mesh = new THREE.Mesh(geometry, material);
    box.add(mesh);
});
boxGeoObject.add(box);
var boxGeoEntity = new Argon.Cesium.Entity({
    name: "I have a box",
    position: new Cesium.ConstantPositionProperty(cesiumPosition, ReferenceFrame.FIXED),
    orientation: Cesium.Quaternion.IDENTITY
});

var boxLocDiv = document.getElementById("box-location");
var boxLabel = new THREE.CSS3DSprite(boxLocDiv);
boxLabel.scale.set(0.02, 0.02, 0.02);
boxLabel.position.set(0, 1.25, 0);
boxGeoObject.add(boxLabel);
var boxInit = false;
var boxCartographicDeg = [0, 0, 0];
var lastInfoText = '';
var lastBoxText = '';

function toFixed(value, precision) {
    var power = Math.pow(10, precision || 0);
    return String(Math.round(value * power) / power);
}

app.updateEvent.addEventListener(function (frame) {
  
    var userPose = app.context.getEntityPose(app.context.user);
   
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    }
    else {

        return;
    }
    // the first time through, we create a geospatial position for
    // the box somewhere near us 
    if (!boxInit) {
        var defaultFrame = app.context.getDefaultReferenceFrame();
        // set the box's position to 10 meters away from the user.
        // First, clone the userPose postion, and add 10 to the X
//	var entityPos = app.context.getEntityPose(boxGeoEntity);
        var boxPos_1 = app.context.getEntityPose(boxGeoEntity);
        boxPos_1.x += 10;
        // set the value of the box Entity to this local position, by
        // specifying the frame of reference to our local frame
        boxGeoEntity.position.setValue(boxPos_1, defaultFrame);
        // orient the box according to the local world frame
        boxGeoEntity.orientation.setValue(Cesium.Quaternion.IDENTITY);
        // now, we want to move the box's coordinates to the FIXED frame, so
        // the box doesn't move if the local coordinate system origin changes.
        if (Argon.convertEntityReferenceFrame(boxGeoEntity, frame.time, ReferenceFrame.FIXED)) {
            scene.add(boxGeoObject);
            boxInit = true;
        }
    }
    // get the local coordinates of the local box, and set the THREE object
    var boxPose = app.context.getEntityPose(boxGeoEntity);
    boxGeoObject.position.copy(boxPose.position);
    boxGeoObject.quaternion.copy(boxPose.orientation);
    // rotate the boxes at a constant speed, independent of frame rates     
    // to make it a little less boring
    //box.rotateY(3 * frame.deltaTime / 10000);
    // stuff to print out the status message.
    // It's fairly expensive to convert FIXED coordinates back to LLA, 
    // but those coordinates probably make the most sense as
    // something to show the user, so we'll do that computation.
    // cartographicDegrees is a 3 element array containing 
    // [longitude, latitude, height]
    var gpsCartographicDeg = [0, 0, 0];
    // get user position in global coordinates
    var userPoseFIXED = app.context.getEntityPose(app.context.user, ReferenceFrame.FIXED);
    var userLLA = Cesium.Ellipsoid.WGS84.cartesianToCartographic(userPoseFIXED.position);
    if (userLLA) {
        gpsCartographicDeg = [
            CesiumMath.toDegrees(userLLA.longitude),
            CesiumMath.toDegrees(userLLA.latitude),
            userLLA.height
        ];
    }
    var boxPoseFIXED = app.context.getEntityPose(boxGeoEntity, ReferenceFrame.FIXED);
    var boxLLA = Cesium.Ellipsoid.WGS84.cartesianToCartographic(boxPoseFIXED.position);
    if (boxLLA) {
        boxCartographicDeg = [
            CesiumMath.toDegrees(boxLLA.longitude),
            CesiumMath.toDegrees(boxLLA.latitude),
            boxLLA.height
        ];
    }
    // we'll compute the distance to the cube, just for fun. 
    // If the cube could be further away, we'd want to use 
    // Cesium.EllipsoidGeodesic, rather than Euclidean distance, 
    // but this is fine here.
    var userPos = userLocation.getWorldPosition();
    var boxPos = box.getWorldPosition();
    var distanceToBox = userPos.distanceTo(boxPos);

    var infoText = 'Geospatial Argon example:<br>';
    infoText += 'Your location is lla (' + toFixed(gpsCartographicDeg[0], 6) + ', ';
    infoText += toFixed(gpsCartographicDeg[1], 6) + ', ' + toFixed(gpsCartographicDeg[2], 2) + ')';
    infoText += 'box is ' + toFixed(distanceToBox, 2) + ' meters away';
    var boxLabelText = 'a wooden box!<br>lla = ' + toFixed(boxCartographicDeg[0], 6) + ', ';
    boxLabelText += toFixed(boxCartographicDeg[1], 6) + ', ' + toFixed(boxCartographicDeg[2], 2);
    if (lastInfoText !== infoText) {
        locationElements[0].innerHTML = infoText;
        lastInfoText = infoText;
    }
    if (lastBoxText !== boxLabelText) {
        boxLocDiv.innerHTML = boxLabelText;
        lastBoxText = boxLabelText;
    }
});

app.renderEvent.addEventListener(function () {
  
    var viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    cssRenderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);

    for (var _i = 0, _a = app.view.getSubviews(); _i < _a.length; _i++) {
        var subview = _a[_i];
        var frustum = subview.frustum;
     
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);

        camera.projectionMatrix.fromArray(subview.projectionMatrix);

        var _b = subview.viewport, x = _b.x, y = _b.y, width = _b.width, height = _b.height;

        camera.fov = THREE.Math.radToDeg(frustum.fovy);
        cssRenderer.setViewport(x, y, width, height, subview.index);
        cssRenderer.render(scene, camera, subview.index);

        renderer.setViewport(x, y, width, height);
        renderer.setScissor(x, y, width, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);

        hud.setViewport(x, y, width, height, subview.index);
        hud.render(subview.index);
    }
});

function loadTramScene() {
    var tramMesh;
    var tramTextureLoader = new THREE.TextureLoader();
    var tramGeometry = new THREE.Geometry();
    var tramLoader = new THREE.JSONLoader();
    tramLoader.load('resources/obj/tram/tram.js', function (tramGeometry) {
        var tramMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: tramTextureLoader.load('resources/obj/tram/b_tramBase_Albedo.png')
        });
        tramMesh = new THREE.Mesh(tramGeometry, tramMaterial);
        tramBase.add(tramMesh);
        tramMesh.renderOrder = 2;
        tramMesh.scale.set(.4, .4, .4);
    });
        
    var portalMesh;
    var portalTextureLoader = new THREE.TextureLoader();
    var portalGeometry = new THREE.Geometry();
    var portalLoader = new THREE.JSONLoader();
    portalLoader.load('resources/obj/tram/stoneportal.js', function (portalGeometry) {
        var portalMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: portalTextureLoader.load('resources/obj/tram/bricks.jpg')
        });
        portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
        portalMesh.renderOrder = 0;
        portal.add(portalMesh);
        portalMesh.scale.set(.4, .4, .4);
    });
    
    
    var frameMesh;
    var frameTextureLoader = new THREE.TextureLoader();
    var frameGeometry = new THREE.Geometry();
    var frameLoader = new THREE.JSONLoader();
    frameLoader.load('resources/obj/tram/frame.js', function (frameGeometry) {
        var frameMaterial = new THREE.MeshLambertMaterial({color: 0x000000});
        frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
        frameMesh.renderOrder = 2;
        tramFrame.add(frameMesh);
        frameMesh.scale.set(.4, .4, .4);
    });
    
    var platformMesh;
    var platformTextureLoader = new THREE.TextureLoader();
    var platformGeometry = new THREE.Geometry();
    var platformLoader = new THREE.JSONLoader();
    platformLoader.load('resources/obj/tram/platform.js', function (platformGeometry) {
        var platformMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: platformTextureLoader.load('resources/obj/tram/platformTexture.png')
        });
        platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
        platformMesh.renderOrder = 2;
        platform.add(platformMesh);
        platformMesh.scale.set(.4, .4, .4);
    });

    var invisibilityContainerMesh;
    var invisibilityContainerTextureLoader = new THREE.TextureLoader();
    var invisibilityContainerGeometry = new THREE.Geometry();
    var invisibilityContainerLoader = new THREE.JSONLoader();
    invisibilityContainerLoader.load('resources/obj/tram/invisibilityContainer.js', function(invisibilityContainerGeometry){
        var invisibilityContainerMaterial = new THREE.MeshPhongMaterial();
        invisibilityContainerMesh = new THREE.Mesh(invisibilityContainerGeometry, invisibilityContainerMaterial);
        invisibilityContainerMesh.material.color.set(0x001100);
        invisibilityContainerMesh.material.colorWrite = false;
        invisibilityContainerMesh.renderOrder = 1;
        invisibilityContainer.add(invisibilityContainerMesh);
        invisibilityContainerMesh.scale.set(.4, .4, .4);
    });
    
    var skyMesh;
    var skyTextureLoader = new THREE.TextureLoader();
    var skyGeometry = new THREE.Geometry();
    var skyLoader = new THREE.JSONLoader();
    skyLoader.load('resources/obj/tram/SkyBox.js', function (skyGeometry) {
        var skyMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: skyTextureLoader.load('resources/obj/tram/BlueSky.jpg')
        });
        skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        skyMesh.material.side = THREE.BackSide;
        skyMesh.renderOrder = 2;
        sky.add(skyMesh);
        skyMesh.scale.set(.4, .4, .4);
    });
    
    var groundMesh;
    var groundTextureLoader = new THREE.TextureLoader();
    var groundGeometry = new THREE.Geometry();
    var groundLoader = new THREE.JSONLoader();
    groundLoader.load('resources/obj/tram/ground.js', function (groundGeometry) {
        var groundMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: groundTextureLoader.load('resources/obj/tram/Ground_basecolor.png')
        });
        groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.renderOrder = 2;
        ground.add(groundMesh);
        groundMesh.scale.set(.4, .4, .4);
    });
    
    var stadshusetMesh;
    var stadshusetTextureLoader = new THREE.TextureLoader();
    var stadshusetGeometry = new THREE.Geometry();
    var stadshusetLoader = new THREE.JSONLoader();
    stadshusetLoader.load('resources/obj/tram/stadshuset.js', function (stadshusetGeometry) {
        var stadshusetMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: stadshusetTextureLoader.load('resources/obj/tram/stadshuset.png'),
            transparent: true
        });
        stadshusetMesh = new THREE.Mesh(stadshusetGeometry, stadshusetMaterial);
        stadshusetMesh.renderOrder = 2;
        stadshuset.add(stadshusetMesh);
        stadshusetMesh.scale.set(.4, .4, .4);
    });
    
    tramScene.add(tramBase);
    tramScene.add(tramFrame);
    tramScene.add(platform);
    tramScene.add(invisibilityContainer);
    tramScene.add(portal);
    tramScene.add(sky);
    tramScene.add(ground);
    tramScene.add(stadshuset);
}


function loadgraffitiScene() {
    
    var graffitiBgMesh;
    var graffitiBgTextureLoader = new THREE.TextureLoader();
    var graffitiBgGeometry = new THREE.Geometry();
    var graffitiBgLoader = new THREE.JSONLoader();
    graffitiBgLoader.load('resources/obj/tram/banksyTramBg.js', function (graffitiBgGeometry) {
        var graffitiBgMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: graffitiBgTextureLoader.load('resources/obj/tram/banksyTrainBackground.png')
          
        });
        graffitiBgMesh = new THREE.Mesh(graffitiBgGeometry, graffitiBgMaterial);
        graffitiBgMesh.renderOrder = 2;
        graffitiTramBg.add(graffitiBgMesh);
    });
    
    var graffitiTramMesh;
    var graffitiTramTextureLoader = new THREE.TextureLoader();
    var graffitiTramGeometry = new THREE.Geometry();
    var graffitiTramLoader = new THREE.JSONLoader();
    graffitiTramLoader.load('resources/obj/tram/banksyTram.js', function (graffitiTramGeometry) {
        var graffitiTramMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: graffitiTramTextureLoader.load('resources/obj/tram/banksyTrain.png'),
            transparent: true          
        });
        graffitiTramMesh = new THREE.Mesh(graffitiTramGeometry, graffitiTramMaterial);
        graffitiTramMesh.renderOrder = 2;
        graffitiTram.add(graffitiTramMesh);
    });
    
    var maskingPlaneMesh;
    var maskingPlaneTextureLoader = new THREE.TextureLoader();
    var maskingPlaneGeometry = new THREE.Geometry();
    var maskingPlaneLoader = new THREE.JSONLoader();
    maskingPlaneLoader.load('resources/obj/tram/maskingPlane.js', function(maskingPlaneGeometry){
        var maskingPlaneMaterial = new THREE.MeshPhongMaterial();
        maskingPlaneMesh = new THREE.Mesh(maskingPlaneGeometry, maskingPlaneMaterial);
        maskingPlaneMesh.material.color.set(0x001100);
        maskingPlaneMesh.material.colorWrite = false;
        maskingPlaneMesh.renderOrder = 1;
        graffitiMaskingPlane.add(maskingPlaneMesh);
    });

  //  graffitiTramScene.add(graffitiTramBg);
    graffitiTramScene.add(graffitiTram);
    graffitiTramScene.add(graffitiMaskingPlane);
}

function loadTramObj() {
    var tramObjMesh;
    var tramObjTextureLoader = new THREE.TextureLoader();
    var tramObjGeometry = new THREE.Geometry();
    var tramObjLoader = new THREE.JSONLoader();
    tramObjLoader.load('resources/obj/tram/tram.js', function (tramObjGeometry) {
        var tramObjMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: tramObjTextureLoader.load('resources/obj/tram/b_tramBase_Albedo.png')
        });
        tramObjMesh = new THREE.Mesh(tramObjGeometry, tramObjMaterial);
        tramObjBase.add(tramObjMesh);
    });
    
    var tramFrameMesh;
    var tramFrameTextureLoader = new THREE.TextureLoader();
    var tramFrameGeometry = new THREE.Geometry();
    var tramFrameLoader = new THREE.JSONLoader();
    tramFrameLoader.load('resources/obj/tram/frame.js', function (tramFrameGeometry) {
        var tramFrameMaterial = new THREE.MeshLambertMaterial({color: 0x000000});
        tramFrameMesh = new THREE.Mesh(tramFrameGeometry, tramFrameMaterial);
        tramObjFrame.add(tramFrameMesh);
    });
    
    tramObj.add(tramObjFrame);
    tramObj.add(tramObjBase);
}
