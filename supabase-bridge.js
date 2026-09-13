(()=>{
'use strict';
const URL='https://ebfbzwawqjipvifaspov.supabase.co';
const KEY='sb_publishable_YqqSRLyqZDfCA146o2rPfQ_bWO1ayBz';
window.msSupabaseReady=(async()=>{
  try{
    const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const client=mod.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    window.sb=client;
    const {data}=await client.auth.getSession();
    window.currentUser=data?.session?.user||null;
    client.auth.onAuthStateChange((_event,session)=>{window.currentUser=session?.user||null;});
    return {sb:client,currentUser:window.currentUser};
  }catch(e){console.warn('Supabase bridge failed',e);return {sb:null,currentUser:null}}
})();
})();