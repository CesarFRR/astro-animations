import * as THREE from "three";

// ===== Capas internas de la Tierra (tajada de pastel con clipIntersection) =====
// Técnica del ejemplo oficial de three.js "webgl_clipping_intersection":
// tres planos ortogonales recortan una cuña ("tajada") de la esfera y dejan
// visible el resto (7/8 de la superficie). Por la tajada se ven las capas
// internas como rodajas macizas 3D, bien desde cualquier ángulo.
//
// Con clipIntersection=true se conserva la UNIÓN de los half-spaces positivos:
// dot(normal, p) + const >= 0. El hueco es la intersección de los half-spaces
// negativos: x<0 AND y<0 AND z<0, que es justo la dirección de la cámara
// inicial de tierra-capas ([1.4, 0.9, 2.6]).
//
// Radios reales (fracción del radio terrestre 6371 km):
//   núcleo interno 1221 km (0.19), núcleo externo 3480 km (0.55),
//   manto 6340 km (0.995), corteza 6371 km (1.0). La corteza se exagera
//   ligeramente para que sea visible.

const CAPAS = [
  { id: "nucleo-interno", nombre: "Núcleo interno", radio: 0.19, color: 0xffd777 },
  { id: "nucleo-externo", nombre: "Núcleo externo", radio: 0.55, color: 0xe8943a },
  { id: "manto", nombre: "Manto", radio: 0.93, color: 0x9a5a35 },
  { id: "corteza", nombre: "Corteza", radio: 0.995, color: 0x3f9d78 },
];

export function crearCapasTierra(contenedor, opts = {}) {
  const { radio = 1.2, corte = 0 } = opts;

  // Tres planos ortogonales con el hueco hacia la cámara inicial.
  const planos = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), corte),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), corte),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), corte),
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

// Aplica el recorte a un material (superficie, nubes, atmósfera) usando los
// mismos planos de las capas: la Tierra texturizada se "abre" sin ocultarse.
// Los ShaderMaterial custom (nubes, atmósfera) no pasan por el pipeline de
// clipping de three.js: reciben los planos como uniforms y recortan en el
// fragment shader con el mismo criterio de clipIntersection.
export function aplicarClipping(material, planos, activa) {
  if (material.uniforms && material.uniforms.uClipPlanes && material.uniforms.uClipActivo) {
    if (activa) {
      planos.forEach((p, i) => {
        material.uniforms.uClipPlanes.value[i].set(p.normal.x, p.normal.y, p.normal.z, p.constant);
      });
      material.uniforms.uClipActivo.value = 1.0;
    } else {
      material.uniforms.uClipActivo.value = 0.0;
    }
    return;
  }
  if (activa) {
    material.clippingPlanes = planos;
    material.clipIntersection = true;
  } else {
    material.clippingPlanes = null;
    material.clipIntersection = false;
  }
  material.needsUpdate = true;
}
