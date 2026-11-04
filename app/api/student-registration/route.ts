import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const db = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Server database configuration is missing.')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
const str = (v: unknown, n = 200) => typeof v === 'string' ? v.trim().slice(0, n) : ''

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const full_name = str(b.fullName,120)
    const phone = str(b.phone,30).replace(/[\\s()-]/g,'')
    const email = str(b.email,160).toLowerCase() || null
    const education_category = str(b.educationCategory,60)
    const institution = str(b.institution,160)
    const academic_level = str(b.academicLevel,60)
    if (!full_name || !phone || !education_category || !institution || !academic_level || !str(b.gender,30)) return NextResponse.json({error:'Complete all required fields.'},{status:400})
    if (!/^\\+?[0-9]{7,15}$/.test(phone)) return NextResponse.json({error:'Enter a valid phone number.'},{status:400})
    if (b.dataConsent !== true) return NextResponse.json({error:'Consent is required.'},{status:400})
    if (b.photo && (!['image/jpeg','image/png','image/webp'].includes(b.photo.mimeType) || typeof b.photo.data !== 'string' || b.photo.data.length > 4200000)) return NextResponse.json({error:'Invalid profile picture or image exceeds 3 MB.'},{status:400})
    const age = b.dateOfBirth ? Math.floor((Date.now()-new Date(b.dateOfBirth).getTime())/31557600000) : null
    if (age !== null && age < 18 && (!str(b.guardianName) || !str(b.guardianPhone) || b.guardianConsent !== true)) return NextResponse.json({error:'Parent or guardian details and consent are required for minors.'},{status:400})
    const supabase = db()
    const student_id = 'FBCO-'+new Date().getFullYear()+'-'+crypto.randomUUID().slice(0,8).toUpperCase()
    const student = {
      student_id, full_name, gender:str(b.gender,30), date_of_birth:str(b.dateOfBirth,10)||null, phone, email,
      education_category, institution, faculty:str(b.faculty,120)||null, department:str(b.department,120)||null,
      course_of_study:str(b.courseOfStudy,120)||null, academic_level, church_unit:str(b.churchUnit,120)||null,
      fellowship_group:str(b.fellowshipGroup,120)||null, membership_status:str(b.membershipStatus,60)||null,
      residential_address:str(b.address,500)||null, emergency_contact_name:str(b.emergencyName,120)||null,
      emergency_contact_phone:str(b.emergencyPhone,30)||null, emergency_contact_relationship:str(b.emergencyRelationship,60)||null,
      guardian_name:str(b.guardianName,120)||null, guardian_phone:str(b.guardianPhone,30)||null,
      guardian_consent:b.guardianConsent===true, data_consent:true, google_sheet_sync_status:'pending'
    }
    const {data,error} = await supabase.from('student_registrations').insert(student).select('id,student_id').single()
    if (error) {
      if (error.code==='23505') return NextResponse.json({error:'This phone number or email is already registered.'},{status:409})
      console.error('Student registration database error:',error.message)
      return NextResponse.json({error:'Registration could not be saved.'},{status:500})
    }
    let spreadsheetSync = 'pending'
    if (process.env.FBCO_APPS_SCRIPT_URL && process.env.FBCO_SYNC_SECRET) {
      try {
        const response = await fetch(process.env.FBCO_APPS_SCRIPT_URL,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({secret:process.env.FBCO_SYNC_SECRET,action:'register',student:{...student,id:data.id,photo:b.photo||null}}),
          cache:'no-store',redirect:'follow'
        })
        const result = await response.json()
        if (!response.ok || !result.success) throw new Error('Google synchronization failed')
        spreadsheetSync = 'synced'
        await supabase.from('student_registrations').update({google_sheet_sync_status:'synced',google_sheet_synced_at:new Date().toISOString(),google_drive_photo_url:result.photoUrl||null}).eq('id',data.id)
      } catch (e) { console.error('Google Sheets sync pending:',e) }
    }
    return NextResponse.json({success:true,studentId,spreadsheetSync})
  } catch (e) {
    console.error('Student registration error:',e)
    return NextResponse.json({error:'Unable to process registration.'},{status:500})
  }
}

export async function GET() {
  try {
    const auth = await createAuthClient()
    const {data:{user}} = await auth.auth.getUser()
    if (!user) return NextResponse.json({error:'Authentication required.'},{status:401})
    const {data:profile} = await auth.from('profiles').select('role').eq('id',user.id).maybeSingle()
    const {data:access} = await auth.from('student_registration_access').select('role,department,is_active').eq('user_id',user.id).maybeSingle()
    const admin = profile?.role==='admin' || (access?.is_active && access?.role==='church_admin')
    const leader = access?.is_active && access?.role==='department_leader'
    if (!admin && !leader) return NextResponse.json({error:'Not authorized.'},{status:403})
    const supabase = db()
    let query = supabase.from('student_registrations').select('*').order('created_at',{ascending:false}).limit(500)
    if (leader && !admin) {
      if (!access?.department) return NextResponse.json({students:[]})
      query = query.eq('department',access.department)
    }
    const {data,error} = await query
    if (error) return NextResponse.json({error:'Unable to load student records.'},{status:500})
    return NextResponse.json({students:data||[]})
  } catch (e) {
    console.error('Student records error:',e)
    return NextResponse.json({error:'Unable to load student records.'},{status:500})
  }
}
