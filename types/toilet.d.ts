export interface Toilet {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;

  // 새 필드들
  category?: string | null;
  phone?: string | null;
  open_time?: string | null;
  male_toilet?: string | null;
  female_toilet?: string | null;
  male_disabled?: string | null;
  female_disabled?: string | null;
  male_child?: string | null;
  female_child?: string | null;
  emergency_bell?: boolean | null;
  cctv?: boolean | null;
  baby_change?: boolean | null;
}
