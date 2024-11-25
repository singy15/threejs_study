<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as CANNON from "cannon-es";
import * as THREE from "three";
import CannonDebugger from "cannon-es-debugger";
import Stats from "three/examples/jsm/libs/stats.module";
import PhysicsObject from "./physics-object.js";
import PhysicsObjectManager from "./physics-object-manager.js";

const canvas = ref(null);
const simulationSuspend = ref(false);

const randomRange = (min, max) => {
  return min + Math.random() * (max - min);
};

// Canvas size
const width = 500;
const height = 500;

const materialSphere = new CANNON.Material({
  restitution: 0.9,
  //friction: 1000.8,
});

const materialBox = new CANNON.Material({
  restitution: 0.3,
  friction: 0.8,
});

function initWorld() {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    // antialias: true,
    // alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  // renderer.setPixelRatio(0.8);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  //scene.fog = new THREE.Fog(0x000000, 1, 100);

  let rot = 0;

  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);

  const loader = new THREE.TextureLoader();

  // Point Light
  let light;
  (() => {
    light = new THREE.PointLight(0xffffff);
    light.position.set(100, 100, 100);
    light.intensity = 100000;
    light.decay = 2.2;
    light.castShadow = true;
    light.shadow.mapSize.Width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadowCameraFar = 10000;
    light.shadowCameraNear = 0;
    // light.shadow.camera.right = 12;
    // light.shadow.camera.left = -12;
    // light.shadow.camera.top = -12;
    // light.shadow.camera.bottom = 12;

    //// soft shadow
    // light.shadow.radius = 15;
    // light.shadow.blurSamples = 20;

    scene.add(light);
  })();

  // Ambient light
  scene.add(new THREE.AmbientLight(0xffffff, 0.1));

  var world = new CANNON.World();
  world.gravity.set(0, -9.82 * 10.0, 0);

  let pom = new PhysicsObjectManager();

  const texWood = loader.load("pexels-fwstudio-33348-129731.jpg");

  const spawnBox = (scene, world, pom, x, y, z) => {
    let sphere1 = new PhysicsObject();
    sphere1.timer = 2000;
    sphere1.scene = scene;
    sphere1.world = world;
    (() => {
      let size = 2.0 + Math.random() * 10.0;
      var sphereBody = new CANNON.Body({
        mass: 5,
        position: new CANNON.Vec3(x, y, z),
        shape: new CANNON.Box(new CANNON.Vec3(size, size, size)),
        material: materialBox,
      });
      world.addBody(sphereBody);
      sphere1.body = sphereBody;

      // collision
      sphereBody.addEventListener("collide", (event) => {
        event.body.angularDamping = 0.5;
      });

      let mesh;
      (() => {
        const geometry = new THREE.BoxGeometry(size * 2, size * 2, size * 2);
        const texture = loader.load("earthcloudmap.jpg");
        texture.colorSpace = THREE.SRGBColorSpace;
        const texEarchBump = loader.load("earthbump1k.jpg");
        const material = new THREE.MeshStandardMaterial({
          color: randomRange(0x000000, 0xffffff),
          //map: texture,
          //bumpMap: texture,
          //bumpScale: 3.0,
          //wireframe: true,
          //alphaMap: texture,
          roughness: 0.2,
          // transmission: 0.9,
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      })();
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      sphere1.mesh = mesh;

      pom.addObject(sphere1);
    })();
  };

  const spawnSphere = (scene, world, pom, x, y, z) => {
    let sphere1 = new PhysicsObject();
    sphere1.timer = 2000;
    sphere1.scene = scene;
    sphere1.world = world;
    (() => {
      let size = 3.0 + Math.random() * 8.0;
      var sphereBody = new CANNON.Body({
        mass: 5,
        position: new CANNON.Vec3(x, y, z),
        shape: new CANNON.Sphere(size),
        material: materialSphere,
      });
      world.addBody(sphereBody);
      sphere1.body = sphereBody;

      sphereBody.addEventListener("collide", (event) => {
        let body = event.body;
        let contact = event.contact;
        event.body.angularDamping = 0.5;
      });

      let mesh;
      (() => {
        const geometry = new THREE.SphereGeometry(size, 30, 30);
        const texture = loader.load("earthcloudmap.jpg");
        texture.colorSpace = THREE.SRGBColorSpace;
        const texEarchBump = loader.load("earthbump1k.jpg");
        const material = new THREE.MeshStandardMaterial({
          color: randomRange(0x000000, 0xffffff),
          //map: texture,
          //bumpMap: texture,
          //bumpScale: 3.0,
          //wireframe: true,
          //alphaMap: texture,
        });
        material.roughness = 0.2;
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      })();
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      sphere1.mesh = mesh;

      pom.addObject(sphere1);
    })();
  };

  const cannonDebugger = new CannonDebugger(scene, world);

  let materialGround = new CANNON.Material({
    restitution: 0.5,
    // friction: 2000.9,
  });

  let ground = { body: null, obj: null, sync: null };
  (() => {
    let size = 80;
    let thickness = 0.0001;

    let groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(size, thickness, size)),
      material: materialGround,
    });
    world.addBody(groundBody);
    ground.body = groundBody;

    const geo = new THREE.BoxGeometry(size * 2, thickness, size * 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      // map: texWood,
    });
    mat.roughness = 0.3;
    const cube = new THREE.Mesh(geo, mat);
    cube.receiveShadow = true;
    scene.add(cube);

    ground.sync = () => {
      cube.position.copy(groundBody.position);
      cube.quaternion.copy(groundBody.quaternion);
    };
  })();

  world.addContactMaterial(
    new CANNON.ContactMaterial(materialGround, materialSphere, {
      friction: 0.1,
      restitution: 0.6,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3,
    }),
  );

  world.addContactMaterial(
    new CANNON.ContactMaterial(materialGround, materialBox, {
      friction: 2.1,
      restitution: 0.6,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3,
    }),
  );

  var fixedTimeStep = 1.0 / 60.0; // seconds
  var maxSubSteps = 3;

  (() => {
    const mat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const points = [];
    points.push(new THREE.Vector3(0.0, 0.0, 0.0));
    points.push(new THREE.Vector3(1000.0, 0.0, 0.0));
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, mat);
    scene.add(line);
  })();
  (() => {
    const mat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const points = [];
    points.push(new THREE.Vector3(0.0, 0.0, 0.0));
    points.push(new THREE.Vector3(0.0, 1000.0, 0.0));
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, mat);
    scene.add(line);
  })();
  (() => {
    const mat = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const points = [];
    points.push(new THREE.Vector3(0.0, 0.0, 0.0));
    points.push(new THREE.Vector3(0.0, 0.0, 1000.0));
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, mat);
    scene.add(line);
  })();

  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  // Start the simulation loop
  var lastTime;
  let t = 0;
  (function simloop(time) {
    if (simulationSuspend.value) return;
    requestAnimationFrame(simloop);
    if (lastTime !== undefined) {
      var dt = (time - lastTime) / 1000;

      t++;

      if (t % 30 === 0) {
        spawnSphere(
          scene,
          world,
          pom,
          randomRange(-20, 20),
          150.0,
          randomRange(-20, 20),
        );
        spawnBox(
          scene,
          world,
          pom,
          randomRange(-20, 20),
          150.0,
          randomRange(-20, 20),
        );
      }

      stats.begin();
      world.step(fixedTimeStep, dt, maxSubSteps);
      pom.updateAll();
      renderer.render(scene, camera);
      stats.end();

      rot += 0.1;
      const radian = (rot * Math.PI) / 180;
      camera.position.y = 150.0;
      let cameraDistance = 150.0;
      camera.position.x = cameraDistance * Math.sin(radian);
      camera.position.z = cameraDistance * Math.cos(radian);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
    // console.log(1);
    lastTime = time;
  })();
}

const key = ref(Math.random());

onMounted(initWorld);

onUnmounted(() => {
  simulationSuspend.value = true;
});
</script>

<template>
  <canvas ref="canvas" :key="key"></canvas>
</template>

<style scoped></style>
