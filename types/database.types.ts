export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          accion: string
          antes: Json | null
          created_at: string
          despues: Json | null
          id: number
          motivo: string | null
          registro_id: string | null
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          antes?: Json | null
          created_at?: string
          despues?: Json | null
          id?: never
          motivo?: string | null
          registro_id?: string | null
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          antes?: Json | null
          created_at?: string
          despues?: Json | null
          id?: never
          motivo?: string | null
          registro_id?: string | null
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_temporada: {
        Row: {
          categoria: string
          jugador_id: string
          origen: string
          temporada_id: number
        }
        Insert: {
          categoria: string
          jugador_id: string
          origen: string
          temporada_id: number
        }
        Update: {
          categoria?: string
          jugador_id?: string
          origen?: string
          temporada_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "categorias_temporada_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_temporada_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
        ]
      }
      consentimientos: {
        Row: {
          concedido: boolean
          documento_id: string | null
          id: number
          perfil_id: string
          registrado_at: string
          tipo: string
        }
        Insert: {
          concedido: boolean
          documento_id?: string | null
          id?: never
          perfil_id: string
          registrado_at?: string
          tipo: string
        }
        Update: {
          concedido?: boolean
          documento_id?: string | null
          id?: never
          perfil_id?: string
          registrado_at?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "consentimientos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_legales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consentimientos_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos: {
        Row: {
          consentimiento_at: string
          created_at: string
          documento_privacidad_id: string | null
          email: string
          estado: string
          id: string
          mensaje: string
          nombre: string
          notas_internas: string | null
          perfil_id: string | null
          respondida_at: string | null
          tipo: string
        }
        Insert: {
          consentimiento_at: string
          created_at?: string
          documento_privacidad_id?: string | null
          email: string
          estado?: string
          id?: string
          mensaje: string
          nombre: string
          notas_internas?: string | null
          perfil_id?: string | null
          respondida_at?: string | null
          tipo: string
        }
        Update: {
          consentimiento_at?: string
          created_at?: string
          documento_privacidad_id?: string | null
          email?: string
          estado?: string
          id?: string
          mensaje?: string
          nombre?: string
          notas_internas?: string | null
          perfil_id?: string | null
          respondida_at?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "contactos_documento_privacidad_id_fkey"
            columns: ["documento_privacidad_id"]
            isOneToOne: false
            referencedRelation: "documentos_legales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactos_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cuadros: {
        Row: {
          categoria: string
          estado: string
          generado_at: string | null
          participantes: string[]
          prueba_id: string
        }
        Insert: {
          categoria: string
          estado?: string
          generado_at?: string | null
          participantes?: string[]
          prueba_id: string
        }
        Update: {
          categoria?: string
          estado?: string
          generado_at?: string | null
          participantes?: string[]
          prueba_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuadros_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "pruebas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_legales: {
        Row: {
          contenido: string
          id: string
          publicado_at: string
          tipo: string
          titulo: string
          version: number
          vigente: boolean
        }
        Insert: {
          contenido: string
          id?: string
          publicado_at?: string
          tipo: string
          titulo: string
          version: number
          vigente?: boolean
        }
        Update: {
          contenido?: string
          id?: string
          publicado_at?: string
          tipo?: string
          titulo?: string
          version?: number
          vigente?: boolean
        }
        Relationships: []
      }
      inscripciones: {
        Row: {
          categoria: string
          checkin_at: string | null
          checkin_token: string
          created_at: string
          cuadro: string | null
          estado: string
          id: string
          jugador_1: string
          jugador_2: string | null
          prueba_id: string
        }
        Insert: {
          categoria: string
          checkin_at?: string | null
          checkin_token?: string
          created_at?: string
          cuadro?: string | null
          estado?: string
          id?: string
          jugador_1: string
          jugador_2?: string | null
          prueba_id: string
        }
        Update: {
          categoria?: string
          checkin_at?: string | null
          checkin_token?: string
          created_at?: string
          cuadro?: string | null
          estado?: string
          id?: string
          jugador_1?: string
          jugador_2?: string | null
          prueba_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_jugador_1_fkey"
            columns: ["jugador_1"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_jugador_2_fkey"
            columns: ["jugador_2"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_prueba_id_categoria_fkey"
            columns: ["prueba_id", "categoria"]
            isOneToOne: false
            referencedRelation: "prueba_categorias"
            referencedColumns: ["prueba_id", "categoria"]
          },
          {
            foreignKeyName: "inscripciones_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "pruebas"
            referencedColumns: ["id"]
          },
        ]
      }
      noticias: {
        Row: {
          autor_id: string | null
          categoria: string
          contenido: string
          created_at: string
          id: string
          imagen_url: string | null
          publicada: boolean
          publicada_at: string | null
          resumen: string
          slug: string
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id?: string | null
          categoria: string
          contenido: string
          created_at?: string
          id?: string
          imagen_url?: string | null
          publicada?: boolean
          publicada_at?: string | null
          resumen: string
          slug: string
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string | null
          categoria?: string
          contenido?: string
          created_at?: string
          id?: string
          imagen_url?: string | null
          publicada?: boolean
          publicada_at?: string | null
          resumen?: string
          slug?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "noticias_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partidos: {
        Row: {
          categoria: string
          cuadro: string | null
          duracion_min: number | null
          fase: string
          fin: string | null
          formato: string
          ganador_id: string | null
          grupo: string | null
          id: string
          inicio: string | null
          inscripcion_a: string | null
          inscripcion_b: string | null
          orden: number
          origen_a: string | null
          origen_b: string | null
          pista_id: string | null
          prueba_id: string
          resultado: Json | null
          ronda: string | null
        }
        Insert: {
          categoria: string
          cuadro?: string | null
          duracion_min?: number | null
          fase: string
          fin?: string | null
          formato?: string
          ganador_id?: string | null
          grupo?: string | null
          id?: string
          inicio?: string | null
          inscripcion_a?: string | null
          inscripcion_b?: string | null
          orden?: number
          origen_a?: string | null
          origen_b?: string | null
          pista_id?: string | null
          prueba_id: string
          resultado?: Json | null
          ronda?: string | null
        }
        Update: {
          categoria?: string
          cuadro?: string | null
          duracion_min?: number | null
          fase?: string
          fin?: string | null
          formato?: string
          ganador_id?: string | null
          grupo?: string | null
          id?: string
          inicio?: string | null
          inscripcion_a?: string | null
          inscripcion_b?: string | null
          orden?: number
          origen_a?: string | null
          origen_b?: string | null
          pista_id?: string | null
          prueba_id?: string
          resultado?: Json | null
          ronda?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partidos_ganador_id_fkey"
            columns: ["ganador_id"]
            isOneToOne: false
            referencedRelation: "inscripciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_inscripcion_a_fkey"
            columns: ["inscripcion_a"]
            isOneToOne: false
            referencedRelation: "inscripciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_inscripcion_b_fkey"
            columns: ["inscripcion_b"]
            isOneToOne: false
            referencedRelation: "inscripciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_pista_id_fkey"
            columns: ["pista_id"]
            isOneToOne: false
            referencedRelation: "pistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_prueba_id_categoria_fkey"
            columns: ["prueba_id", "categoria"]
            isOneToOne: false
            referencedRelation: "prueba_categorias"
            referencedColumns: ["prueba_id", "categoria"]
          },
          {
            foreignKeyName: "partidos_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "pruebas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          consentimiento_imagen: boolean
          created_at: string
          datos_deportivos: Json
          id: string
          nombre: string
          onboarding_completado_at: string | null
          rol: string
          slug: string | null
          talla_camiseta: string | null
          visibilidad_publica: boolean
        }
        Insert: {
          consentimiento_imagen?: boolean
          created_at?: string
          datos_deportivos?: Json
          id: string
          nombre?: string
          onboarding_completado_at?: string | null
          rol?: string
          slug?: string | null
          talla_camiseta?: string | null
          visibilidad_publica?: boolean
        }
        Update: {
          consentimiento_imagen?: boolean
          created_at?: string
          datos_deportivos?: Json
          id?: string
          nombre?: string
          onboarding_completado_at?: string | null
          rol?: string
          slug?: string | null
          talla_camiseta?: string | null
          visibilidad_publica?: boolean
        }
        Relationships: []
      }
      pistas: {
        Row: {
          id: string
          numero: number
          prueba_id: string
        }
        Insert: {
          id?: string
          numero: number
          prueba_id: string
        }
        Update: {
          id?: string
          numero?: number
          prueba_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pistas_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "pruebas"
            referencedColumns: ["id"]
          },
        ]
      }
      points_scale: {
        Row: {
          categoria: string
          cuadro: string
          puntos: number
          ronda: string
        }
        Insert: {
          categoria: string
          cuadro: string
          puntos: number
          ronda: string
        }
        Update: {
          categoria?: string
          cuadro?: string
          puntos?: number
          ronda?: string
        }
        Relationships: []
      }
      propuestas_categoria: {
        Row: {
          categoria_final: string | null
          categoria_origen: string
          categoria_propuesta: string
          created_at: string
          empate_en_frontera: boolean
          estado: string
          id: string
          jugador_id: string
          motivo: string | null
          posicion: number
          resuelta_at: string | null
          resuelta_por: string | null
          temporada_destino_id: number
          temporada_id: number
          tipo: string
        }
        Insert: {
          categoria_final?: string | null
          categoria_origen: string
          categoria_propuesta: string
          created_at?: string
          empate_en_frontera?: boolean
          estado?: string
          id?: string
          jugador_id: string
          motivo?: string | null
          posicion: number
          resuelta_at?: string | null
          resuelta_por?: string | null
          temporada_destino_id: number
          temporada_id: number
          tipo: string
        }
        Update: {
          categoria_final?: string | null
          categoria_origen?: string
          categoria_propuesta?: string
          created_at?: string
          empate_en_frontera?: boolean
          estado?: string
          id?: string
          jugador_id?: string
          motivo?: string | null
          posicion?: number
          resuelta_at?: string | null
          resuelta_por?: string | null
          temporada_destino_id?: number
          temporada_id?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "propuestas_categoria_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_categoria_resuelta_por_fkey"
            columns: ["resuelta_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_categoria_temporada_destino_id_fkey"
            columns: ["temporada_destino_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_categoria_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
        ]
      }
      prueba_categorias: {
        Row: {
          categoria: string
          prueba_id: string
        }
        Insert: {
          categoria: string
          prueba_id: string
        }
        Update: {
          categoria?: string
          prueba_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prueba_categorias_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "pruebas"
            referencedColumns: ["id"]
          },
        ]
      }
      pruebas: {
        Row: {
          created_at: string
          inscripciones_abren_at: string | null
          inscripciones_cierran_at: string | null
          descanso_min: number
          duracion_fase_final_min: number
          duracion_final_min: number
          duracion_grupo_min: number
          es_master: boolean
          estado: string
          fecha_fin: string
          fecha_inicio: string
          hora_fin: string
          hora_inicio: string
          id: string
          nombre: string
          plazas_maximas: number
          precio_pareja_centimos: number
          sede: string
          sede_url: string | null
          slug: string
          temporada_id: number
        }
        Insert: {
          created_at?: string
          inscripciones_abren_at?: string | null
          inscripciones_cierran_at?: string | null
          descanso_min?: number
          duracion_fase_final_min?: number
          duracion_final_min?: number
          duracion_grupo_min?: number
          es_master?: boolean
          estado?: string
          fecha_fin: string
          fecha_inicio: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          nombre: string
          plazas_maximas?: number
          precio_pareja_centimos: number
          sede: string
          sede_url?: string | null
          slug: string
          temporada_id: number
        }
        Update: {
          created_at?: string
          inscripciones_abren_at?: string | null
          inscripciones_cierran_at?: string | null
          descanso_min?: number
          duracion_fase_final_min?: number
          duracion_final_min?: number
          duracion_grupo_min?: number
          es_master?: boolean
          estado?: string
          fecha_fin?: string
          fecha_inicio?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          nombre?: string
          plazas_maximas?: number
          precio_pareja_centimos?: number
          sede?: string
          sede_url?: string | null
          slug?: string
          temporada_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "pruebas_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
        ]
      }
      puntos_prueba: {
        Row: {
          categoria: string
          cuadro: string
          fecha: string
          id: number
          inscripcion_id: string
          jugador_id: string
          prueba_id: string
          puntos: number
          ronda: string
        }
        Insert: {
          categoria: string
          cuadro: string
          fecha: string
          id?: never
          inscripcion_id: string
          jugador_id: string
          prueba_id: string
          puntos: number
          ronda: string
        }
        Update: {
          categoria?: string
          cuadro?: string
          fecha?: string
          id?: never
          inscripcion_id?: string
          jugador_id?: string
          prueba_id?: string
          puntos?: number
          ronda?: string
        }
        Relationships: [
          {
            foreignKeyName: "puntos_prueba_categoria_cuadro_ronda_fkey"
            columns: ["categoria", "cuadro", "ronda"]
            isOneToOne: false
            referencedRelation: "points_scale"
            referencedColumns: ["categoria", "cuadro", "ronda"]
          },
          {
            foreignKeyName: "puntos_prueba_inscripcion_id_fkey"
            columns: ["inscripcion_id"]
            isOneToOne: false
            referencedRelation: "inscripciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puntos_prueba_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puntos_prueba_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "pruebas"
            referencedColumns: ["id"]
          },
        ]
      }
      temporadas: {
        Row: {
          activa: boolean
          anio: string
          fecha_fin: string
          fecha_inicio: string
          id: number
          plazas_ascenso: number
          plazas_descenso: number
        }
        Insert: {
          activa?: boolean
          anio: string
          fecha_fin: string
          fecha_inicio: string
          id?: never
          plazas_ascenso?: number
          plazas_descenso?: number
        }
        Update: {
          activa?: boolean
          anio?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: never
          plazas_ascenso?: number
          plazas_descenso?: number
        }
        Relationships: []
      }
    }
    Views: {
      v_ocupacion: {
        Row: {
          categoria: string | null
          ocupadas: number | null
          prueba_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_prueba_id_categoria_fkey"
            columns: ["prueba_id", "categoria"]
            isOneToOne: false
            referencedRelation: "prueba_categorias"
            referencedColumns: ["prueba_id", "categoria"]
          },
          {
            foreignKeyName: "inscripciones_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "pruebas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      es_organizador: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
