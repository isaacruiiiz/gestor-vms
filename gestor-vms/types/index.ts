export interface User {
  id: string;
  nombre: string;
  apellido: string;
  color: string;
}

export interface VM {
  id: string;
  nombre: string;
  ip: string;
  proyecto: string;
  usuario_actual_id: string | null;
  inicio_uso: string | null;
}

export interface QueueItem {
  id: string;
  vm_id: string;
  usuario_id: string;
  users?: User; // Para cuando hacemos el join con supabase
}