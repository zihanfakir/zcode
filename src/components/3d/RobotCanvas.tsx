"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function RobotCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 3.8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x60a5fa, 2.5);
    directionalLight.position.set(3, 4, 3);
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 3.0);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    const bottomGlow = new THREE.PointLight(0x2563eb, 2.0, 10);
    bottomGlow.position.set(0, -2, 2);
    scene.add(bottomGlow);

    // Robot container group
    const robotGroup = new THREE.Group();
    scene.add(robotGroup);

    // Crease edge & mesh materials
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.85,
    });

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x050811,
      roughness: 0.35,
      metalness: 0.8,
      wireframe: false,
    });

    let modelLoaded = false;
    const loader = new GLTFLoader();

    loader.load(
      "/robot.glb",
      (gltf) => {
        const model = gltf.scene;

        // Auto center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.0 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y -= 0.15;

        // Process meshes: add crease-edge wireframe
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = bodyMaterial;

            // Extract crease edges past 24 degrees threshold
            try {
              const edgesGeo = new THREE.EdgesGeometry(mesh.geometry, 24);
              const edgeLines = new THREE.LineSegments(edgesGeo, edgeMaterial);
              mesh.add(edgeLines);
            } catch {
              // fallback if geometry format is non-indexed
            }
          }
        });

        robotGroup.add(model);
        modelLoaded = true;
        setLoading(false);
      },
      undefined,
      (error) => {
        console.warn("Failed to load /robot.glb, fallback to procedural tech cube", error);
        // Procedural tech fallback if GLB takes time or errors
        const geom = new THREE.IcosahedronGeometry(0.9, 1);
        const edges = new THREE.EdgesGeometry(geom);
        const mesh = new THREE.Mesh(geom, bodyMaterial);
        const lines = new THREE.LineSegments(edges, edgeMaterial);
        mesh.add(lines);
        robotGroup.add(mesh);
        modelLoaded = true;
        setLoading(false);
      }
    );

    // Mouse tilt & interactive drag controls
    let targetRotationX = 0;
    let targetRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.008;
        targetRotationX += deltaY * 0.008;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleClick = () => {
      // Small click interaction - optional route or pulse
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("mouseup", handlePointerUp);
    container.addEventListener("mousedown", handlePointerDown);
    container.addEventListener("click", handleClick);

    // Touch support for mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - previousMousePosition.x;
        targetRotationY += deltaX * 0.008;
        previousMousePosition = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });

    // Window resize observer
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // Render loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (modelLoaded) {
        // Idle gentle float & breathing sway
        robotGroup.position.y = Math.sin(elapsedTime * 1.4) * 0.06 - 0.05;

        // Pointer tilt tracking interpolation
        const tiltX = mouseY * 0.25;
        const tiltY = mouseX * 0.45;

        robotGroup.rotation.x += (targetRotationX + tiltX - robotGroup.rotation.x) * 0.05;
        robotGroup.rotation.y += (targetRotationY + tiltY - robotGroup.rotation.y) * 0.05;

        // Subtle continuous base rotation when not dragging
        if (!isDragging) {
          targetRotationY += 0.0025;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Teardown and GPU cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      ro.disconnect();
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      container.removeEventListener("mousedown", handlePointerDown);
      container.removeEventListener("click", handleClick);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchstart", handleTouchStart);

      edgeMaterial.dispose();
      bodyMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [router]);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none cursor-grab active:cursor-grabbing">
      {/* 3D Canvas mount container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0" />

      {/* Loading HUD spinner */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 pointer-events-none bg-black/40 backdrop-blur-xs">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
          <span className="font-mono text-[0.625rem] tracking-[0.25em] text-zinc-400 uppercase animate-pulse">
            INITIALIZING 3D ENGINE...
          </span>
        </div>
      )}

      {/* Centerpiece HUD interactive cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800/60 bg-black/40 backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-zinc-400">
          DRAG TO ROTATE · TILT TRACKING
        </span>
      </div>
    </div>
  );
}
