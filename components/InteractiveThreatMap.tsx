import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function InteractiveThreatMap(): React.ReactElement {
    const mountRef = useRef<HTMLDivElement>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount || typeof THREE === 'undefined') return;

        let animationFrameId: number;
        let renderer: THREE.WebGLRenderer;
        
        try {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
            camera.position.z = 8;

            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            currentMount.innerHTML = '';
            currentMount.appendChild(renderer.domElement);

            const group = new THREE.Group();
            scene.add(group);

            // Core Orb
            const coreGeometry = new THREE.IcosahedronGeometry(2, 4);
            const coreMaterial = new THREE.MeshPhongMaterial({
                color: 0x9F54FF,
                emissive: 0x00D4FF,
                shininess: 80,
                specular: 0x111111,
            });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            group.add(core);

            // Wireframe
            const wireframeGeo = new THREE.IcosahedronGeometry(2.01, 4);
            const wireframeMat = new THREE.MeshBasicMaterial({ color: 0x00D4FF, wireframe: true, transparent: true, opacity: 0.2 });
            const wireframe = new THREE.Mesh(wireframeGeo, wireframeMat);
            group.add(wireframe);
            
            // Particle field
            const particlesGeometry = new THREE.BufferGeometry();
            const particlesCnt = 5000;
            const posArray = new Float32Array(particlesCnt * 3);
            for (let i = 0; i < particlesCnt * 3; i++) {
                posArray[i] = (Math.random() - 0.5) * 25;
            }
            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            const particlesMaterial = new THREE.PointsMaterial({
                size: 0.025,
                color: 0x00D4FF,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
            });
            const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
            scene.add(particleMesh);
            
            // Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);
            const pointLight = new THREE.PointLight(0x00D4FF, 1.5, 20);
            pointLight.position.set(-5, 3, -5);
            scene.add(pointLight);


            const onMouseMove = (event: MouseEvent) => {
                mousePos.current.x = (event.clientX / window.innerWidth) - 0.5;
                mousePos.current.y = (event.clientY / window.innerHeight) - 0.5;
            };
            window.addEventListener('mousemove', onMouseMove);

            
            const clock = new THREE.Clock();
            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                const elapsedTime = clock.getElapsedTime();

                core.scale.set(
                    1 + Math.sin(elapsedTime * 1.5) * 0.03,
                    1 + Math.sin(elapsedTime * 1.5) * 0.03,
                    1 + Math.sin(elapsedTime * 1.5) * 0.03
                );
                
                wireframe.rotation.y += 0.001;
                wireframe.rotation.x += 0.0005;

                particleMesh.rotation.y = elapsedTime * 0.03;
                
                group.rotation.y += (mousePos.current.x * 0.3 - group.rotation.y) * 0.05;
                group.rotation.x += (mousePos.current.y * 0.3 - group.rotation.x) * 0.05;

                renderer.render(scene, camera);
            };
            animate();

            const handleResize = () => {
                if (!currentMount) return;
                camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            };
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('mousemove', onMouseMove);
                if(animationFrameId) cancelAnimationFrame(animationFrameId);
                if (currentMount && renderer.domElement) {
                    currentMount.removeChild(renderer.domElement);
                }
                renderer.dispose();
            };
        } catch (error) {
            console.error("Error setting up Three.js animation:", error);
        }
    }, []);
    
    return (
        <section className="relative h-[650px] w-full bg-light-secondary dark:bg-dark-secondary flex flex-col items-center justify-center text-center px-6 overflow-hidden">
             <div ref={mountRef} className="absolute inset-0 z-0" />
             <div className="relative z-10 max-w-3xl mx-auto">
                 <h2 className="text-4xl md:text-5xl font-bold text-dark-text dark:text-white font-heading animate-fade-in-up">The Sentinel Core</h2>
                 <p className="mt-4 text-lg text-medium-dark-text dark:text-medium-text max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms', lineHeight: 1.7 }}>
                    A new dimension of code intelligence. Our AI builds a dynamic, contextual model of your codebase to uncover vulnerabilities that lie deep within its structure.
                 </p>
             </div>
        </section>
    );
}