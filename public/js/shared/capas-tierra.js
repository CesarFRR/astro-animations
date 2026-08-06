import * as THREE from "three";

// ===== Capas internas de la Tierra (tajada de pastel con paredes sólidas) =====
//
// En lugar de esferas concéntricas recortadas (que se ven huecas por dentro),
// la tajada muestra tres PAREDES PLANAS SÓLIDAS: cada cara del octante que se
// recorta va desde el centro de la Tierra hasta la superficie, como una línea
// desde cada vértice del corte hasta el centro. Cada pared se divide en
// segmentos concéntricos que son las capas (núcleo interno, núcleo externo,
// manto y corteza), de modo que el interior se ve macizo, como una tajada de
// pastel.
//
// El hueco es el octante x>0, y>0, z>0 (en el espacio local). Con
// clipIntersection=true (unión de half-spaces) se descarta ese octante y se
// conserva el resto de la esfera; las paredes llenan las tres caras del hueco:
//   - pared en el plano x=0  → cuadrante y>0, z>0
//   - pared en el plano y=0  → cuadrante x>0, z>0
//   - pared en el plano z=0  → cuadrante x>0, y>0
//
// La orientación del hueco (hacia la cámara o el lado iluminado) la decide el
// explorador rotando el grupo con un quaternion.

const CAPAS = [
  { id: "nucleo-interno", nombre: "Núcleo interno", radio: 0.19, color: 0xffd777 },
  { id: "nucleo-externo", nombre: "Núcleo externo", radio: 0.55, color: 0xe8943a },
  { id: "manto", nombre: "Manto", radio: 0.93, color: 0x9a5a35 },
  { id: "corteza", nombre: "Corteza", radio: 1.0, color: 0x3f9d78 },
];

// Sector anular de 90° en el cuadrante positivo (ángulos 0..90°), en el plano
// XY, entre los radios r0 y r1.
function sectorAnular(r0, r1, segments = 64) {
  const a0 = 0;
  const a1 = Math.PI / 2;
  const shape = new THREE.Shape();
  for (let i = 0; i <= segments; i++) {
    const a = a0 + ((a1 - a0) * i) / segments;
    const p = new THREE.Vector2(Math.cos(a) * r1, Math.sin(a) * r1);
    if (i === 0) shape.moveTo(p.x, p.y);
    else shape.lineTo(p.x, p.y);
  }
  for (let i = segments; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / segments;
    const p = new THREE.Vector2(Math.cos(a) * r0, Math.sin(a) * r0);
    shape.lineTo(p.x, p.y);
  }
  shape.closePath();
  return shape;
}

export function crearCapasTierra(contenedor, opts = {}) {
  const { radio = 1.2 } = opts;

  // Tres planos ortogonales (espacio local): el hueco es x>0, y>0, z>0.
  // La constante es 0: los planos pasan por el centro de la Tierra.
  const planos = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
  ];

  // Radios de las capas como fracción del radio de la superficie.
  const radios = [0, ...CAPAS.map((c) => c.radio * radio)];

  const grupo = new THREE.Group();
  const porCapa = {}; // id -> [mesh por pared]
  CAPAS.forEach((c) => (porCapa[c.id] = []));

  const materialPared = (color) =>
    new THREE.MeshPhongMaterial({
      color,
      side: THREE.DoubleSide,
      emissive: color,
      emissiveIntensity: 0.25,
      specular: 0x222222,
      shininess: 10,
    });

  // Rotaciones para llevar el shape XY (cuadrante positivo) a cada pared:
  //   z=0 → identidad (ya es el plano XY, cuadrante x>0,y>0)
  //   y=0 → rotateX(+90°): (x,y)→(x,z), cuadrante x>0,z>0
  //   x=0 → rotateY(-90°): (x,y)→(z,y), cuadrante z>0,y>0
  const rotaciones = [null, (g) => g.rotateX(Math.PI / 2), (g) => g.rotateY(-Math.PI / 2)];

  rotaciones.forEach((rot) => {
    CAPAS.forEach((c, i) => {
      const geo = new THREE.ShapeGeometry(sectorAnular(radios[i], radios[i + 1]), 16);
      if (rot) rot(geo);
      const mesh = new THREE.Mesh(geo, materialPared(c.color));
      mesh.userData.capa = c.id;
      porCapa[c.id].push(mesh);
      grupo.add(mesh);
    });
  });

  grupo.visible = false;
  contenedor.add(grupo);

  return {
    grupo,
    planos,
    porCapa,
    CAPAS,
    setVisible(v) {
      grupo.visible = v;
    },
    setCapaVisible(id, v) {
      (porCapa[id] || []).forEach((m) => (m.visible = v));
    },
  };
}
