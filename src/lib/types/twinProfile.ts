import type { EgoId } from "@/lib/ego/types";
import type { Filosofo } from "@/lib/ego/talesWeights";
import type { GutData } from "@/lib/gut/types";

/** V10 §10.1 + DOC7_twin_profile_schema_v2.json */
export type TwinProfile = {
  twin_id: string;
  role: "owner" | "follower";
  owner_id?: string; // solo si role === "follower"
  owner_name: string;
  ego_id: EgoId | null;
  tales_weights: Record<Filosofo, number> | null;
  tales_data: Record<Filosofo, number>; // 0-1, crece con cada sesión
  gut_data: GutData;
  fidelity_score: number; // 0-1
  elevenlabs_voice_id: string | null;
  higgsfield_soul_id: string | null;
  tavus_replica_id: string | null;
  onboarding_status: { sesion_actual: "S1" | "S2" | "S3" | "completo"; respuestas: Record<string, number> };
  sources: {
    google: boolean;
    instagram: boolean;
    tiktok: boolean;
    whatsapp: boolean;
    wearables: boolean;
  };
  created_at: string;
  updated_at: string;
};

export function twinProfileVacio(params: {
  role: "owner" | "follower";
  ownerName: string;
  ownerId?: string;
}): TwinProfile {
  const now = new Date().toISOString();
  return {
    twin_id: crypto.randomUUID(),
    role: params.role,
    owner_id: params.ownerId,
    owner_name: params.ownerName,
    ego_id: null,
    tales_weights: null,
    tales_data: {
      "Demócrito": 0, "Sócrates": 0, "Aristóteles": 0, "Epicuro": 0, "Platón": 0,
      "Séneca": 0, "Gorgias": 0, "Heráclito": 0, "Homero": 0, "Kant": 1,
    },
    gut_data: {
      source: null,
      gut_baseline_score: null,
      bacterias_dominantes: [],
      bacterias_deficientes: [],
      gatillos: [],
      sintomas: [],
      n1_connected: false,
      n1_user_id: null,
      last_updated: null,
    },
    fidelity_score: 0,
    elevenlabs_voice_id: null,
    higgsfield_soul_id: null,
    tavus_replica_id: null,
    onboarding_status: { sesion_actual: "S1", respuestas: {} },
    sources: { google: false, instagram: false, tiktok: false, whatsapp: false, wearables: false },
    created_at: now,
    updated_at: now,
  };
}
