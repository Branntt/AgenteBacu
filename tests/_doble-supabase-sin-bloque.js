window.__intentos = window.__intentos || [];
const intentos = window.__intentos;
function q(tabla){
  const p = Promise.resolve({ data: [], error: null });
  const o = { select:()=>o, order:()=>o, eq:()=>o, neq:()=>o, update:()=>o, delete:()=>o, single:()=>o,
    insert:(filas)=>{
      const arr = Array.isArray(filas) ? filas : [filas];
      const tieneBloque = arr.some(f => 'bloque' in f);
      intentos.push({ tabla, n: arr.length, bloque: tieneBloque });
      const err = tieneBloque ? { message: 'column bloque does not exist' } : null;
      return { then:(a)=>a({ data:null, error: err }) };
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
