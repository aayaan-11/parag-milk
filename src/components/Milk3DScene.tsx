import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export const Milk3DScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<boolean>(false);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Check WebGL availability
    let gl: WebGLRenderingContext | null = null;
    try {
      const tempCanvas = document.createElement('canvas');
      gl = (tempCanvas.getContext('webgl') || tempCanvas.getContext('experimental-webgl')) as WebGLRenderingContext;
    } catch (e) {
      gl = null;
    }

    if (!gl) {
      setWebglError(true);
      setIsLoaded(true);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // Dimensions
    let width = container.clientWidth || 400;
    let height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Main key light with soft shadow
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // Dynamic backlight (cyan/blue) for premium rim highlights
    const rimLight = new THREE.DirectionalLight(0x3b82f6, 1.5);
    rimLight.position.set(-5, -3, -5);
    scene.add(rimLight);

    // Dynamic front-warm specular light
    const frontLight = new THREE.PointLight(0xfff5e6, 1.5, 15);
    frontLight.position.set(0, 2, 4);
    scene.add(frontLight);

    // 5. Bottle Geometry & Materials
    const bottleGroup = new THREE.Group();
    scene.add(bottleGroup);

    // Bottle Lathe Points (glass outline)
    const glassPoints = [
      new THREE.Vector2(0, -2.0),
      new THREE.Vector2(0.85, -2.0),
      new THREE.Vector2(0.9, -1.9),
      new THREE.Vector2(0.9, 0.4),
      new THREE.Vector2(0.85, 0.6),
      new THREE.Vector2(0.65, 0.8),
      new THREE.Vector2(0.4, 1.1),
      new THREE.Vector2(0.35, 1.5),
      new THREE.Vector2(0.35, 1.8),
      new THREE.Vector2(0.42, 1.85),
      new THREE.Vector2(0.42, 1.95),
      new THREE.Vector2(0, 1.95),
    ];

    const glassGeometry = new THREE.LatheGeometry(glassPoints, 64);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.02,
      transmission: 0.95, // Glass effect
      thickness: 0.4,
      ior: 1.5,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      side: THREE.DoubleSide
    });
    const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
    glassMesh.castShadow = true;
    glassMesh.receiveShadow = true;
    bottleGroup.add(glassMesh);

    // Inner Milk Geometry (slightly smaller)
    const milkPoints = [
      new THREE.Vector2(0, -1.96),
      new THREE.Vector2(0.81, -1.96),
      new THREE.Vector2(0.86, -1.86),
      new THREE.Vector2(0.86, 0.44),
      new THREE.Vector2(0.81, 0.61),
      new THREE.Vector2(0.61, 0.81),
      new THREE.Vector2(0.36, 1.11),
      new THREE.Vector2(0.31, 1.44),
      new THREE.Vector2(0, 1.44),
    ];
    const milkGeometry = new THREE.LatheGeometry(milkPoints, 64);
    const milkMaterial = new THREE.MeshStandardMaterial({
      color: 0xfcfcfc,
      roughness: 0.15,
      metalness: 0.02,
    });
    const milkMesh = new THREE.Mesh(milkGeometry, milkMaterial);
    bottleGroup.add(milkMesh);

    // Blue Premium Cap
    const capGeometry = new THREE.CylinderGeometry(0.38, 0.38, 0.25, 32);
    const capMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.2,
      metalness: 0.2,
    });
    const capMesh = new THREE.Mesh(capGeometry, capMaterial);
    capMesh.position.y = 2.05;
    capMesh.castShadow = true;
    bottleGroup.add(capMesh);

    // Paper Wrap Label with PARAG Branding Canvas Texture
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1024;
    labelCanvas.height = 512;
    const ctx = labelCanvas.getContext('2d');
    if (ctx) {
      // Pure White Label Base
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1024, 512);

      // Top Royal Blue Stripe
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(0, 20, 1024, 45);

      // Bottom Royal Blue Stripe
      ctx.fillRect(0, 447, 1024, 45);

      // Orange Accent Lines
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, 65, 1024, 12);
      ctx.fillRect(0, 435, 1024, 12);

      // Draw PARAG Brand Emblem and Text function
      const drawLabelSection = (centerX: number) => {
        // Orange Sunburst Circle (Parag Sun Emblem)
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(centerX, 210, 60, 0, Math.PI * 2);
        ctx.fill();

        // Inner Yellow Sun Core
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(centerX, 210, 42, 0, Math.PI * 2);
        ctx.fill();

        // Parag Sun Rays / Smile detail
        ctx.fillStyle = '#ea580c';
        ctx.font = '900 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('पराग', centerX, 210);

        // Bold "PARAG" Brand Title in English
        ctx.font = '900 82px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1e3a8a';
        ctx.fillText('PARAG', centerX, 310);

        // Subtitle "PURE & FRESH MILK"
        ctx.font = '800 24px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillStyle = '#ea580c';
        ctx.fillText('SEHAT KI DHARA • 100% PURE', centerX, 375);
      };

      // Draw on front (center 512) and wrapped back (0 and 1024)
      drawLabelSection(512);
      drawLabelSection(0);
      drawLabelSection(1024);
    }

    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.needsUpdate = true;
    labelTexture.wrapS = THREE.RepeatWrapping;
    labelTexture.wrapT = THREE.ClampToEdgeWrapping;

    const labelGeometry = new THREE.CylinderGeometry(0.91, 0.91, 1.2, 64, 1, true);
    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.3,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    labelMesh.position.y = -0.52;
    labelMesh.castShadow = true;
    bottleGroup.add(labelMesh);

    // 6. Dynamic Orbiting Liquid Milk Wave Ring (New 3D Animation Feature)
    const ringGeometry = new THREE.TorusGeometry(1.35, 0.07, 16, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.1,
    });
    const milkRingMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    milkRingMesh.rotation.x = Math.PI / 2.2;
    milkRingMesh.position.y = -1.1;
    scene.add(milkRingMesh);

    // Dynamic White Milk Splash Droplets
    const splashGroup = new THREE.Group();
    scene.add(splashGroup);

    const splashMaterial = new THREE.MeshStandardMaterial({
      color: 0xfcfcfc,
      roughness: 0.1,
      metalness: 0.05
    });

    const splashDrops: THREE.Mesh[] = [];
    const splashCount = 14;
    for (let i = 0; i < splashCount; i++) {
      const angle = (i / splashCount) * Math.PI * 2;
      const radius = 1.3 + Math.random() * 0.4;
      const size = 0.07 + Math.random() * 0.12;
      
      const dropGeom = new THREE.SphereGeometry(size, 16, 16);
      dropGeom.scale(1, 1.4, 1);

      const drop = new THREE.Mesh(dropGeom, splashMaterial);
      drop.position.x = Math.cos(angle) * radius;
      drop.position.y = -1.2 + (i / splashCount) * 2.2;
      drop.position.z = Math.sin(angle) * radius;
      
      splashGroup.add(drop);
      splashDrops.push(drop);
    }

    // 7. Floating particles (golden sparkles and micro-particles)
    const particleCount = 25;
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.85,
      roughness: 0.15
    });
    const whiteParticleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3
    });

    const particles: {
      mesh: THREE.Mesh;
      speed: number;
      offset: number;
      radius: number;
      yPos: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isGold = Math.random() > 0.6;
      const size = isGold ? 0.04 + Math.random() * 0.08 : 0.03 + Math.random() * 0.04;
      const geom = isGold ? new THREE.OctahedronGeometry(size, 0) : new THREE.SphereGeometry(size, 8, 8);
      const mesh = new THREE.Mesh(geom, isGold ? goldMaterial : whiteParticleMaterial);

      const radius = 1.8 + Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 5,
        Math.sin(angle) * radius
      );
      particlesGroup.add(mesh);

      particles.push({
        mesh,
        speed: 0.5 + Math.random() * 0.8,
        offset: Math.random() * 100,
        radius,
        yPos: mesh.position.y
      });
    }

    // 8. Interaction Parallax
    let targetX = 0;
    let targetY = 0;

    const onPointerMove = (event: PointerEvent) => {
      // Normalize to -1 to +1
      targetX = (event.clientX / window.innerWidth) * 2 - 1;
      targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('pointermove', onPointerMove);

    // 9. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();

      // Slow elegant rotation (360° continuously)
      bottleGroup.rotation.y = elapsedTime * 0.28 + targetX * 0.45;
      
      // Responsive vertical tilt and dynamic sway roll
      bottleGroup.rotation.x = THREE.MathUtils.lerp(
        bottleGroup.rotation.x,
        targetY * 0.25 + Math.cos(elapsedTime * 1.2) * 0.04,
        0.08
      );
      bottleGroup.rotation.z = Math.sin(elapsedTime * 1.5) * 0.05;

      // Inner liquid subtle slosh
      milkMesh.rotation.z = Math.sin(elapsedTime * 2.2) * 0.02;

      // Orbiting milk splash ring rotation & wave wobble
      milkRingMesh.rotation.z = elapsedTime * 0.6;
      milkRingMesh.rotation.y = Math.sin(elapsedTime * 1.4) * 0.25;
      milkRingMesh.position.y = -1.1 + Math.sin(elapsedTime * 1.8) * 0.12;

      // Elegant dynamic floating animation
      bottleGroup.position.y = Math.sin(elapsedTime * 1.4) * 0.16;
      bottleGroup.position.x = THREE.MathUtils.lerp(
        bottleGroup.position.x,
        targetX * 0.35,
        0.08
      );

      // Splash drops orbital dynamic waving & spinning
      splashDrops.forEach((drop, idx) => {
        const speedMultiplier = 0.45;
        const baseAngle = (idx / splashCount) * Math.PI * 2;
        const currentAngle = baseAngle + elapsedTime * speedMultiplier;
        const waveOffset = Math.sin(elapsedTime * 1.8 + idx) * 0.15;
        const dynamicRadius = 1.25 + waveOffset;

        drop.position.x = Math.cos(currentAngle) * dynamicRadius;
        drop.position.z = Math.sin(currentAngle) * dynamicRadius;
        
        // Add subtle waving vertical movement
        drop.position.y += Math.sin(elapsedTime * 2 + idx) * 0.0035;
      });

      // Micro particles drifting upwards
      particles.forEach((p) => {
        p.mesh.position.y += 0.005 * p.speed;
        
        // Horizontal orbit movement
        const currentAngle = elapsedTime * 0.15 * p.speed + p.offset;
        p.mesh.position.x = Math.cos(currentAngle) * p.radius;
        p.mesh.position.z = Math.sin(currentAngle) * p.radius;

        // Reset if drifted too high
        if (p.mesh.position.y > 3) {
          p.mesh.position.y = -3;
        }
      });

      // Render
      renderer.render(scene, camera);

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();
    setIsLoaded(true);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      width = container.clientWidth;
      height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      resizeObserver.disconnect();
      
      // Dispose resources
      glassGeometry.dispose();
      glassMaterial.dispose();
      milkGeometry.dispose();
      milkMaterial.dispose();
      capGeometry.dispose();
      capMaterial.dispose();
      labelGeometry.dispose();
      labelMaterial.dispose();
      labelTexture.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[320px] sm:h-[450px] lg:h-[500px] flex items-center justify-center bg-transparent overflow-hidden"
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {webglError ? (
        // Premium Fallback 2D Vector design in case of no WebGL support
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] bg-gradient-to-tr from-blue-400/20 to-emerald-400/10 rounded-full blur-3xl animate-pulse" />

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, type: 'spring', stiffness: 80 }}
            className="relative z-10 select-none cursor-pointer filter drop-shadow-2xl"
            whileHover={{ scale: 1.05 }}
          >
            <svg
              width="200"
              height="360"
              viewBox="0 0 200 360"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[140px] sm:w-[180px] h-auto drop-shadow-lg"
            >
              <defs>
                <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="40%" stopColor="#f3f4f6" stopOpacity="0.9" />
                  <stop offset="80%" stopColor="#e5e7eb" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#d1d5db" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="milkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f9fafb" />
                </linearGradient>
                <radialGradient id="capGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </radialGradient>
              </defs>

              {/* Glass Bottle Body Outline */}
              <path
                d="M75 30 L125 30 L125 60 C125 60, 165 95, 165 140 L165 330 C165 345, 150 355, 130 355 L70 355 C50 355, 35 345, 35 330 L35 140 C35 95, 75 60, 75 60 Z"
                fill="url(#glassGrad)"
                stroke="#cbd5e1"
                strokeWidth="2.5"
              />

              {/* Inner Fresh White Milk Liquid */}
              <path
                d="M37 150 L163 150 L163 328 C163 340, 150 352, 130 352 L70 352 C50 352, 37 340, 37 328 Z"
                fill="url(#milkGrad)"
              />

              {/* Shiny Glass Highlight Strip */}
              <path
                d="M50 150 L50 320"
                stroke="#ffffff"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Blue Cap */}
              <rect x="71" y="8" width="58" height="22" rx="4" fill="url(#capGlow)" />
              <line x1="71" y1="18" x2="129" y2="18" stroke="#2563eb" strokeWidth="2.5" />

              {/* Clean Paper Wrap Label */}
              <rect x="34.5" y="175" width="131" height="95" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              <rect x="34.5" y="185" width="131" height="8" fill="#1e40af" />
              <rect x="34.5" y="255" width="131" height="8" fill="#1e40af" />

              {/* Sun Logo & PARAG Text */}
              <circle cx="100" cy="210" r="14" fill="#ea580c" />
              <circle cx="100" cy="210" r="10" fill="#fbbf24" />
              <text x="100" y="238" textAnchor="middle" fill="#1e3a8a" fontSize="20" fontWeight="900" fontFamily="sans-serif">PARAG</text>
              <text x="100" y="249" textAnchor="middle" fill="#ea580c" fontSize="6.5" fontWeight="800" fontFamily="sans-serif">PURE & FRESH</text>
            </svg>

            {/* Golden floating award stars decoration */}
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute -right-6 top-8 text-amber-400 font-extrabold filter drop-shadow-md"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
          </motion.div>
        </div>
      ) : (
        // Standard interactive WebGL canvas
        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none"
        />
      )}
    </div>
  );
};
