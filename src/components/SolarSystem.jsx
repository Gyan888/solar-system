import React, {useEffect} from 'react';
import * as THREE from 'three';
import OrbitControls from 'orbit-controls-es6';



let SolarSystem = () =>{
    let container = null;

    let orbitData = {value: 200, runOrbit: true, runRotation: true};

    let getTube = (outerRadius, innerRadius, facets, segement,myColor, name, distanceFromAxis) => {
        var ringGeometry = new THREE.TorusGeometry(outerRadius, innerRadius, facets, segement);
        var ringMaterial = new THREE.MeshBasicMaterial({color: myColor, side: THREE.DoubleSide});
        let myRing = new THREE.Mesh(ringGeometry, ringMaterial);
        myRing.name = name;
        myRing.position.set(distanceFromAxis, 0, 0);
        myRing.rotation.x = Math.PI / 2;
        return myRing;
    };

    let createVisibleOrbits = earthData => {
        var orbitWidth = 0.01;
        let orbit = getRing(earthData.distanceFromAxis + orbitWidth // outer radius
            , earthData.distanceFromAxis - orbitWidth // inner radius
            , 320
            , 0xffffff
            , "earthOrbit"
            , 0);
        return orbit
    };

    let movePlanet = (myPlanet, myData, myTime, stopRotation) => {
        if (orbitData.runRotation && !stopRotation) {
            myPlanet.rotation.y += myData.rotationRate;
        }
        if (orbitData.runOrbit) {
            myPlanet.position.x = Math.cos(myTime
                    * (1.0 / (myData.orbitRate * orbitData.value)) + 10.0)
                    * myData.distanceFromAxis;
            myPlanet.position.z = Math.sin(myTime
                    * (1.0 / (myData.orbitRate * orbitData.value)) + 10.0)
                    * myData.distanceFromAxis;
        }
    };

    let moveMoon = (myMoon, myPlanet, myData, myTime) =>{
        movePlanet(myMoon, myData, myTime);
        if (orbitData.runOrbit) {
            myMoon.position.x = myMoon.position.x + myPlanet.position.x;
            myMoon.position.z = myMoon.position.z + myPlanet.position.z;
        }
    };

    let getSphere = (material, size, segments) => {
        let geometry = new THREE.SphereGeometry(size, segments, segments);
        let obj = new THREE.Mesh(geometry, material);
        obj.castShadow = true;
        return obj;
    };

    let loadTexturedPlanet = (myData, x, y, z, myMaterialType) => { // this will make a sphere
        let myMaterial;                                             // set material and create an object
        var passThisTexture;

        if (myData.texture && myData.texture !== "") {
            passThisTexture = new THREE.ImageUtils.loadTexture(myData.texture);
        }
        if (myMaterialType) {
            myMaterial = getMaterial(myMaterialType, "rgb(255, 255, 255 )", passThisTexture);
        } else {
            myMaterial = getMaterial("lambert", "rgb(255, 255, 255 )", passThisTexture);
        }

        myMaterial.receiveShadow = true;
        myMaterial.castShadow = true;
        var myPlanet = getSphere(myMaterial, myData.size, myData.segments);
        myPlanet.receiveShadow = true;
        myPlanet.name = myData.name;
        myPlanet.position.set(x, y, z);

        return myPlanet;
    }


    let constructPlanetData = (myOrbitRate, myRotationRate, myDistanceFromAxis, myName, myTexture, mySize, mySegments) =>{
        return {
            orbitRate: myOrbitRate
            , rotationRate: myRotationRate
            , distanceFromAxis: myDistanceFromAxis
            , name: myName
            , texture: myTexture
            , size: mySize
            , segments: mySegments
        };
    };

    let getRing = (outerRadius, innerRadius, facets, myColor, name, distanceFromAxis) => {
        let ring1Geometry = new THREE.RingGeometry(outerRadius, innerRadius, facets);
        let ring1Material = new THREE.MeshBasicMaterial({color: myColor, side: THREE.DoubleSide});
        let myRing = new THREE.Mesh(ring1Geometry, ring1Material);
        myRing.name = name;
        myRing.position.set(distanceFromAxis, 0, 0);
        myRing.rotation.x = Math.PI / 2;
        return myRing;
    };

    let getPointLight = (intensity, color) =>{
        var light = new THREE.PointLight(color, intensity);
        light.castShadow = true;

        light.shadow.bias = 0.001;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        return light;
    };

    let getMaterial = (type, color, myTexture) =>{
        let materialOptions = {
            color: color === undefined ? 'rgb(255, 255, 255)' : color,
            map: myTexture === undefined ? null : myTexture
        };

        switch (type) {
            case 'basic':
                return new THREE.MeshBasicMaterial(materialOptions);
            case 'lambert':
                return new THREE.MeshLambertMaterial(materialOptions);
            case 'phong':
                return new THREE.MeshPhongMaterial(materialOptions);
            case 'standard':
                return new THREE.MeshStandardMaterial(materialOptions);
            default:
                return new THREE.MeshBasicMaterial(materialOptions);
        }
    };

    let setUpScene = () =>{
        let camera = new THREE.PerspectiveCamera(
            45, // field of view
            container.clientWidth / container.clientHeight, // aspect ratio
            1, // near clipping plane
            1000 // far clipping plane
            );
        camera.position.z = 30;
        camera.position.x = -30;
        camera.position.y = 30;
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        let scene = new THREE.Scene();
        let renderer = new THREE.WebGLRenderer();
        renderer.setSize(container.clientWidth ,container.clientHeight);
        container.appendChild(renderer.domElement);

        // setting orbit controller to navigate

        let controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true
        controls.dampingFactor = 0.25
        controls.enableZoom = false
        // setting back ground in 3d cube format

        var path = '/cubemap/';
        var format = '.jpg';
        var urls = [
            path + 'px' + format, path + 'nx' + format,
            path + 'py' + format, path + 'ny' + format,
            path + 'pz' + format, path + 'nz' + format
        ];
        var reflectionCube = new THREE.CubeTextureLoader().load(urls);
        reflectionCube.format = THREE.RGBFormat;
        scene.background = reflectionCube;

        // adding point light & ambient light
        let pointLight = getPointLight(1.5, "rgb(255, 220, 180)")
        scene.add(pointLight);
        scene.add(new THREE.AmbientLight(0xaaaaaa));


        let sunMaterial = getMaterial("basic", "rgb(255, 255, 255)");
        let sun = getSphere(sunMaterial, 14, 48); // created sun object with material
        scene.add(sun);

        // Create the glow of the sun.
        let spriteMaterial = new THREE.SpriteMaterial(
                {
                    map: new THREE.ImageUtils.loadTexture("/Planets/glow.png")
                    , useScreenCoordinates: false
                    , color: 0xffffee
                    , transparent: false
                    , blending: THREE.AdditiveBlending
                });
        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(70, 70, 1.0);
        sun.add(sprite); // This centers the glow at the sun.


        // creating mercury
        let mercuryData = constructPlanetData(365, 0.015, 18, "mercury", "/Planets/mercury.jpg", 0.40, 48);
        let mercury = loadTexturedPlanet(mercuryData, mercuryData.distanceFromAxis, 0, 0);
        let mercuryRing = createVisibleOrbits(mercuryData); // created mecury ring
        scene.add(mercuryRing)
        scene.add(mercury);

        // creating venus
        let venusData = constructPlanetData(365, 0.015, 20, "venus", "/Planets/venus.jpg", 0.55, 48);
        let venus = loadTexturedPlanet(venusData, venusData.distanceFromAxis, 0, 0);
        let venusRing = createVisibleOrbits(venusData); // created venus ring
        scene.add(venus);
        scene.add(venusRing);

        // creating earth
        let earthData = constructPlanetData(365.2564, 0.015, 22, "earth", "/Planets/earth.jpg", 0.75, 48); // created a earth json
        let earth = loadTexturedPlanet(earthData, earthData.distanceFromAxis, 0, 0); // creating earth sphere object with material
        let earthRing = createVisibleOrbits(earthData); // creating earth ring
        scene.add(earthRing);
        scene.add(earth);


        // creating moon
        let moonData = constructPlanetData(29.5, 0.01, 1.3, "moon", "/Planets/moon.jpg", 0.25, 48); // created moon json
        let moon = loadTexturedPlanet(moonData, moonData.distanceFromAxis, 0, 0); // created moon sphere object with material
        scene.add(moon);

        // creating mars
        let marsData = constructPlanetData(375, 0.015, 24, "mars", "/Planets/mars.jpg", 0.55, 48); // created a earth json
        let mars = loadTexturedPlanet(marsData, marsData.distanceFromAxis, 0, 0); // creating earth sphere object with material
        let marsRing = createVisibleOrbits(marsData); // creating earth ring
        scene.add(marsRing);
        scene.add(mars);

        // creating jupiter

        let jupiterData = constructPlanetData(375, 0.015, 28, "jupiter", "/Planets/jupiter.jpg", 2, 48); // created a earth json
        let jupiter = loadTexturedPlanet(jupiterData, jupiterData.distanceFromAxis, 0, 0); // creating earth sphere object with material
        let jupiterRing = createVisibleOrbits(jupiterData); // creating earth ring
        scene.add(jupiterRing);
        scene.add(jupiter);


        let saturnData = constructPlanetData(375, 0.015, 34, "saturn", "/Planets/saturn.jpg", 1.5, 48); // created a earth json
        let saturn = loadTexturedPlanet(saturnData, saturnData.distanceFromAxis, 0, 0); // creating earth sphere object with material
        let saturnRing = createVisibleOrbits(saturnData); // creating earth ring
        scene.add(saturnRing);
        scene.add(saturn);


        // creating saturn ring
        let saturnOuterRing = getTube(2.5, 0.4, 2, 23, 0x757064, "ring", saturnData.distanceFromAxis);
        scene.add(saturnOuterRing);


        let planets = {
            "mercury":{
                "obj": mercury,
                "data": mercuryData
            },
            "venus":{
                "obj": venus,
                "data": venusData
            },
            "earth":{
                "obj": earth,
                "data": earthData,
            },
            "mars":{
                "obj": mars,
                "data": marsData
            },
            "jupiter":{
                "obj": jupiter,
                "data": jupiterData
            },
            "saturn":{
                "obj": saturn,
                "data": saturnData
            }
        }

        let data = {
            "pointLight": pointLight,
            "controls": controls,
            "renderer": renderer,
            "scene": scene,
            "camera": camera,
            "sun": sun,
            "planets": planets,
            "moon": {
                "obj": moon,
                "data": moonData
            },
            "saturnOuterRing": saturnOuterRing
        }
        animate(data)
    };

    let animate = (data) => {
        let {pointLight, controls, renderer, scene,
             camera, sun, planets, moon, saturnOuterRing} = data;

        pointLight.position.copy(sun.position);
        controls.update();
        var time = Date.now();

        Object.keys(planets).forEach(planet =>{
            let obj = planets[planet].obj;
            let data = planets[planet].data;
            movePlanet(obj, data, time);
        });
        movePlanet(saturnOuterRing, planets.saturn.data, time, true);
        moveMoon(moon.obj, planets.earth.obj, moon.data, time);
        requestAnimationFrame(() => animate(data));
        renderer.render(scene, camera);
    }

    useEffect(() => {
        setUpScene();
    });

    return(<div  ref={item => container = item}
            style={{width: "100%", height: "100%", position: 'absolute', overflow: 'hidden'}}>

        </div>);
}

export default SolarSystem;