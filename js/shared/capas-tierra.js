import * as THREE from "three";
// ===== Capas internas de la Tierra (recorte por plano de corte) =====
// La superficie texturizada y las esferas concéntricas se recortan con el
// MISMO plano de clipping: la Tierra con mares y continentes se "parte por
// la mitad" y las capas internas quedan visibles por dentro del corte.
// Radios reales (fracción del radio terrestre 6371 km):
//   núcleo interno 1221 km (0.19), núcleo externo 3480 km (0.55),
//   manto 6340 km (0.995), corteza 6371 km (1.0). La corteza se exagera
//   ligeramente para que sea visible.

const CAPAS = [
  { id: "nucleo-interno", nombre: "Núcleo interno", radio: 0.19, color: 0xffd777 },
  { id: "nucleo-externo", nombre: "Núcleo externo", radio: 0.55, color: 0xe8943a },
  { id: "manto", nombre: "Manto", radio: 0.95, color: 0x9a5a35 },
  { id: "corteza", nombre: "Corteza", radio: 0.995, color: 0x3f9d78 },
];

export function crearCapasTierra(contenedor, opts = {}) {
  const { radio = 1.2, normal = new THREE.Vector3(1, 0, 0), corte = 0 } = opts;

  // Un solo plano de corte (sagital). Con clipIntersection se conserva la
  // porción de la esfera que está "detrás" del plano; el resto desaparece y
  // deja ver el interior. El plano se aplica a superficie y capas por igual.
  const planos = [new THREE.Plane(normal.clone().normalize(), corte)];

  const grupo = new THREE.Group();
  const meshes = {};

  CAPAS.forEach((c) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radio * c.radio, 96, 64),
      new THREE.MeshPhongMaterial({
        color: c.color,
        side: THREE.DoubleSide,
        specular: 0x222222,
        shininess: 12,
        clippingPlanes: planos,
        clipIntersection: true,
      })
    );
    mesh.userData.capa = c.id;
    meshes[c.id] = mesh;
    grupo.add(mesh);
  });

  grupo.visible = false;
  contenedor.add(grupo);

  return {
    grupo,
    meshes,
    planos,
    CAPAS,
    setVisible(v) {
      grupo.visible = v;
    },
    setCapaVisible(id, v) {
      if (meshes[id]) meshes[id].visible = v;
    },
    // Constante común de los tres planos: mueve la profundidad del corte.
    setCorte(c) {
      planos.forEach((p) => (p.constant = c));
    },
  };
}

// Aplica el recorte a un material exterior (superficie, nubes) usando los
// mismos planos de las capas: la Tierra texturizada se "abre" sin ocultarse.
export function aplicarClipping(material, planos, activa) {
  if (activa) {
    material.clippingPlanes = planos;
    material.clipIntersection = true;
  } else {
    material.clippingPlanes = null;
    material.clipIntersection = false;
  }
  material.needsUpdate = true;
}
