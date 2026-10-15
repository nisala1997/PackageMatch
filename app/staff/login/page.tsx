'use client';
import {useState} from 'react';
export default function StaffLogin(){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 return <main><section className="panel formpanel" style={{maxWidth:420,margin:'40px auto'}}><h1>Admin login</h1><p>Sign in to manage packages.</p>
 <form onSubmit={async event=>{
  event.preventDefault();setBusy(true);setError('');
  const form=new FormData(event.currentTarget);
  try{
   const response=await fetch('/api/staff/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.get('username'),password:form.get('password')})});
   if(!response.ok){const body=await response.json() as {error?:string};throw new Error(body.error||'Could not sign in.');}
   window.location.href='/';
  }catch(error){setError(error instanceof Error?error.message:'Could not sign in.');setBusy(false);}
 }}>
 <label>Username<input name="username" autoComplete="username" required maxLength={100}/></label>
 <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={256}/></label>
 {error&&<p className="message error" role="alert">{error}</p>}
 <button className="primary full" disabled={busy}>{busy?'Signing in…':'Sign in'}</button>
 </form><p><a href="/">Back to customer portal</a></p></section></main>;
}
