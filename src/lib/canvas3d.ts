import * as THREE from 'three';

export class Canvas3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private animationId: string;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  
  constructor(canvasId: string, animationId: string) {
    this.animationId = animationId;
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    
    if (!this.canvas) {
      throw new Error(`Canvas not found: ${canvasId}`);
    }
    
    // Scene
    this.scene = new THREE.Scene();
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clock
    this.clock = new THREE.Clock();
    
    // Handle resize
    window.addEventListener('resize', () => this.onResize());
  }
  
  public addLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
  }
  
  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  private animate(callback?: (time: number) => void) {
    this.animationFrameId = requestAnimationFrame(() => this.animate(callback));
    
    const time = this.clock.getElapsedTime();
    callback?.(time);
    
    this.renderer.render(this.scene, this.camera);
  }
  
  public start(callback?: (time: number) => void) {
    this.animate(callback);
  }
  
  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  public getScene() {
    return this.scene;
  }
  
  public getCamera() {
    return this.camera;
  }
  
  public getRenderer() {
    return this.renderer;
  }
  
  public render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  public dispose() {
    this.stop();
    this.renderer.dispose();
  }
}
