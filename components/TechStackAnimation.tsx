import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

// SVG path data for logos.
const SVG_DATA = {
    python: 'M12 24c-5.83-3.15-5.02-14.34 1.45-16.14C23.36 4.9 22.42 21.03 12 24zM4.7 13.54C2.2 13.29.3 11.23.05 8.73c-.2-2.14 1.35-4.32 3.45-5.02s4.32.3 5.02 2.4c.7 2.1-.3 4.62-2.4 5.33-1.45.4-2.92.5-4.42.1zM10.55 3.23c-1.8-.4-3.45.95-3.85 2.75-.4 1.8.95 3.45 2.75 3.85 1.8.4 3.45-.95 3.85-2.75s-.95-3.45-2.75-3.85zM19.3 10.46c2.5.25 4.4 2.31 4.65 4.81.2 2.14-1.35 4.32-3.45 5.02s-4.32-.3-5.02-2.4c-.7-2.1.3-4.62 2.4-5.33 1.45-.4 2.92-.5 4.42-.1zM13.45 20.77c1.8.4 3.45-.95 3.85-2.75s-.95-3.45-2.75-3.85-3.45.95-3.85 2.75c-.4 1.8.95 3.45 2.75 3.85z',
    react: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-4.02-8.225c.045-.48.243-.92.56-1.27.32-.35.74-.585 1.22-.645.48-.06.96.03 1.39.24.43.21.78.54 1.02.945.24-.405.59-.735 1.02-.945s.91-.3 1.39-.24c.48.06.9.295 1.22.645s.515.79.56 1.27.045.48-.06.975-.29 1.41-.23.435-.58.78-1.01.99-.43.21-.91.27-1.39.18-.48-.09-.9-.345-1.22-.72-.32.375-.74.63-1.22.72-.48.09-.96.03-1.39-.18s-.78-.555-1.01-.99c-.23-.435-.335-.93-.29-1.41zm1.78 1.59c.14.255.35.45.6.56.25.11.51.135.77.075.26-.06.49-.21.67-.42.18-.21.29-.48.31-.765.02-.285-.04-.57-.17-.81-.13-.24-.32-.42-.56-.54s-.5-.165-.77-.105c-.27.06-.5.21-.68.42-.18.21-.29.48-.31.75-.02.27.04.54.17.78.13.24.32.42.56.54zm5.48 0c.14.255.35.45.6.56.25.11.51.135.77.075.26-.06.49-.21.67-.42.18-.21.29-.48.31-.765.02-.285-.04-.57-.17-.81-.13-.24-.32-.42-.56-.54s-.5-.165-.77-.105c-.27.06-.5.21-.68.42-.18.21-.29.48-.31.75-.02.27.04.54.17.78.13.24.32.42.56.54z',
    node: 'M12.365 24l-6.208-3.59L0 16.825V7.175L6.157 3.59 12.365 0l6.208 3.59 6.157 3.585v9.65l-6.157 3.585zM6.62 19.39l5.51 3.187 5.51-3.188V8.197L12.13 5.01 6.62 8.197zM12.13 1.1l-5.27 3.05 5.27 3.048 5.27-3.048z',
    aws: 'M11.996 9.488c2.472 0 4.14-1.218 4.14-3.564 0-2.28-1.572-3.552-4.05-3.552-3.132 0-5.184 2.184-5.184 5.328 0 2.52 1.5 4.02 3.864 4.02.828 0 1.524-.264 2.1-.732l-1.032-1.464c-.456.396-.924.564-1.356.564-1.128 0-1.848-.9-1.848-2.184 0-1.788 1.284-3.54 3.228-3.54 1.284 0 2.088.744 2.088 2.04 0 1.236-.6 1.764-1.644 1.764h-.888l3.492 5.244h2.244L11.996 9.488zm9.528 8.652c.264.408.432.864.432 1.416 0 1.344-.948 2.304-2.52 2.304-1.584 0-2.556-.96-2.556-2.304 0-1.344.972-2.304 2.556-2.304.78 0 1.44.3 1.944.828l.456-.636c-.636-.684-1.584-1.092-2.568-1.092-2.424 0-4.116 1.632-4.116 4.2 0 2.58 1.692 4.212 4.116 4.212 2.412 0 4.104-1.632 4.104-4.212 0-.84-.228-1.584-.66-2.268l-1.188 1.152zM4.148 21.84c.324.432.54.9.54 1.464 0 1.356-1.008 2.328-2.616 2.328C.488 25.632 0 24.588 0 23.304c0-1.356.984-2.328 2.58-2.328.792 0 1.464.324 2.004.864l.324-.624c-.66-.672-1.62-1.092-2.604-1.092C-.628 20.124.964 21.78.964 24.3c0 2.592 1.692 4.224 4.164 4.224 2.424 0 4.14-1.644 4.14-4.236 0-.84-.24-1.584-.684-2.268L4.148 21.84z',
    docker: 'M23.39 9.61c-.32-.29-.77-.43-1.25-.43h-2.8v-2.5c0-.48-.14-.91-.43-1.25-.29-.34-.72-.45-1.25-.45h-2.54V2.85c0-.48-.14-.91-.43-1.25S14.36 1.15 13.88 1.15h-2.54V.58c0-.48-.14-.91-.43-1.25S10.59-.5 10.11-.5H4.11c-.48 0-.91.14-1.25.43C2.52-.36 2.38 0 2.38.48v15.63c.29.82.91 1.44 1.74 1.74.82.29 1.71.14 2.4-.4l.29-.2c.4-.29.88-.48 1.41-.55.51-.07 1.02 0 1.5.2.48.21.88.55 1.17.99.29.45.43.94.43 1.47v.36c0 .37.11.7.3 1 .19.29.48.48.8.6.34.11.67.14.99.14.29 0 .59-.04.88-.11.4-.11.74-.3 1-.6.25-.29.38-.62.38-1v-.36c0-.52.14-1 .43-1.41.29-.42.7-.7 1.17-.88.48-.18.96-.2 1.45-.14.49.06.94.25 1.35.54l.33.26c.69.53 1.57.67 2.4.39.82-.29 1.44-.91 1.74-1.74V12.1c0-.62-.2-1.2-.6-1.7l-.33.34zM16 11.49h-2.54v-2.54H16v2.54zm-4.79 0H8.67v-2.54h2.54v2.54zm4.79-4.79H13.4v-2.54h2.6c.48 0 .91.14 1.25.43.34.29.45.72.45 1.25v.86h-1.71zM8.67 9.27V6.73h2.54v2.54H8.67zm4.79 4.79H11.2v-2.54h2.26v2.54zm0 2.8h-2.26v-2.54H13.46v2.54zm4.79-2.8h-2.54V9.27h2.54c.48 0 .91.14 1.25.43.34.29.45.72.45 1.25v.86h-1.71z',
    github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297z'
};

const TechStackAnimation: React.FC = () => {
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
            camera.position.z = 12;

            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            currentMount.innerHTML = '';
            currentMount.appendChild(renderer.domElement);
            
            const group = new THREE.Group();
            scene.add(group);

            const centerGeometry = new THREE.IcosahedronGeometry(2, 1);
            const centerMaterial = new THREE.MeshPhongMaterial({ color: 0x9F54FF, emissive: 0x00D4FF, shininess: 50, specular: 0x111111, flatShading: true });
            const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
            group.add(centerMesh);

            const loader = new SVGLoader();
            const iconMeshes: THREE.Group[] = [];
            const techKeys = Object.keys(SVG_DATA);

            techKeys.forEach((key, i) => {
                const svgMarkup = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="${(SVG_DATA as any)[key]}"/></svg>`;
                const data = loader.parse(svgMarkup);
                const paths = data.paths;
                const iconGroup = new THREE.Group();
                
                for (let j = 0; j < paths.length; j++) {
                    const path = paths[j];
                    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, depthWrite: false });
                    const shapes = SVGLoader.createShapes(path);
                    for (let k = 0; k < shapes.length; k++) {
                        const shape = shapes[k];
                        const geometry = new THREE.ShapeGeometry(shape);
                        const mesh = new THREE.Mesh(geometry, material);
                        iconGroup.add(mesh);
                    }
                }

                const scale = 0.03;
                iconGroup.scale.set(scale, -scale, scale);
                iconGroup.position.set(-0.7, 0.7, 0);

                const pivot = new THREE.Group();
                pivot.add(iconGroup);
                group.add(pivot);

                const angle = (i / techKeys.length) * Math.PI * 2;
                const radius = 6;
                pivot.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 4, Math.sin(angle) * radius);
                iconMeshes.push(pivot);
            });

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            scene.add(ambientLight);
            const pointLight1 = new THREE.PointLight(0x00D4FF, 1);
            pointLight1.position.set(10, 10, 10);
            scene.add(pointLight1);

            const onMouseMove = (event: MouseEvent) => {
                mousePos.current.x = (event.clientX / window.innerWidth) - 0.5;
                mousePos.current.y = (event.clientY / window.innerHeight) - 0.5;
            };
            window.addEventListener('mousemove', onMouseMove);

            const clock = new THREE.Clock();
            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                const elapsedTime = clock.getElapsedTime();

                group.rotation.y += (mousePos.current.x * 0.5 - group.rotation.y) * 0.05 + 0.001;
                group.rotation.x += (mousePos.current.y * 0.5 - group.rotation.x) * 0.05;

                centerMesh.rotation.x += 0.005;
                centerMesh.rotation.y += 0.005;

                iconMeshes.forEach((pivot, i) => {
                    const angle = (i / techKeys.length) * Math.PI * 2 + elapsedTime * 0.3;
                    const radius = 6;
                    pivot.position.x = Math.cos(angle) * radius;
                    pivot.position.z = Math.sin(angle) * radius;
                    pivot.lookAt(camera.position);
                });

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
                cancelAnimationFrame(animationFrameId);
                if (currentMount && renderer.domElement) {
                    currentMount.removeChild(renderer.domElement);
                }
                renderer.dispose();
            };
        } catch (error) {
            console.error("Error setting up Three.js animation:", error);
            // This try-catch block prevents the entire application from crashing if the
            // complex 3D animation fails to initialize, for instance due to a malformed
            // SVG path or a WebGL issue.
        }
    }, []);

    return <div ref={mountRef} className="absolute inset-0 z-0" />;
};

export default TechStackAnimation;