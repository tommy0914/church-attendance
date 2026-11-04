'use client'
import { useState } from 'react'

const levels = ['Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6','JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3','100 Level','200 Level','300 Level','400 Level','500 Level','OND 1','OND 2','HND 1','HND 2','NCE 1','NCE 2','NCE 3','Other']
const categories = ['Primary School','Secondary School','University','Polytechnic','College of Education','Vocational / Technical','Other']
export default function StudentRegistrationPage() {
 const [form,setForm] = useState<Record<string,string|boolean>>({gender:'',educationCategory:'',academicLevel:'',dataConsent:false,guardianConsent:false})
 const [photo,setPhoto] = useState<File|null>(null)
 const [loading,setLoading] = useState(false)
 const [error,setError] = useState('')
 const [studentId,setStudentId] = useState('')
 const age = form.dateOfBirth ? Math.floor((Date.now()-new Date(String(form.dateOfBirth)).getTime())/31557600000) : null
 const minor = age !== null && age < 18
 const field = (key:string,label:string,type='text',required=false) => <label className="form-group"><span className="form-label">{label}{required?' *':''}</span><input className="form-input" type={type} required={required} value={String(form[key]||'')} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/></label>
 async function submit(e:React.FormEvent) {
  e.preventDefault(); setError('')
  if (photo && photo.size>3*1024*1024) {setError('Profile picture must not exceed 3 MB.');return}
  if (!form.dataConsent || (minor && (!form.guardianName || !form.guardianPhone || !form.guardianConsent))) {setError('Please complete the required consent fields.');return}
  setLoading(true)
  try {
   let photoData:null|{name:string,mimeType:string,data:string}=null
   if(photo) {const dataUrl=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('Photo could not be read'));r.readAsDataURL(photo)});photoData={name:photo.name,mimeType:photo.type,data:dataUrl.split(',')[1]}}
   const response=await fetch('/api/student-registration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,photo:photoData})})
   const result=await response.json()
   if(!response.ok) throw new Error(result.error||'Registration failed')
   setStudentId(result.studentId)
  } catch(err) {setError(err instanceof Error?err.message:'Registration failed')} finally {setLoading(false)}
 }
 if(studentId) return <main className="page-center" style={{padding:24}}><section className="card" style={{maxWidth:540,textAlign:'center',padding:32}}><h1 className="page-title">Registration received</h1><p>Your information has been submitted to Faith Baptist Church Ogbomoso.</p><h2 style={{marginTop:20}}>{studentId}</h2><p style={{color:'var(--text-muted)'}}>Keep this student ID for future reference.</p></section></main>
 return <main className="layout-container" style={{maxWidth:900,paddingTop:32,paddingBottom:48}}>
  <header className="page-header"><p style={{color:'var(--accent-light)',fontWeight:700}}>FAITH BAPTIST CHURCH OGBOMOSO</p><h1 className="page-title">Student Information Registration</h1><p className="page-subtitle">Register your educational and church information.</p></header>
  <form className="card" onSubmit={submit} style={{display:'grid',gap:22}}>
   {error&&<div className="alert alert-error">{error}</div>}
   <section><h2>Personal information</h2><div className="grid-2">{field('fullName','Full name','text',true)}{field('phone','Phone number','tel',true)}{field('email','Email address','email')}{field('dateOfBirth','Date of birth','date')}<label className="form-group"><span className="form-label">Gender *</span><select className="form-input" required value={String(form.gender)} onChange={e=>setForm(p=>({...p,gender:e.target.value}))}><option value="">Select</option><option>Male</option><option>Female</option><option>Prefer not to say</option></select></label></div></section>
   <section><h2>Education</h2><div className="grid-2"><label className="form-group"><span className="form-label">Education category *</span><select className="form-input" required value={String(form.educationCategory)} onChange={e=>setForm(p=>({...p,educationCategory:e.target.value}))}><option value="">Select</option>{categories.map(x=><option key={x}>{x}</option>)}</select></label>{field('institution','Institution','text',true)}{field('faculty','Faculty')}{field('department','Department')}{field('courseOfStudy','Course of study')}<label className="form-group"><span className="form-label">Class / level *</span><select className="form-input" required value={String(form.academicLevel)} onChange={e=>setForm(p=>({...p,academicLevel:e.target.value}))}><option value="">Select</option>{levels.map(x=><option key={x}>{x}</option>)}</select></label></div></section>
   <section><h2>Church information</h2><div className="grid-2">{field('churchUnit','Church unit / department')}{field('fellowshipGroup','Fellowship group')}<label className="form-group"><span className="form-label">Membership status</span><select className="form-input" value={String(form.membershipStatus||'')} onChange={e=>setForm(p=>({...p,membershipStatus:e.target.value}))}><option value="">Select</option><option>Member</option><option>Regular attendee</option><option>New attendee</option><option>Other</option></select></label><label className="form-group"><span className="form-label">Profile picture (optional)</span><input className="form-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label></div>{field('address','Residential address')}</section>
   <section><h2>Emergency contact</h2><div className="grid-2">{field('emergencyName','Contact name')}{field('emergencyPhone','Contact phone')}{field('emergencyRelationship','Relationship')}</div></section>
   {minor&&<section className="card"><h2>Parent or guardian consent</h2><div className="grid-2">{field('guardianName','Guardian name','text',true)}{field('guardianPhone','Guardian phone','tel',true)}</div><label><input type="checkbox" checked={Boolean(form.guardianConsent)} onChange={e=>setForm(p=>({...p,guardianConsent:e.target.checked}))}/> Guardian consent is confirmed.</label></section>}
   <label style={{display:'flex',gap:10,alignItems:'flex-start'}}><input type="checkbox" required checked={Boolean(form.dataConsent)} onChange={e=>setForm(p=>({...p,dataConsent:e.target.checked}))}/> I consent to Faith Baptist Church Ogbomoso storing and using this information for church administration and student communication.</label>
   <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>{loading?'Submitting…':'Submit registration'}</button>
  </form>
 </main>
}
