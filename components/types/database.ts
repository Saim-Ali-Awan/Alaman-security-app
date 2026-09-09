export type PointRow = {
  id: string;
  name: string;
  person_name: string;
  phone: string;
  created_at: string;
};

export type AttendanceRow = {
  id: string;
  point_id: string;
  guard_name: string;
  att_date: string;
  att_month: string;
  shift: string;
  guard_type: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      points: {
        Row: PointRow;
        Insert: {
          id?: string;
          name: string;
          person_name: string;
          phone: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          person_name?: string;
          phone?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance: {
        Row: AttendanceRow;
        Insert: {
          id?: string;
          point_id: string;
          guard_name: string;
          att_date: string;
          att_month: string;
          shift: string;
          guard_type: string;
          created_at?: string;
        };
        Update: {
          point_id?: string;
          guard_name?: string;
          att_date?: string;
          att_month?: string;
          shift?: string;
          guard_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};