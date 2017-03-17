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
    position: Cartesian3.ZERO,
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
        var boxPos_1 = userPose.position.clone();
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
