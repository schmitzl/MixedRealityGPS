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

var isLeft = false;
var animationStep = 0;
var graffitiStep = 0;

var graffiti_step = 1;
var portal_step = 2;
var tram_step = 3;

var step = 1;

var isSearching = true;
var isPlacing = false;
var isTakingScreenshot = false;

var isInitialized = false;
var isBtnClicked = false;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D();
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
//var hud = new THREE.CSS3DArgonHUD();
var renderer = new THREE.WebGLRenderer({
    alpha: true,
    logarithmicDepthBuffer: true
});
renderer.setPixelRatio(window.devicePixelRatio);

app.view.element.appendChild(renderer.domElement);
app.view.element.appendChild(cssRenderer.domElement);
//app.view.element.appendChild(hud.domElement);

/*var arrowContainer = document.getElementById('arrowContainer');
var arrow = document.getElementById('arrow');
arrowContainer.add(arrow);
hudContent.add(arrowContainer);*/

// -- CREATE BOXES --
var box1Geometry = new THREE.BoxGeometry(0.3, 1, 0.3);
var box1Material = new THREE.MeshBasicMaterial({
    color: 0xff0000
});
var box1 = new THREE.Mesh(box1Geometry, box1Material);
var box1Obj = new THREE.Object3D();
box1Obj.add(box1);

var box2Geometry = new THREE.BoxGeometry(0.3, 1, 0.3);
var box2Material = new THREE.MeshBasicMaterial({
    color: 0xff0000
});
var box2 = new THREE.Mesh(box2Geometry, box2Material);
var box2Obj = new THREE.Object3D();
box2Obj.add(box2);

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
var tramSceneGeoPos = Cartesian3.fromDegrees(18.071775, 59351258, 23.13);                    //(17.920747, 59.374212, 11.97);
var tramSceneGeoEntity = new Argon.Cesium.Entity({
    position: new Cesium.ConstantPositionProperty(tramSceneGeoPos, ReferenceFrame.FIXED),
    orientation: Cesium.Quaternion.IDENTITY
});
//scene.add(tramScene);

var graffitiTramScene = new THREE.Object3D();
var graffitiTramBg = new THREE.Object3D();
var graffitiTram = new THREE.Object3D();
var graffitiMaskingPlane = new THREE.Object3D();
loadgraffitiScene();
graffitiTramScene.scale.set(0.25, 0.35, 0.25);
var graffitiTramSceneGeoPos = Cartesian3.fromDegrees(18.071775, 59351258, 23.13);            //(17.920747, 59.374212, 11.97);
var graffitiTramSceneGeoEntity = new Argon.Cesium.Entity({
    position: new Cesium.ConstantPositionProperty(graffitiTramSceneGeoPos, ReferenceFrame.FIXED),
    orientation: Cesium.Quaternion.IDENTITY
});
//scene.add(graffitiTramScene);

var schedule = new THREE.Object3D();
var schedulePost = new THREE.Object3D();
var scheduleBox = new THREE.Object3D();
loadSchedule();
var scheduleGeoPos = Cartesian3.fromDegrees(18.071775, 59351258, 23.13);                     //(17.920747, 59.374212, 11.97);
var scheduleGeoEntity = new Argon.Cesium.Entity({
    position: new Cesium.ConstantPositionProperty(scheduleGeoPos, ReferenceFrame.FIXED),
    orientation: Cesium.Quaternion.IDENTITY
});
//scene.add(schedule);

//var llaBox = new Cesium.Cartographic(CesiumMath.toRadians(18.071689), CesiumMath.toRadians(59.351256), 29.25);
//var cartesianBox = Cesium.Ellipsoid.WGS84.cartographicToCartesian(llaBox);


/*var boxGeoObject = new THREE.Object3D();
var box = new THREE.Object3D();
var loader = new THREE.TextureLoader();
loader.load('box.png', function (texture) {
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({
        map: texture
    });
    var mesh = new THREE.Mesh(geometry, material);
    box.add(mesh);
});
scene.add(boxGeoObject);

var cesiumPosition = Cartesian3.fromDegrees(17.920748, 59.374261, 21.08);
boxGeoObject.add(box);
var boxGeoEntity = new Argon.Cesium.Entity({
    position: new Cesium.ConstantPositionProperty(cesiumPosition, ReferenceFrame.FIXED),
    orientation: Cesium.Quaternion.IDENTITY
});*/

document.getElementById("instructions-graffiti-find").style.display = "inline";


/*var boxLocDiv = document.getElementById("box-location");
var boxLabel = new THREE.CSS3DSprite(boxLocDiv);
boxLabel.scale.set(0.02, 0.02, 0.02);
boxLabel.position.set(0, 1.25, 0);
boxGeoObject.add(boxLabel);*/

var boxCartographicDeg = [0, 0, 0];
//var lastInfoText = '';
//var lastBoxText = '';

function toFixed(value, precision) {
    var power = Math.pow(10, precision || 0);
    return String(Math.round(value * power) / power);
}

var posData = "";
var isRecordingPose = false;
var recordingStep = 0;

app.updateEvent.addEventListener(function (frame) {

    var objPose;

    if (step == graffiti_step) {
        
        scene.add(graffitiTramScene);

        var graffitiScenePos = app.context.getEntityPose(graffitiTramSceneGeoEntity);
        graffitiTramScene.position.copy(graffitiScenePos.position);
        graffitiTramScene.quaternion.copy(graffitiScenePos.orientation);

        objPose = graffitiTramScene.getWorldPosition();

        if (isSearching) {
            if (isBtnClicked) {
                isBtnClicked = false;
                isSearching = false;
                document.getElementById("thumb").src = "resources/imgs/moveGraffitiThumb.png";
                isPlacing = true;
                document.getElementById("arrow").style.display = "none";
                document.getElementById("instructions-graffiti-move").style.display = "inline";
            }
        } else if (isPlacing) {
            if (isBtnClicked) {
                isBtnClicked = false;
                isPlacing = false;
                document.getElementById("slider").style.display = "none";
                document.getElementById("graffiti-slider").style.display = "none";
                document.getElementById("heading").innerHTML = "Take a screenshot";
                document.getElementById("instructions-graffiti-screenshot").style.display = "inline";
                isTakingScreenshot = true;
                scene.add(box1Obj);
                scene.add(box2Obj);
                box1Obj.position.copy(graffitiTramScene.position);
                box2Obj.position.copy(graffitiTramScene.position);
                box2Obj.position.z = box2Obj.position.z - 0.5;
                box2Obj.position.x = box2Obj.position.x + 1.5;
                box2Obj.position.y = box2Obj.position.y + 0.5;
                isRecordingPose = true;
            }
        } else if (isTakingScreenshot) {
            if (isBtnClicked) {
                isBtnClicked = false;
                step++;
                document.getElementById("thumb").src = "resources/imgs/portal_thumb.jpg";
                document.getElementById("doneBtn").style.display = "none";
                document.getElementById("heading").innerHTML = "Find the object";
                document.getElementById("instructions-timeportal-find").style.display = "inline";
                document.getElementById("arrow").style.display = "block";
                isTakingScreenshot = false;
                scene.remove(box1Obj);
                scene.remove(box2Obj);
                isRecordingPose = false;
                sendData(posData);
                posData = "";
                scene.remove(graffitiTramScene);
                isSearching = true;
            }
        }

    } else if (step == portal_step) {

        var tramScenePos = app.context.getEntityPose(tramSceneGeoEntity);
        tramScene.position.copy(tramScenePos.position);
        tramScene.quaternion.copy(tramScenePos.orientation);

        objPose = tramScene.getWorldPosition();

        if (isSearching) {
            if (isBtnClicked) {
                isBtnClicked = false;
                isSearching = false;
                scene.add(tramScene);
                tramScene.position.z = 0;
                document.getElementById("thumb").src = "resources/imgs/moveThumb.jpg";
                isPlacing = true;
                document.getElementById("arrow").style.display = "none";
                document.getElementById("instructions-timeportal-move").style.display = "inline";
            }
        } else if (isPlacing) {
            if (isBtnClicked) {
                isBtnClicked = false;
                isPlacing = false;
                document.getElementById("slider").style.display = "none";
                document.getElementById("timeportal-slider").style.display = "none";
                document.getElementById("heading").innerHTML = "Take a screenshot";
                document.getElementById("instructions-timeportal-screenshot").style.display = "inline";
                isTakingScreenshot = true;
                scene.add(box1Obj);
                scene.add(box2Obj);
                box1Obj.position.copy(tramScene.position);
                box2Obj.position.copy(tramScene.position);
                box2Obj.position.z = box2Obj.position.z - 0.5;
                box2Obj.position.x = box2Obj.position.x + 1.5;
                box2Obj.position.y = box2Obj.position.y + 0.5;
                isRecordingPose = true;
            }
        } else if (isTakingScreenshot) {
            if (isBtnClicked) {
                isRecordingPose = false;
                sendData(posData);
                posData = "";
                isBtnClicked = false;
                step++;
                document.getElementById("thumb").src = "resources/imgs/tram_thumb.jpg";
                document.getElementById("doneBtn").style.display = "none";
                document.getElementById("heading").innerHTML = "Find the object";
                document.getElementById("instructions-schedule-find").style.display = "inline";
                isTakingScreenshot = false;
                scene.remove(box1Obj);
                scene.remove(box2Obj);
                scene.remove(tramScene);
                isSearching = true;
                document.getElementById("arrow").style.display = "block";
            }
        }
    } else {

        var schedulePos = app.context.getEntityPose(scheduleGeoEntity);
        schedule.position.copy(schedulePos.position);
        schedule.quaternion.copy(schedulePos.orientation);

        objPose = schedule.getWorldPosition();

        if (isSearching) {
            if (isBtnClicked) {
                isSearching = false;
                isBtnClicked = false;
                scene.add(schedule);
                document.getElementById("thumb").src = "resources/imgs/moveScheduleThumb.jpg";
                isPlacing = true;
                document.getElementById("arrow").style.display = "none";
                document.getElementById("instructions-schedule-move").style.display = "inline";
            }
        } else if (isPlacing) {
            if (isBtnClicked) {
                isBtnClicked = false;
                isPlacing = false;
                document.getElementById("slider").style.display = "none";
                document.getElementById("heading").innerHTML = "Take a screenshot";
                document.getElementById("instructions-schedule-screenshot").style.display = "inline";
                isTakingScreenshot = true;
                scene.add(box1Obj);
                scene.add(box2Obj);
                box1Obj.position.copy(schedule.position);
                box2Obj.position.copy(schedule.position);
                box2Obj.position.z = box2Obj.position.z - 0.5;
                box2Obj.position.x = box2Obj.position.x + 1.5;
                box2Obj.position.y = box2Obj.position.y + 0.5;
                isRecordingPose = true;
            }
        } else if (isTakingScreenshot) {
            if (isBtnClicked) {
                isBtnClicked = false;
                step++;
                scene.remove(schedule);
                document.getElementById("doneBtn").style.display = "none";
                document.getElementById("heading").innerHTML = "You are finished";
                isTakingScreenshot = false;
                scene.remove(box1Obj);
                scene.remove(box2Obj);
                isRecordingPose = false;
                sendData(posData);
                posData = "";
            }
        } 
    }

    var userPose = app.context.getEntityPose(app.context.user);

    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    } else {

        return;
    }

    // udpate our scene matrices
    scene.updateMatrixWorld();

    if (isRecordingPose) {
        if (recordingStep >= 60) {
            var camDir = camera.getWorldDirection();
            camera.updateMatrixWorld();
            //    var cameraPos = userLocation.position;
            posData = posData + userLocation.position.x + " " + userLocation.position.y + " " + userLocation.position.z + ", " + camDir.x + " " + camDir.y + " " + camDir.z + "\n";
        }
        recordingStep++;
    }

    var graffitiStepVal = document.getElementById('graffiti-slider').value;
    graffitiTram.position.y = graffitiStepVal * 0.003;
    graffitiTram.position.x = graffitiStepVal * 0.005;

    var timePortalStepVal = document.getElementById('timeportal-slider').value;
    tramBase.position.z = timePortalStepVal * 0.01;
    tramFrame.position.z = timePortalStepVal * 0.01;

    var rotationVal = document.getElementById('schedule-slider').value;
    scheduleBox.rotation.y = rotationVal * 0.01745329252;


    /*// get the local coordinates of the local box, and set the THREE object
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
                boxPoseFIXED.position.x += 10;
                var boxLLA = Cesium.Ellipsoid.WGS84.cartesianToCartographic(boxPoseFIXED.position);
                if (boxLLA) {
                    boxCartographicDeg = [
            CesiumMath.toDegrees(boxLLA.longitude),
            CesiumMath.toDegrees(boxLLA.latitude),
            boxLLA.height
        ];
                } */
    // we'll compute the distance to the cube, just for fun. 
    // If the cube could be further away, we'd want to use 
    // Cesium.EllipsoidGeodesic, rather than Euclidean distance, 
    // but this is fine here.
    /* var userPos = userLocation.getWorldPosition();
     var objPose = box.getWorldPosition();
     var distanceToBox = userPos.distanceTo(boxPos);*/

    var camDirection = camera.getWorldDirection();
    camera.updateMatrixWorld();
    var a = camera.position.clone();
    a.applyMatrix3(camera.matrixWorld);
    var b = new THREE.Vector3(a.x + camDirection.x, a.y + camDirection.y, a.z + camDirection.z);
    b.sub(a);
    var c = new THREE.Vector3(objPose.x, objPose.y, objPose.z);
    c.sub(a);
    b.cross(c);

    if (b.z > 0) {
        isLeft = true;
        document.getElementById("arrow").src = "resources/leftArrow.png";
    } else {
        isLeft = false;
        document.getElementById("arrow").src = "resources/rightArrow.png";
    }



    /* camera.matrixWorldInverse.getInverse( camera.matrixWorld ); // may already be computed
     var mat = new THREE.Matrix4().multiply( camera.matrixWorldInverse, boxGeoObject.matrixWorld );
     var pos = mat.multiplyVector3( boxGeoObject.position.clone() );
     var camVec = new THREE.Vector3(0, 0, -1);
     var objDirVec = pos.normalize();

     var dot = camVec.x*objDirVec.x + camVec.z*objDirVec.z;



    var infoText = 'cross3:<br>';
    infoText += 'Your location is lla (' + toFixed(gpsCartographicDeg[0], 6) + ', ';
    infoText += toFixed(gpsCartographicDeg[1], 6) + ', ' + toFixed(gpsCartographicDeg[2], 2) + ')';
    infoText += 'dot + ' + b.z;
    var boxLabelText = 'a wooden box!<br>lla = ' + toFixed(boxCartographicDeg[0], 6) + ', ';
    boxLabelText += toFixed(boxCartographicDeg[1], 6) + ', ' + toFixed(boxCartographicDeg[2], 2);
    if (lastInfoText !== infoText) {
        locationElements[0].innerHTML = infoText;
        lastInfoText = infoText;
    }
    if (lastBoxText !== boxLabelText) {
        boxLocDiv.innerHTML = boxLabelText;
        lastBoxText = boxLabelText;
    }*/
});

app.renderEvent.addEventListener(function () {

    var viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    cssRenderer.setSize(viewport.width, viewport.height);
   // hud.setSize(viewport.width, viewport.height);

    for (var _i = 0, _a = app.view.getSubviews(); _i < _a.length; _i++) {
        var subview = _a[_i];
        var frustum = subview.frustum;

        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);

        camera.projectionMatrix.fromArray(subview.projectionMatrix);

        var _b = subview.viewport,
            x = _b.x,
            y = _b.y,
            width = _b.width,
            height = _b.height;

        camera.fov = THREE.Math.radToDeg(frustum.fovy);
        cssRenderer.setViewport(x, y, width, height, subview.index);
        cssRenderer.render(scene, camera, subview.index);

        renderer.setViewport(x, y, width, height);
        renderer.setScissor(x, y, width, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);

       // hud.setViewport(x, y, width, height, subview.index);
    //    hud.render(subview.index);
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
        var frameMaterial = new THREE.MeshLambertMaterial({
            color: 0x000000
        });
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
    invisibilityContainerLoader.load('resources/obj/tram/invisibilityContainer.js', function (invisibilityContainerGeometry) {
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
    maskingPlaneLoader.load('resources/obj/tram/maskingPlane.js', function (maskingPlaneGeometry) {
        var maskingPlaneMaterial = new THREE.MeshPhongMaterial();
        maskingPlaneMesh = new THREE.Mesh(maskingPlaneGeometry, maskingPlaneMaterial);
        maskingPlaneMesh.material.color.set(0x001100);
        maskingPlaneMesh.material.colorWrite = false;
        maskingPlaneMesh.renderOrder = 1;
        graffitiMaskingPlane.add(maskingPlaneMesh);
    });

    graffitiTramScene.add(graffitiTramBg);
    graffitiTramScene.add(graffitiTram);
    graffitiTramScene.add(graffitiMaskingPlane);
}

function loadSchedule() {
    var schedulePostMesh;
    var schedulePostTextureLoader = new THREE.TextureLoader();
    var schedulePostGeometry = new THREE.Geometry();
    var schedulePostLoader = new THREE.JSONLoader();
    schedulePostLoader.load('resources/obj/tram/SchedulePost.js', function (schedulePostGeometry) {
        var schedulePostMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: schedulePostTextureLoader.load('resources/obj/tram/post.jpg')
        });
        schedulePostMesh = new THREE.Mesh(schedulePostGeometry, schedulePostMaterial);
        schedulePost.add(schedulePostMesh);
    });

    var scheduleBoxMesh;
    var scheduleBoxTextureLoader = new THREE.TextureLoader();
    var scheduleBoxGeometry = new THREE.Geometry();
    var scheduleBoxLoader = new THREE.JSONLoader();
    scheduleBoxLoader.load('resources/obj/tram/ScheduleBox.js', function (scheduleBoxGeometry) {
        var scheduleBoxMaterial = new THREE.MeshPhongMaterial({
            specular: 0x111111,
            map: scheduleBoxTextureLoader.load('resources/obj/tram/box.png')
        });
        scheduleBoxMesh = new THREE.Mesh(scheduleBoxGeometry, scheduleBoxMaterial);
        scheduleBox.add(scheduleBoxMesh);
    });

    schedule.add(schedulePost);
    schedule.add(scheduleBox);
}

function btnClicked() {
    isBtnClicked = true;
    document.getElementById("doneBtn").style.display = "none";
}

function sendData(postData) {
    var data = new FormData();
    data.append("data", postData);
    var xhr = new XMLHttpRequest();
    xhr.open('post', 'https://stockholmmarker.000webhostapp.com/index.php', true);
    xhr.send(data);
}