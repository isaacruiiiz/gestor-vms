'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, VM, QueueItem } from '@/types';
import { Clock, AlertTriangle, Monitor, XCircle, UserPlus } from 'lucide-react';

interface VmCardProps {
  vm: VM;
  users: User[];
  queue: QueueItem[];
  onUpdate: () => void;
}

export default function VmCard({ vm, users, queue, onUpdate }: VmCardProps) {
  const [tiempoUso, setTiempoUso] = useState<string>('');
  const [alertaTiempo, setAlertaTiempo] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');

  const usuarioActual = users.find((u) => u.id === vm.usuario_actual_id);
  const colaDeEstaVm = queue.filter((q) => q.vm_id === vm.id);

  useEffect(() => {
    if (!vm.inicio_uso || !vm.usuario_actual_id) {
      setTiempoUso('');
      return;
    }

    const calcularTiempo = () => {
      const inicio = new Date(vm.inicio_uso!).getTime();
      const ahora = new Date().getTime();
      const diff = ahora - inicio;

      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTiempoUso(`${horas}h ${minutos}m`);
      setAlertaTiempo(horas >= 10);
    };

    calcularTiempo();
    const intervalo = setInterval(calcularTiempo, 60000);
    return () => clearInterval(intervalo);
  }, [vm.inicio_uso, vm.usuario_actual_id]);

  const ocuparMaquina = async () => {
    if (!usuarioSeleccionado) return alert('Selecciona tu nombre primero');
    await supabase.from('vms').update({
      usuario_actual_id: usuarioSeleccionado,
      inicio_uso: new Date().toISOString(),
    }).eq('id', vm.id);
    onUpdate();
  };

  const liberarMaquina = async () => {
    if (!confirm("¿Seguro que quieres liberar esta máquina?")) return;
    await supabase.from('vms').update({
      usuario_actual_id: null,
      inicio_uso: null,
    }).eq('id', vm.id);
    onUpdate();
  };

  const unirseACola = async () => {
    if (!usuarioSeleccionado) return alert('Selecciona tu nombre para la cola');
    await supabase.from('queue').insert([{ vm_id: vm.id, usuario_id: usuarioSeleccionado }]);
    onUpdate();
  };

  const salirDeCola = async (idCola: string) => {
    await supabase.from('queue').delete().eq('id', idCola);
    onUpdate();
  };

  // ESTILOS DINÁMICOS
  const cardStyle = usuarioActual
    // CAMBIO AQUÍ: Forzamos border-red-600 en lugar del color del usuario
    ? `bg-zinc-900 border-zinc-700 border-red-600` 
    : 'bg-black border-zinc-800 border-emerald-900/50 hover:border-zinc-700';

  return (
    <div className={`border rounded-lg p-4 shadow-sm transition-all ${cardStyle}`}>
      
      {/* Cabecera Tarjeta */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-white tracking-wide">
            <Monitor size={18} className="text-zinc-500" /> {vm.nombre}
          </h3>
          <p className="text-xs text-zinc-500 font-mono mt-1">{vm.ip}</p>
        </div>
        {usuarioActual ? (
          // CAMBIO AQUÍ: Estilo rojo fijo para la etiqueta "OCUPADO"
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-950 text-red-500 border border-red-900/50 tracking-wider shadow-sm">
            Ocupado
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-950 text-emerald-500 border border-emerald-900/50 tracking-wider">
            Libre
          </span>
        )}
      </div>

      {/* Cuerpo Principal */}
      <div className="space-y-3">
        {usuarioActual ? (
          // ESTADO: OCUPADO
          <div className="bg-black/40 p-3 rounded border border-zinc-800">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Usuario</p>
            
            <div className="flex items-center justify-between">
              {/* IZQUIERDA: ICONO + NOMBRE */}
              <div className="flex items-center gap-3">
                {/* El avatar SÍ mantiene el color del usuario para identificarlo */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${usuarioActual.color}`}>
                    {usuarioActual.nombre.charAt(0)}{usuarioActual.apellido.charAt(0)}
                </div>
                <span className="font-bold text-zinc-200 text-lg">{usuarioActual.nombre} {usuarioActual.apellido}</span>
              </div>

              {/* DERECHA: BOTÓN SALIR */}
              <button onClick={liberarMaquina} className="text-red-500 hover:text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
                <XCircle size={14} /> SALIR
              </button>
            </div>
            
            {/* Timer */}
            <div className={`mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2 text-sm ${alertaTiempo ? 'text-red-500 font-bold animate-pulse' : 'text-blue-400'}`}>
              <Clock size={14} />
              <span className="font-mono">{tiempoUso}</span>
              {alertaTiempo && <AlertTriangle size={14} />}
            </div>
          </div>
        ) : (
          // ESTADO: LIBRE
          <div className="flex gap-2">
            <select 
              className="flex-1 border border-zinc-800 rounded px-2 py-1.5 text-sm bg-zinc-950 text-zinc-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-zinc-600 font-sans appearance-none cursor-pointer"
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              value={usuarioSeleccionado}
              style={{ fontFamily: 'inherit' }}
            >
              <option value="" className="bg-black text-zinc-400">Selecciona usuario...</option>
              {users.map(u => (
                <option key={u.id} value={u.id} className="text-zinc-200 font-sans">
                  {u.nombre} {u.apellido}
                </option>
              ))}
            </select>
            <button 
              onClick={ocuparMaquina}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors border border-emerald-600 cursor-pointer"
            >
              Entrar
            </button>
          </div>
        )}

        {/* Sección de Cola */}
        {usuarioActual && (
          <div className="mt-3 pt-3 border-t border-zinc-800 border-dashed">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">En espera</span>
              <div className="flex gap-1">
                 <select 
                  className="w-32 border border-zinc-800 rounded px-1 py-0.5 text-[10px] bg-zinc-950 text-zinc-400 outline-none font-sans cursor-pointer"
                  onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                  value={usuarioSeleccionado}
                  style={{ fontFamily: 'inherit' }}
                >
                  <option value="" className="bg-black">Usuario...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id} className="text-zinc-300 font-sans">
                      {u.nombre} {u.apellido}
                    </option>
                  ))}
                </select>
                <button onClick={unirseACola} title="Ponerme en cola" className="text-blue-500 hover:bg-zinc-800 p-1 rounded transition-colors cursor-pointer">
                  <UserPlus size={14} />
                </button>
              </div>
            </div>
            
            {colaDeEstaVm.length > 0 && (
              <ul className="space-y-1">
                {colaDeEstaVm.map((item, idx) => (
                  <li key={item.id} className="text-xs flex justify-between items-center bg-zinc-900/50 p-1.5 rounded border border-zinc-800">
                    <span className="font-medium text-amber-500">
                      {idx + 1}. {item.users?.nombre || 'Usuario'}
                    </span>
                    <button onClick={() => salirDeCola(item.id)} className="text-zinc-600 hover:text-zinc-300 cursor-pointer">×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}