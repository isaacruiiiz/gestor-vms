'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, VM, QueueItem } from '@/types';
import VmCard from '@/components/VmCard';
import { Users, PlusCircle, RefreshCw, Server, XCircle } from 'lucide-react';

// Colores disponibles para los usuarios
const COLORES = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
];

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [vms, setVms] = useState<VM[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados para los Modales
  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);
  const [modalListaOpen, setModalListaOpen] = useState(false);
  
  // Estado para formulario nuevo usuario
  const [nuevoUser, setNuevoUser] = useState({ nombre: '', apellido: '', color: COLORES[0] });

  // Función principal de carga de datos
  const cargarDatos = async () => {
    setCargando(true);
    
    // 1. Cargar Usuarios
    const { data: userData } = await supabase.from('users').select('*').order('nombre');
    if (userData) setUsers(userData);

    // 2. Cargar VMs
    const { data: vmData } = await supabase.from('vms').select('*').order('nombre');
    if (vmData) setVms(vmData);

    // 3. Cargar Cola (con join para saber el nombre del usuario)
    const { data: queueData } = await supabase.from('queue').select('*, users(*)').order('created_at');
    if (queueData) setQueue(queueData as any);

    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
    
    // Configurar suscripción Realtime para que se actualice solo
    const channel = supabase
      .channel('cambios-db')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        console.log('Cambio detectado, recargando...');
        cargarDatos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const crearUsuario = async () => {
    if (!nuevoUser.nombre || !nuevoUser.apellido) return alert("Rellena nombre y apellido");
    await supabase.from('users').insert([nuevoUser]);
    setModalUsuarioOpen(false);
    setNuevoUser({ nombre: '', apellido: '', color: COLORES[0] }); // Reset
    cargarDatos();
  };

  // Agrupar VMs por proyecto
  const proyectos = Array.from(new Set(vms.map(v => v.proyecto)));

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Server size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestor de VMs</h1>
            <p className="text-sm text-gray-500">Equipo de Desarrollo</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setModalListaOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Users size={18} /> Ver Equipo
          </button>
          <button 
            onClick={() => setModalUsuarioOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle size={18} /> Soy Nuevo
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      {cargando && vms.length === 0 ? (
         <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <RefreshCw className="animate-spin mb-2" /> Cargando máquinas...
         </div>
      ) : (
        <div className="space-y-10">
          {proyectos.map((proyecto) => (
            <section key={proyecto} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                📂 Proyecto: <span className="text-blue-600">{proyecto}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {vms
                  .filter(v => v.proyecto === proyecto)
                  .map(vm => (
                    <VmCard 
                      key={vm.id} 
                      vm={vm} 
                      users={users} 
                      queue={queue}
                      onUpdate={cargarDatos}
                    />
                  ))
                }
              </div>
            </section>
          ))}
          
          {vms.length === 0 && !cargando && (
            <div className="text-center p-10 bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">No hay máquinas creadas todavía.</p>
              <p className="text-sm text-gray-400">Añade algunas filas a la tabla 'vms' en Supabase.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: AÑADIR USUARIO */}
      {modalUsuarioOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">👋 ¡Bienvenido al equipo!</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2" 
                  placeholder="Ej: Juan"
                  value={nuevoUser.nombre}
                  onChange={e => setNuevoUser({...nuevoUser, nombre: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2" 
                  placeholder="Ej: Pérez"
                  value={nuevoUser.apellido}
                  onChange={e => setNuevoUser({...nuevoUser, apellido: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Elige tu color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map(color => (
                    <button
                      key={color}
                      onClick={() => setNuevoUser({...nuevoUser, color})}
                      className={`w-8 h-8 rounded-full ${color} ${nuevoUser.color === color ? 'ring-4 ring-offset-2 ring-gray-400' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setModalUsuarioOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={crearUsuario} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LISTA DE USUARIOS */}
      {modalListaOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">👥 Equipo ({users.length})</h2>
              <button onClick={() => setModalListaOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><XCircle /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${u.color}`}>
                    {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{u.nombre} {u.apellido}</p>
                    <p className="text-xs text-gray-500">Miembro del equipo</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}