import * as THREE from "three";

// ===== Capas internas de la Tierra (técnica clipIntersection de three.js) =====
// Esferas concéntricas recortadas por planos de clipping: solo se dibuja la
// porción dentro de todos los planos, revelando la sección interior.
// Radios reales (fracción del radio terrestre 6371 km):
//   núcleo interno 1221 km (0.19), núcleo externo 3480 km (0.55),
//   manto 6340 km (0.995), corteza 6371 km (1.0). La corteza se exagera
//   ligeramente para que sea visible.

const CAPAS = [
  { id: "nucleo-interno", nombre: "Núcleo interno", radio: 0.19, color: 0xffd777 },
  { id: "nucleo-externo", nombre: "Núcleo externo", radio: 0.55, color: 0xe8943a },
  { id: "manto", nombre: "Manto", radio: 0.93, color: 0x9a5a35 },
  { id: "corteza", nombre: "Corteza", radio: 1.0, color: 0x3f9d78 },
];

export function crearCapasTierra(contenedor, opts = {}) {
  const { radio = 1.2 } = opts;

  // Tres planos ortogonales: la sección visible queda dentro de todos
  // (clipIntersection), como el octante del ejemplo oficial de three.js.
  const planos = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
  ];

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
