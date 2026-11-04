const HEADERS = ['Student ID','Submitted At','Full Name','Gender','Date of Birth','Phone','Email','Education Category','Institution','Faculty','Department','Course','Academic Level','Church Unit','Fellowship Group','Membership Status','Address','Emergency Contact','Emergency Phone','Relationship','Guardian','Guardian Phone','Guardian Consent','Photo URL'];
function setupFbcoStudentSheet() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('FBCO_SPREADSHEET_ID');
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('Faith Baptist Church Ogbomoso | Student Records');
  props.setProperty('FBCO_SPREADSHEET_ID', ss.getId());
  let sheet = ss.getSheetByName('Students') || ss.insertSheet('Students');
  if (sheet.getLastRow() === 0) { sheet.appendRow(HEADERS); sheet.setFrozenRows(1); sheet.getRange(1,1,1,HEADERS.length).setFontWeight('bold'); }
  if (!props.getProperty('FBCO_PHOTO_FOLDER_ID')) props.setProperty('FBCO_PHOTO_FOLDER_ID', DriveApp.createFolder('FBCO Student Photos').getId());
  Logger.log(ss.getUrl());
}
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const expected = PropertiesService.getScriptProperties().getProperty('FBCO_SYNC_SECRET');
    if (!expected || payload.secret !== expected || payload.action !== 'register' || !payload.student) return output({success:false,error:'Unauthorized'});
    return output(saveStudent(payload.student));
  } catch (err) { console.error(err); return output({success:false,error:'Sync failed'}); }
}
function saveStudent(s) {
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const props = PropertiesService.getScriptProperties();
    const sheet = SpreadsheetApp.openById(props.getProperty('FBCO_SPREADSHEET_ID')).getSheetByName('Students');
    const ids = sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues().flat() : [];
    if (ids.includes(s.student_id)) return {success:true,duplicate:true};
    let photoUrl = '';
    if (s.photo && s.photo.data) {
      if (!['image/jpeg','image/png','image/webp'].includes(s.photo.mimeType)) throw new Error('Invalid image type');
      const bytes = Utilities.base64Decode(s.photo.data);
      if (bytes.length > 3*1024*1024) throw new Error('Image too large');
      const ext = s.photo.mimeType === 'image/png' ? 'png' : s.photo.mimeType === 'image/webp' ? 'webp' : 'jpg';
      photoUrl = DriveApp.getFolderById(props.getProperty('FBCO_PHOTO_FOLDER_ID')).createFile(Utilities.newBlob(bytes,s.photo.mimeType,s.student_id+'.'+ext)).getUrl();
    }
    sheet.appendRow([s.student_id,new Date(),s.full_name,s.gender,s.date_of_birth||'',s.phone,s.email||'',s.education_category,s.institution,s.faculty||'',s.department||'',s.course_of_study||'',s.academic_level,s.church_unit||'',s.fellowship_group||'',s.membership_status||'',s.residential_address||'',s.emergency_contact_name||'',s.emergency_contact_phone||'',s.emergency_contact_relationship||'',s.guardian_name||'',s.guardian_phone||'',s.guardian_consent?'Yes':'No',photoUrl]);
    const notify = props.getProperty('FBCO_NOTIFICATION_EMAIL');
    if (notify) MailApp.sendEmail(notify,'New FBCO student registration: '+s.student_id,'New registration: '+s.full_name+' ('+s.student_id+')');
    return {success:true,photoUrl};
  } finally { lock.releaseLock(); }
}
function output(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
