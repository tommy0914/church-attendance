'use client'
import { useEffect, useState } from 'react'
type Student = { id:string; student_id:string; full_name:string; phone:string; email:string|null; institution:string; department:string|null; academic_level:string; education_category:string; created_at:string; google_sheet_sync_status:string }
export default function AdminStudentsPage() {
 const [students,setStudents]=useState<Student[]>([])
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [search,setSearch]=useState('')
 useEffect(()=>{fetch('/api/student-registration').then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load records');setStudents(d.students||[])}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[])
 const filtered=students.filter(s=>[s.full_name,s.student_id,s.phone,s.institution,s.department||''].some(v=>v.toLowerCase().includes(search.toLowerCase())))
 return <main className="layout-container" style={{paddingTop:32,paddingBottom:48}}>
  <header className="page-header"><h1 className="page-title">Student Records</h1><p className="page-subtitle">{students.length} registered students</p><input className="form-input" placeholder="Search name, ID, phone, institution or department" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:440,marginTop:16}}/></header>
  {error&&<div className="alert alert-error">{error}</div>}
  {loading?<div className="text-center" style={{padding:48}}>Loading student records…</div>:<div className="card"><div className="table-wrap"><table className="table"><thead><tr><th>Student ID</th><th>Name</th><th>Phone</th><th>Institution</th><th>Department</th><th>Level</th><th>Sheet sync</th></tr></thead><tbody>{filtered.map(s=><tr key={s.id}><td>{s.student_id}</td><td>{s.full_name}</td><td>{s.phone}</td><td>{s.institution}</td><td>{s.department||'Not provided'}</td><td>{s.academic_level}</td><td>{s.google_sheet_sync_status}</td></tr>)}</tbody></table></div>{filtered.length===0&&<p style={{padding:24,textAlign:'center',color:'var(--text-muted)'}}>No student records found.</p>}</div>}
 </main>
}
