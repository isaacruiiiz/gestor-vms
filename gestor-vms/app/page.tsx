'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, VM, QueueItem } from '@/types';
import VmCard from '@/components/VmCard';
import { Users, PlusCircle, RefreshCw, PcCase, Monitor, X, ArrowLeft } from 'lucide-react';

const COLORES = [
  'bg-red-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 
  'bg-purple-600', 'bg-pink-600', 'bg-indigo-600', 'bg-teal-600'
];

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [vms, setVms] = useState<VM[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);
  const [modalListaOpen, setModalListaOpen] = useState(false);
  const [modalVmOpen, setModalVmOpen] = useState(false);
  
  const [nuevoUser, setNuevoUser] = useState({ nombre: '', apellido: '', color: COLORES[0] });
  const [nuevaVm, setNuevaVm] = useState({ nombre: '', ip: '', proyecto: '' });
  const [modoNuevoProyecto, setModoNuevoProyecto] = useState(false);

  const cargarDatos = async () => {
    const { data: userData } = await supabase.from('users').select('*').order('nombre');
    if (userData) setUsers(userData);

    const { data: vmData } = await supabase.from('vms').select('*').order('nombre');
    if (vmData) setVms(vmData);

    const { data: queueData } = await supabase.from('queue').select('*, users(*)').order('created_at');
    if (queueData) setQueue(queueData as any);

    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
    const channel = supabase
      .channel('cambios-db')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        cargarDatos();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const crearUsuario = async () => {
    if (!nuevoUser.nombre || !nuevoUser.apellido) return alert("Rellena nombre y apellido");
    await supabase.from('users').insert([nuevoUser]);
    setModalUsuarioOpen(false);
    setNuevoUser({ nombre: '', apellido: '', color: COLORES[0] });
    cargarDatos();
  };

  const eliminarUsuario = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${nombre}? Se borrará permanentemente.`)) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      alert("No se pudo eliminar. Asegúrate de que el usuario no esté ocupando una máquina actualmente.");
    } else {
      cargarDatos();
    }
  };

  const crearVm = async () => {
    if (!nuevaVm.nombre || !nuevaVm.ip || !nuevaVm.proyecto) return alert("Rellena todos los datos de la máquina");
    await supabase.from('vms').insert([{
      nombre: nuevaVm.nombre,
      ip: nuevaVm.ip,
      proyecto: nuevaVm.proyecto,
      usuario_actual_id: null
    }]);
    setModalVmOpen(false);
    setNuevaVm({ nombre: '', ip: '', proyecto: '' });
    cargarDatos();
  };

  const proyectos = Array.from(new Set(vms.map(v => v.proyecto)));

  const abrirModalVm = () => {
    setModalVmOpen(true);
    setModoNuevoProyecto(proyectos.length === 0);
    setNuevaVm({ nombre: '', ip: '', proyecto: '' });
  };

  return (
    <main className="min-h-screen bg-black p-4 md:p-8 font-sans text-zinc-300">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-white shadow-lg shadow-blue-900/10">
            <PcCase size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Waitlist de VMs</h1>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center">
          <button 
            onClick={() => setModalListaOpen(true)}
            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded text-xs uppercase tracking-wider font-bold transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Users size={16} /> Equipo
          </button>

          <button 
            onClick={abrirModalVm}
            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 rounded text-xs uppercase tracking-wider font-bold transition-all duration-200 hover:scale-105 active:scale-95 hover:border-blue-900/50"
          >
            <Monitor size={16} /> Nueva VM
          </button>

          <button 
            onClick={() => setModalUsuarioOpen(true)}
            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white hover:bg-zinc-200 text-black rounded text-xs uppercase tracking-wider font-bold transition-all duration-200 shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
          >
            <PlusCircle size={16} /> Nuevo Usuario
          </button>
        </div>
      </header>

      {/* LISTA DE VMS */}
      {cargando && vms.length === 0 ? (
         <div className="text-center py-20 text-zinc-600 flex flex-col items-center">
            <RefreshCw className="animate-spin mb-2" />
            <span className="text-xs font-mono animate-pulse">ESTABLECIENDO CONEXIÓN...</span>
         </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {proyectos.map((proyecto) => (
            <section key={proyecto} className="bg-zinc-950/50 p-6 rounded-xl border border-zinc-900 transition-colors duration-300 hover:border-zinc-800">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                {/* ACCESIBILIDAD: Aclarado a zinc-500 */}
                <span className="text-zinc-500 font-normal">PROYECTO /</span> {proyecto}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <div className="text-center p-12 bg-zinc-900/30 rounded-lg border border-dashed border-zinc-800">
              {/* ACCESIBILIDAD: Aclarado a zinc-400 */}
              <p className="text-zinc-400 mb-2">Sistema vacío.</p>
              <button onClick={abrirModalVm} className="text-blue-500 font-bold hover:text-blue-400 hover:underline">
                Inicializar primera máquina
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- MODALES STEALTH (Con animate-in fade-in zoom-in) --- */}

      {/* MODAL 1: AÑADIR USUARIO */}
      {modalUsuarioOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6 text-white border-b border-zinc-800 pb-2">Nuevo Operador</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Nombre</label>
                <input 
                  type="text" 
                  className="w-full border border-zinc-800 bg-black text-white rounded p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200" 
                  value={nuevoUser.nombre}
                  onChange={e => setNuevoUser({...nuevoUser, nombre: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Apellido</label>
                <input 
                  type="text" 
                  className="w-full border border-zinc-800 bg-black text-white rounded p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200" 
                  value={nuevoUser.apellido}
                  onChange={e => setNuevoUser({...nuevoUser, apellido: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Identificador de Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map(color => (
                    <button
                      key={color}
                      onClick={() => setNuevoUser({...nuevoUser, color})}
                      className={`cursor-pointer w-8 h-8 rounded-full ${color} border-2 border-transparent transition-all duration-200 ${nuevoUser.color === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'hover:scale-110'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setModalUsuarioOpen(false)} className="cursor-pointer px-4 py-2 text-zinc-400 hover:text-white text-sm font-bold transition-colors">CANCELAR</button>
                <button onClick={crearUsuario} className="cursor-pointer px-4 py-2 bg-white text-black rounded text-sm font-bold hover:bg-zinc-200 transition-colors active:scale-95">GUARDAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AÑADIR MÁQUINA */}
      {modalVmOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6 text-white border-b border-zinc-800 pb-2">Desplegar VM</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Nombre del Host</label>
                <input 
                  type="text" 
                  className="w-full border border-zinc-800 bg-black text-white rounded p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm transition-all duration-200" 
                  placeholder="SRV-BACKEND-01"
                  value={nuevaVm.nombre}
                  onChange={e => setNuevaVm({...nuevaVm, nombre: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Dirección IP</label>
                <input 
                  type="text" 
                  className="w-full border border-zinc-800 bg-black text-white rounded p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm transition-all duration-200" 
                  placeholder="192.168.x.x"
                  value={nuevaVm.ip}
                  onChange={e => setNuevaVm({...nuevaVm, ip: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Proyecto</label>
                {!modoNuevoProyecto && proyectos.length > 0 ? (
                  <select 
                    className="cursor-pointer w-full border border-zinc-800 bg-black text-white rounded p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-sans transition-all duration-200"
                    value={nuevaVm.proyecto}
                    onChange={(e) => {
                      if (e.target.value === '__NUEVO__') {
                        setModoNuevoProyecto(true);
                        setNuevaVm({...nuevaVm, proyecto: ''});
                      } else {
                        setNuevaVm({...nuevaVm, proyecto: e.target.value});
                      }
                    }}
                    style={{ fontFamily: 'inherit' }}
                  >
                    <option value="" className="bg-zinc-900 text-zinc-500">-- Seleccionar --</option>
                    {proyectos.map(p => (
                      <option key={p} value={p} className="bg-black text-white font-sans py-2">{p}</option>
                    ))}
                    <option disabled className="bg-zinc-900 text-zinc-600">──────────────────</option>
                    <option value="__NUEVO__" className="text-blue-400 font-bold font-sans">+ Nuevo Proyecto</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="w-full border border-zinc-800 bg-black text-white rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all duration-200" 
                      placeholder="Nombre del proyecto..."
                      value={nuevaVm.proyecto}
                      autoFocus
                      onChange={e => setNuevaVm({...nuevaVm, proyecto: e.target.value})}
                    />
                    {proyectos.length > 0 && (
                      <button 
                        onClick={() => setModoNuevoProyecto(false)}
                        className="cursor-pointer p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors duration-200"
                        title="Volver"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setModalVmOpen(false)} className="cursor-pointer px-4 py-2 text-zinc-400 hover:text-white text-sm font-bold transition-colors">CANCELAR</button>
                <button onClick={crearVm} className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-500 transition-colors active:scale-95">CREAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LISTA DE USUARIOS */}
      {modalListaOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
              <h2 className="text-xl font-bold text-white">Directorio de Equipo</h2>
              <button onClick={() => setModalListaOpen(false)} className="cursor-pointer px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded text-xs font-bold uppercase transition-colors">Cerrar</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 border border-zinc-800 rounded bg-black/50 hover:border-zinc-500 hover:bg-zinc-900 transition-all duration-200 transform hover:scale-[1.02] cursor-default group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${u.color} transition-transform group-hover:scale-110`}>
                    {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-200 text-sm group-hover:text-white transition-colors">{u.nombre} {u.apellido}</p>
                  </div>
                  
                  <button 
                    onClick={() => eliminarUsuario(u.id, u.nombre)} 
                    className="ml-auto cursor-pointer p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all duration-200 opacity-50 group-hover:opacity-100"
                    title="Eliminar usuario"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}