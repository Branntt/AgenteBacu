// Base falsa que SÍ sobrevive a la recarga (vive en localStorage), y a la que le falta la
// columna `materia`, igual que la base real del usuario.
const CLAVE = '__fake_db_tareas';
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch(e) { return []; } };
const escribir = (f) => localStorage.setItem(CLAVE, JSON.stringify(f));
window.__db = { get tareas(){ return leer(); } };

function q(tabla){
  const p = Promise.resolve({ data: tabla === 'tareas' ? leer() : [], error: null });
  const o = { select:()=>o, order:()=>o, eq:()=>o, neq:()=>o, update:()=>o, delete:()=>o, single:()=>o,
    insert:(filas)=>{
      const arr = Array.isArray(filas) ? filas : [filas];
      if (tabla !== 'tareas') return { then:(a)=>a({ data:null, error:null }) };
      if (arr.some(f => 'materia' in f)) {
        return { then:(a)=>a({ data:null, error:{ message:'column materia does not exist' } }) };
      }
      escribir(leer().concat(arr));
      return { then:(a)=>a({ data:null, error:null }) };
    },
    then:(a,b)=>p.then(a,b), catch:(f)=>p.catch(f) };
  return o;
}
export function createClient(){
  return { from:(t)=>q(t), channel:()=>({on(){return this;},subscribe(){},unsubscribe(){}}),
    auth:{ getSession: async()=>({data:{session:{user:{id:'u1'}}}}),
           onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
           signInWithPassword: async()=>({error:null}), signOut: async()=>({error:null}) } };
}
export const jsPDF = function(){ return {}; };
export default { createClient };
