export type Landmark = { x: number; y: number; z?: number; visibility?: number };

export type JointName =
  | "knee_left"
  | "knee_right"
  | "hip_left"
  | "hip_right"
  | "elbow_left"
  | "elbow_right"
  | "shoulder_left"
  | "shoulder_right"
  | "back_angle"
  | "spine_frontal_tilt"
  | "spine_lateral_tilt"
  | "cervical_alignment"
  | "lateral_symmetry_pct";

export type JointTargets = Partial<Record<JointName, [number, number]>>;

/** "ok"/"deviation" — el color exacto en pantalla (amarillo/rojo) lo decide la UI, no este nombre. */
export type JointStatus = "ok" | "deviation";

export type JointDeviation = { angle: number; target: [number, number]; status: JointStatus };

/**
 * Índices del modelo MediaPipe Pose (33 landmarks) — mismo orden en
 * PoseLandmarkerResult.landmarks[0] que devuelve @mediapipe/tasks-vision.
 * https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
 */
const IDX = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;

/**
 * MediaPipe siempre devuelve los 33 landmarks, incluso para partes del
 * cuerpo fuera de encuadre — para esos casos "inventa" una posición
 * extrapolada con `visibility` muy baja en vez de omitirla. Sin este
 * filtro, el coach corregía la rodilla o la cadera aunque el alumno
 * estuviera solo de torso para arriba en cámara.
 */
const MIN_VISIBILITY = 0.5;

function visible(lm?: Landmark): boolean {
  return !!lm && (lm.visibility === undefined || lm.visibility >= MIN_VISIBILITY);
}

function allVisible(...lms: Array<Landmark | undefined>): boolean {
  return lms.every(visible);
}

function midpoint(a: Landmark, b: Landmark): Landmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: a.z !== undefined && b.z !== undefined ? (a.z + b.z) / 2 : undefined };
}

/** Ángulo en grados en el vértice `b`, usando solo el plano x/y de la imagen. */
export function angleBetween(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);
  if (magAB === 0 || magCB === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Inclinación en grados del vector `from`→`to` respecto a la vertical (0° = perfectamente vertical, 90° = horizontal). */
function tiltFromVertical(from: Landmark, to: Landmark, horizontalAxis: "x" | "z"): number {
  const horiz = horizontalAxis === "x" ? to.x - from.x : (to.z ?? 0) - (from.z ?? 0);
  const vert = to.y - from.y;
  return (Math.abs(Math.atan2(horiz, vert)) * 180) / Math.PI;
}

/** Diferencia porcentual entre dos ángulos (simetría lateral), 0-100. */
function pctDiff(a?: number, b?: number): number | undefined {
  if (a === undefined || b === undefined) return undefined;
  const denom = Math.max(a, b, 1e-6);
  return (Math.abs(a - b) / denom) * 100;
}

/** Calcula el set fijo de ángulos articulares a partir de los 33 landmarks de MediaPipe Pose. */
export function computeJointAngles(landmarks: Landmark[]): Partial<Record<JointName, number>> {
  const get = (i: number) => landmarks[i];
  const angles: Partial<Record<JointName, number>> = {};

  const lHip = get(IDX.leftHip);
  const rHip = get(IDX.rightHip);
  const lKnee = get(IDX.leftKnee);
  const rKnee = get(IDX.rightKnee);
  const lAnkle = get(IDX.leftAnkle);
  const rAnkle = get(IDX.rightAnkle);
  const lShoulder = get(IDX.leftShoulder);
  const rShoulder = get(IDX.rightShoulder);
  const lElbow = get(IDX.leftElbow);
  const rElbow = get(IDX.rightElbow);
  const lWrist = get(IDX.leftWrist);
  const rWrist = get(IDX.rightWrist);

  if (allVisible(lHip, lKnee, lAnkle)) angles.knee_left = angleBetween(lHip, lKnee, lAnkle);
  if (allVisible(rHip, rKnee, rAnkle)) angles.knee_right = angleBetween(rHip, rKnee, rAnkle);
  if (allVisible(lShoulder, lHip, lKnee)) angles.hip_left = angleBetween(lShoulder, lHip, lKnee);
  if (allVisible(rShoulder, rHip, rKnee)) angles.hip_right = angleBetween(rShoulder, rHip, rKnee);
  if (allVisible(lShoulder, lElbow, lWrist)) angles.elbow_left = angleBetween(lShoulder, lElbow, lWrist);
  if (allVisible(rShoulder, rElbow, rWrist)) angles.elbow_right = angleBetween(rShoulder, rElbow, rWrist);
  if (allVisible(lElbow, lShoulder, lHip)) angles.shoulder_left = angleBetween(lElbow, lShoulder, lHip);
  if (allVisible(rElbow, rShoulder, rHip)) angles.shoulder_right = angleBetween(rElbow, rShoulder, rHip);

  // Espalda: ángulo hombro-cadera-rodilla promediado entre lado izq/der (aproximación de la línea de la espalda).
  if (angles.hip_left !== undefined && angles.hip_right !== undefined) {
    angles.back_angle = (angles.hip_left + angles.hip_right) / 2;
  } else if (angles.hip_left !== undefined) {
    angles.back_angle = angles.hip_left;
  } else if (angles.hip_right !== undefined) {
    angles.back_angle = angles.hip_right;
  }

  // Columna: inclinación del vector cadera-media→hombro-medio respecto a la vertical.
  // Frontal (izq/der) usa x; lateral (adelante/atrás) usa z como proxy de profundidad de MediaPipe.
  if (allVisible(lHip, rHip, lShoulder, rShoulder)) {
    const midHip = midpoint(lHip, rHip);
    const midShoulder = midpoint(lShoulder, rShoulder);
    angles.spine_frontal_tilt = tiltFromVertical(midHip, midShoulder, "x");
    angles.spine_lateral_tilt = tiltFromVertical(midHip, midShoulder, "z");

    const nose = get(IDX.nose);
    if (visible(nose)) angles.cervical_alignment = angleBetween(nose, midShoulder, midHip);
  }

  // Simetría lateral: diferencia % media entre rodilla/cadera/codo izq vs der.
  const simetrias = [pctDiff(angles.knee_left, angles.knee_right), pctDiff(angles.hip_left, angles.hip_right), pctDiff(angles.elbow_left, angles.elbow_right)].filter(
    (v): v is number => v !== undefined
  );
  if (simetrias.length > 0) angles.lateral_symmetry_pct = simetrias.reduce((a, b) => a + b, 0) / simetrias.length;

  return angles;
}

/** Compara los ángulos calculados contra los rangos objetivo configurados por el coach para el ejercicio activo. */
export function evaluateDeviations(
  angles: Partial<Record<JointName, number>>,
  jointTargets: JointTargets
): Partial<Record<JointName, JointDeviation>> {
  const result: Partial<Record<JointName, JointDeviation>> = {};
  for (const joint of Object.keys(angles) as JointName[]) {
    const angle = angles[joint];
    const target = jointTargets[joint];
    if (angle === undefined || !target) continue;
    const [min, max] = target;
    result[joint] = { angle, target, status: angle >= min && angle <= max ? "ok" : "deviation" };
  }
  return result;
}
