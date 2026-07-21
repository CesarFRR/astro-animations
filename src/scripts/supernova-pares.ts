import * as THREE from 'three';
import gsap from 'gsap';
import { Canvas3D } from '../lib/canvas3d';

// Supernova de Inestabilidad de Pares Animation
class SupernovaPares {
  private canvas: Canvas3D;
  private star: THREE.Mesh | null = null;
  private particles: THREE.Points | null = null;
  private core: THREE.Mesh | null = null;
  private timeline: gsap.core.Timeline;
  private progress: number = 0;
  
  constructor() {
    this.canvas = new Canvas3D('canvas-container', 'supernova-pares');
    this.timeline = gsap.timeline({ paused: true });
    
    this.init();
    this.createScene();
    this.setupTimeline();
  }
  
  private init() {
    this.canvas.addLight();
    
    // Add point light for dramatic effect
    const pointLight = new THREE.PointLight(0x4a9eff, 1, 100);
    pointLight.position.set(0, 0, 5);
    this.canvas.getScene().add(pointLight);
  }
  
  private createScene() {
    // Create star
    const starGeometry = new THREE.SphereGeometry(1, 64, 64);
    const starMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      wireframe: false
    });
    this.star = new THREE.Mesh(starGeometry, starMaterial);
    this.canvas.getScene().add(this.star);
    
    // Create core
    const coreGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.8
    });
    this.core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.canvas.getScene().add(this.core);
    
    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      // Random position in sphere
      const radius = Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
      
      // Color based on type (gamma, electron, positron)
      const type = Math.random();
      if (type < 0.33) {
        colors[i] = 1; colors[i + 1] = 0.84; colors[i + 2] = 0; // Gamma
      } else if (type < 0.66) {
        colors[i] = 0.29; colors[i + 1] = 0.62; colors[i + 2] = 1; // Electron
      } else {
        colors[i] = 1; colors[i + 1] = 0.42; colors[i + 2] = 0.21; // Positron
      }
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.canvas.getScene().add(this.particles);
  }
  
  private setupTimeline() {
    // Phase 1: Equilibrium (0-20%)
    this.timeline.to(this.star?.scale || {}, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1,
      ease: 'power2.inOut'
    }, 0);
    
    // Phase 2: Pair Production (20-40%)
    this.timeline.to(this.star?.material || {}, {
      color: 0xff6600,
      duration: 1,
      ease: 'power2.inOut'
    }, 2);
    
    // Phase 3: Collapse (40-60%)
    this.timeline.to(this.star?.scale || {}, {
      x: 0.5,
      y: 0.5,
      z: 0.5,
      duration: 1,
      ease: 'power2.in'
    }, 4);
    
    // Phase 4: Fusion (60-80%)
    this.timeline.to(this.star?.material || {}, {
      color: 0xffff00,
      duration: 0.5,
      ease: 'power2.out'
    }, 5);
    
    // Phase 5: Explosion (80-100%)
    this.timeline.to(this.star?.scale || {}, {
      x: 3,
      y: 3,
      z: 3,
      duration: 1,
      ease: 'power2.out'
    }, 6);
    
    this.timeline.to(this.star?.material || {}, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out'
    }, 6.5);
    
    // Animate particles outward
    this.timeline.to(this.particles?.position || {}, {
      x: 5,
      y: 5,
      z: 5,
      duration: 2,
      ease: 'power2.out'
    }, 6);
  }
  
  public update(progress: number) {
    this.progress = progress;
    this.timeline.progress(progress);
    
    // Update HUD
    this.updateHUD(progress);
  }
  
  private updateHUD(progress: number) {
    // Update phase title
    const phaseTitle = document.getElementById('phase-title');
    const phaseCaption = document.getElementById('phase-caption');
    
    if (progress < 0.2) {
      phaseTitle && (phaseTitle.textContent = 'Equilibrio');
      phaseCaption && (phaseCaption.textContent = 'La estrella sostiene sus capas gracias a la presión de radiación.');
    } else if (progress < 0.4) {
      phaseTitle && (phaseTitle.textContent = 'Pares e⁻e⁺');
      phaseCaption && (phaseCaption.textContent = 'Los rayos gamma se convierten en pares electrón-positrón.');
    } else if (progress < 0.6) {
      phaseTitle && (phaseTitle.textContent = 'Colapso');
      phaseCaption && (phaseCaption.textContent = 'Sin presión de radiación, la gravedad colapsa el núcleo.');
    } else if (progress < 0.8) {
      phaseTitle && (phaseTitle.textContent = 'Fusión');
      phaseCaption && (phaseCaption.textContent = 'El colapso provoca fusión nuclear descontrolada.');
    } else {
      phaseTitle && (phaseTitle.textContent = 'Explosión');
      phaseCaption && (phaseCaption.textContent = 'La estrella destruye completamente sin dejar remanente.');
    }
  }
  
  public start() {
    this.canvas.start((time: number) => {
      // Rotate star
      if (this.star) {
        this.star.rotation.y += 0.002;
      }
      
      // Animate particles
      if (this.particles) {
        this.particles.rotation.y += 0.001;
      }
    });
  }
  
  public dispose() {
    this.canvas.dispose();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const animation = new SupernovaPares();
  animation.start();
  
  // Connect to controller
  const checkController = setInterval(() => {
    if ((window as any).animationController) {
      const controller = (window as any).animationController;
      
      // Update animation based on controller progress
      const updateAnimation = () => {
        animation.update(controller.getProgress());
        requestAnimationFrame(updateAnimation);
      };
      updateAnimation();
      
      clearInterval(checkController);
    }
  }, 100);
});
