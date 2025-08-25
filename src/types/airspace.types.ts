export interface AirspaceZone {
  id: string;
  name: string;
  type: AirspaceType;
  coordinates: [number, number][]; // polygon coordinates
  altitudeLimits: AltitudeLimits;
  timeRestrictions?: TimeRestriction[];
  description: string;
  authority: string;
  isActive: boolean;
  severity: SeverityLevel;
}

export interface DangerArea extends AirspaceZone {
  type: 'danger';
  hazardType: HazardType;
  riskLevel: RiskLevel;
}

export interface RestrictedArea extends AirspaceZone {
  type: 'restricted';
  restrictionType: RestrictionType;
  permitRequired: boolean;
  contactInfo?: string;
}

export interface MilitaryExerciseArea extends AirspaceZone {
  type: 'military';
  exerciseType: ExerciseType;
  exerciseName: string;
  scheduledStart: string;
  scheduledEnd: string;
  participatingUnits: string[];
}

export interface AltitudeLimits {
  lower: number; // feet MSL
  upper: number; // feet MSL
  reference: 'MSL' | 'AGL' | 'FL';
}

export interface TimeRestriction {
  startTime: string;
  endTime: string;
  daysOfWeek: number[]; // 0-6, Sunday = 0
  timezone: string;
}

export type AirspaceType = 
  | 'danger' 
  | 'restricted' 
  | 'military' 
  | 'prohibited' 
  | 'temporary';

export type HazardType = 
  | 'artillery' 
  | 'missile' 
  | 'aircraft' 
  | 'parachute' 
  | 'laser' 
  | 'unmanned_aircraft' 
  | 'other';

export type RestrictionType = 
  | 'government' 
  | 'military' 
  | 'security' 
  | 'environmental' 
  | 'noise_sensitive' 
  | 'wildlife';

export type ExerciseType = 
  | 'air_combat' 
  | 'ground_support' 
  | 'training' 
  | 'joint_exercise' 
  | 'live_fire';

export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';
export type SeverityLevel = 'info' | 'warning' | 'danger' | 'critical';

export interface AirspaceFilter {
  types?: AirspaceType[];
  severityLevels?: SeverityLevel[];
  activeOnly?: boolean;
  altitudeRange?: {
    min: number;
    max: number;
  };
  timeRange?: {
    start: string;
    end: string;
  };
}
