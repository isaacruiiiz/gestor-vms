'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, VM, QueueItem } from '@/types';
import { Clock, AlertTriangle, Monitor, XCircle, UserPlus } from 'lucide-react';

interface VmCardProps {
  vm: VM;
  users: User[];
  queue: QueueItem[];
  onUpdate: () => void; // Para recargar datos al hacer cambios
}

export default function VmCard({ vm, users, queue, onUpdate }: VmCardProps) {
  const [tiempoUso, setTiempoUso] = useState<string>('');
  const [alertaTiempo, setAlertaTiempo] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');

  // Encontrar al usuario actual si existe
  const usuarioActual = users.find((u) => u.id === vm.usuario_actual_id);
  // Filtrar la cola para esta máquina
  const colaDeEstaVm = queue.filter((q) => q.vm_id === vm.id);

  // Lógica del Timer (se actualiza cada minuto)
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
      setAlertaTiempo(horas >= 10); // Alerta si lleva más de 10 horas
    };

    calcularTiempo();
    const intervalo = setInterval(calcularTiempo, 60000); // Actualizar cada minuto
    return () => clearInterval(intervalo);
  }, [vm.inicio_uso, vm.usuario_actual_id]);

  // Acciones de Base de Datos
  const ocuparMaquina = async () => {
    if (!usuarioSeleccionado) return alert('Selecciona tu nombre primero');
    await supabase.from('vms').update({
      usuario_actual_id: usuarioSeleccionado,
      inicio_uso: new Date().toISOString(),
    }).eq('id', vm.id);
    onUpdate();
  };

  const liberarMaquina = async () => {
    if(!confirm("¿Seguro que quieres liberar esta máquina?")) return;
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

  return (
    <div className={`border rounded-lg p-4 shadow-sm transition-all ${usuarioActual ? 'bg-white border-l-4 ' + usuarioActual.color.replace('bg-', 'border-') : 'bg-gray-50 border-l-4 border-green-500'}`}>
      
      {/* Cabecera Tarjeta */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Monitor size={18} /> {vm.nombre}
          </h3>
          <p className="text-sm text-gray-500 font-mono">{vm.ip}</p>
        </div>
        {usuarioActual ? (
          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${usuarioActual.color}`}>
            OCUPADO
          </span>
        ) : (
          <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">
            LIBRE
          </span>
        )}
      </div>

      {/* Cuerpo Principal */}
      <div className="space-y-3">
        {usuarioActual ? (
          // ESTADO: OCUPADO
          <div className="bg-gray-50 p-3 rounded border">
            <p className="text-sm text-gray-600 mb-1">En uso por:</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800 text-lg">{usuarioActual.nombre} {usuarioActual.apellido}</span>
              <button onClick={liberarMaquina} className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1">
                <XCircle size={14} /> Liberar
              </button>
            </div>
            
            {/* Timer */}
            <div className={`mt-2 flex items-center gap-2 text-sm ${alertaTiempo ? 'text-red-600 font-bold animate-pulse' : 'text-blue-600'}`}>
              <Clock size={14} />
              <span>Lleva dentro: {tiempoUso}</span>
              {alertaTiempo && <AlertTriangle size={14} />}
            </div>
          </div>
        ) : (
          // ESTADO: LIBRE
          <div className="flex gap-2">
            <select 
              className="flex-1 border rounded px-2 py-1 text-sm bg-white"
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              value={usuarioSeleccionado}
            >
              <option value="">¿Quién eres?</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
            </select>
            <button 
              onClick={ocuparMaquina}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
            >
              Entrar
            </button>
          </div>
        )}

        {/* Sección de Cola */}
        {usuarioActual && (
          <div className="mt-3 pt-3 border-t border-dashed">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cola de espera</span>
              <div className="flex gap-1">
                 <select 
                  className="w-24 border rounded px-1 py-0.5 text-xs"
                  onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                  value={usuarioSeleccionado}
                >
                  <option value="">Usuario...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
                <button onClick={unirseACola} title="Ponerme en cola" className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                  <UserPlus size={16} />
                </button>
              </div>
            </div>
            
            {colaDeEstaVm.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nadie esperando</p>
            ) : (
              <ul className="space-y-1">
                {colaDeEstaVm.map((item, idx) => (
                  <li key={item.id} className="text-xs flex justify-between items-center bg-yellow-50 p-1 rounded px-2 border border-yellow-100">
                    <span className="font-medium text-yellow-800">
                      {idx + 1}. {item.users?.nombre || 'Usuario'} {item.users?.apellido}
                    </span>
                    <button onClick={() => salirDeCola(item.id)} className="text-gray-400 hover:text-red-500">×</button>
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