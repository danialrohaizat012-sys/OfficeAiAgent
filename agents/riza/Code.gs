/**
 * RIZA V2 — OpenStreetMap / Overpass API research queue.
 * No Google Cloud, API key, paid model or automatic outreach.
 * One lightweight public Overpass query per day (31/month default).
 *
 * Source: © OpenStreetMap contributors (ODbL 1.0).
 * https://www.openstreetmap.org/copyright
 *
 * IMPORTANT: Overpass public servers are best-effort/community infrastructure.
 * Do not use for high-volume commercial scraping or production SLA.
 * All prospective leads require human qualification before outreach.
 */
var RIZA = {
  AGENT: 'riza',
  TAB: 'Riza OSM Leads',
  TIMEZONE: 'Asia/Kuala_Lumpur',
  API: 'https://overpass-api.de/api/interpreter',
  HEADERS: [
    'Discovered Date','Lead ID','OSM Element ID','Business Name','Category',
    'Location / Address (OSM)','Public Business Phone','Website','OSM URL',
    'Suggested BinaLab Product','Lead Score','Reason / Verification',
    'Source / License','Lead Status','Assigned To','Research Query','Last Checked'
  ],
  // Small bounded searches rotating through 7 areas to be kind to shared API.
  SEARCHES: [
    { label:'Kota Bharu restaurants', bbox:[6.09,102.21,6.15,102.27],
      tag:'amenity', values:'restaurant|cafe|fast_food', category:'F&B', product:'Bina Menu' },
    { label:'Kota Bharu shops', bbox:[6.09,102.21,6.15,102.27],
      tag:'shop', values:'electronics|computer|mobile_phone|car|motorcycle', category:'Retail / Automotive', product:'Custom System' },
    { label:'Pasir Mas dining', bbox:[6.03,102.12,6.07,102.18],
      tag:'amenity', values:'restaurant|cafe|fast_food', category:'F&B', product:'Bina Menu' },
    { label:'Machang dining', bbox:[5.74,102.20,5.80,102.25],
      tag:'amenity', values:'restaurant|cafe|fast_food', category:'F&B', product:'Bina Menu' },
    { label:'Kota Bharu vehicle services', bbox:[6.08,102.20,6.16,102.28],
      tag:'shop', values:'car_repair|motorcycle_repair|tyres|car_parts|motorcycle', category:'Automotive', product:'Custom System' },
    { label:'Tanah Merah retail', bbox:[5.77,102.13,5.85,102.19],
      tag:'shop', values:'electronics|computer|mobile_phone|motorcycle', category:'Retail', product:'Custom System' },
    { label:'Kuala Terengganu dining', bbox:[5.29,103.10,5.36,103.16],
      tag:'amenity', values:'restaurant|cafe|fast_food', category:'F&B', product:'Bina Menu' }
  ]
};

function rizaSettings_() {
  var p=PropertiesService.getScriptProperties().getProperties();
  if(!p.PROSPECT_SHEET_ID) throw new Error('PROSPECT_SHEET_ID missing in Script Properties');
  if(p.RIZA_ENABLE!=='YES') throw new Error('Set RIZA_ENABLE=YES after review, or keep NO to stop');
  var daily=Math.max(1,Math.min(10,parseInt(p.DAILY_LEAD_LIMIT||'5',10)||5));
  var monthly=Math.max(1,Math.min(31,parseInt(p.MONTHLY_REQUEST_LIMIT||'31',10)||20));
  return {properties:p,daily:daily,monthly:monthly};
}
function rizaDate_() {
  return Utilities.formatDate(new Date(),RIZA.TIMEZONE,'yyyy-MM-dd');
}
function rizaMonth_() {
  return Utilities.formatDate(new Date(),RIZA.TIMEZONE,'yyyy-MM');
}
function rizaNormalize_(value) {
  return String(value||'').toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]/g,'');
}
function rizaSheet_(ss) {
  var sh=ss.getSheetByName(RIZA.TAB);
  if(!sh) {
    sh=ss.insertSheet(RIZA.TAB);
    sh.getRange(1,1,1,RIZA.HEADERS.length).setValues([RIZA.HEADERS]);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,RIZA.HEADERS.length).setBackground('#153443').setFontColor('white').setFontWeight('bold');
  }
  var got=sh.getRange(1,1,1,RIZA.HEADERS.length).getValues()[0];
  if(got.join('|')!==RIZA.HEADERS.join('|')) throw new Error('Riza OSM Leads schema mismatch; no rows written');
  return sh;
}
function rizaDedup_(ss) {
  var ids={},names={};
  ss.getSheets().forEach(function(sh) {
    if(sh.getLastRow()<2||sh.getLastColumn()<1)return;
    var n=Math.min(sh.getLastColumn(),40);
    var head=sh.getRange(1,1,1,n).getDisplayValues()[0].map(function(x){return String(x).trim().toLowerCase();});
    var idCol=head.indexOf('osm element id');
    var nameCol=head.indexOf('business name');
    if(idCol<0&&nameCol<0)return;
    // Upper bound protects Apps Script runtime from huge spreadsheets.
    var count=Math.min(sh.getLastRow()-1,15000);
    var rows=sh.getRange(2,1,count,n).getDisplayValues();
    rows.forEach(function(r){
      if(idCol>=0&&r[idCol])ids[r[idCol]]=true;
      if(nameCol>=0&&r[nameCol])names[rizaNormalize_(r[nameCol])]=true;
    });
  });
  return {ids:ids,names:names};
}
function rizaNotify_(config,payload) {
  var p=config.properties;
  if(!p.MARKAS_URL||!p.MARKAS_AGENT_KEY)return;
  payload.agent=RIZA.AGENT;
  var resp=UrlFetchApp.fetch(p.MARKAS_URL.replace(/\/$/,'')+'/api/status',{
    method:'post',contentType:'application/json',
    headers:{Authorization:'Bearer '+p.MARKAS_AGENT_KEY},
    payload:JSON.stringify(payload),muteHttpExceptions:true
  });
  if(resp.getResponseCode()!==200)Logger.log('Markas HTTP '+resp.getResponseCode());
}
function rizaOverpass_(query) {
  var url=RIZA.API;
  var result=UrlFetchApp.fetch(url,{
    method:'post',contentType:'application/x-www-form-urlencoded; charset=UTF-8',
    payload:'data='+encodeURIComponent(query),muteHttpExceptions:true,
    headers:{'User-Agent':'BinaLab-Riza-Prospecting/2.0 (lightweight community OSM research)'}
  });
  var status=result.getResponseCode();
  if(status!==200)throw new Error('Overpass HTTP '+status+
    ' (server busy/rate limit? No automatic retry). '+result.getContentText().slice(0,120));
  var data=JSON.parse(result.getContentText());
  if(!Array.isArray(data.elements))throw new Error('Overpass returned no elements array');
  return data.elements;
}
function rizaQuery_(spec) {
  var b=spec.bbox.join(',');
  // A single bounded query across nodes/ways/relations, and return tags + way centre.
  return '[out:json][timeout:20];(nwr["'+spec.tag+'"~"^('+spec.values+')$"]('+b+'););out center 100;';
}
function rizaScore_(el) {
  var t=el.tags||{};
  var score=40;
  if(t.name)score+=20;
  if(t.website||t['contact:website'])score+=10;
  if(t.phone||t['contact:phone'])score+=10;
  if(t['addr:street'])score+=5;
  return Math.min(score,85);
}
function rizaAddress_(t) {
  return [t['addr:housenumber'],t['addr:street'],t['addr:city'],t['addr:state']]
    .filter(Boolean).join(', ');
}
function rizaRun_() {
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))return 'Other Riza run in progress';
  var c;
  try {
    c=rizaSettings_();
    var props=PropertiesService.getScriptProperties(),today=rizaDate_(),month=rizaMonth_();
    if(props.getProperty('RIZA_LAST_RUN')===today)return 'Already ran today; no extra request';
    var used=Number(props.getProperty('RIZA_MONTH_'+month)||0);
    if(used>=c.monthly)return 'Monthly Overpass request cap reached';
    var ss=SpreadsheetApp.openById(c.properties.PROSPECT_SHEET_ID);
    var sh=rizaSheet_(ss),existing=rizaDedup_(ss);
    var dateIndex=Math.floor(new Date().getTime()/86400000)%RIZA.SEARCHES.length;
    var spec=RIZA.SEARCHES[dateIndex];
    rizaNotify_(c,{sedang:'Riza mencari prospek OSM: '+spec.label,sibuk:true});
    // Consume internal request allowance BEFORE request; prevent repeat on network error.
    props.setProperty('RIZA_MONTH_'+month,String(used+1));
    props.setProperty('RIZA_LAST_RUN',today);
    var entries=rizaOverpass_(rizaQuery_(spec)),rows=[],skipped=0;
    for(var i=0;i<entries.length&&rows.length<c.daily;i++) {
      var el=entries[i],t=el.tags||{},name=String(t.name||'').trim();
      if(!name)continue;
      var id=el.type+'/'+el.id, key=rizaNormalize_(name);
      if(existing.ids[id]||existing.names[key]){skipped++;continue;}
      existing.ids[id]=true;existing.names[key]=true;
      var leadId='OSM-'+today.replace(/-/g,'')+'-'+String(rows.length+1).padStart(2,'0');
      var category=String(t.shop||t.amenity||spec.category);
      var phone=String(t['contact:phone']||t.phone||'');
      var website=String(t['contact:website']||t.website||'');
      var osmUrl='https://www.openstreetmap.org/'+el.type+'/'+el.id;
      rows.push([today,leadId,id,name,category,rizaAddress_(t),phone,website,
        osmUrl,spec.product,rizaScore_(el),
        'OSM listing; verify business is active, contact details and product fit before outreach',
        '© OpenStreetMap contributors · ODbL 1.0 · https://www.openstreetmap.org/copyright',
        'Needs Human Review','Fakhri',spec.label,today]);
    }
    if(rows.length)sh.getRange(sh.getLastRow()+1,1,rows.length,RIZA.HEADERS.length).setValues(rows);
    var report='RIZA OSM '+today+'\n'+rows.length+' prospek kandidat baharu, '+skipped+
      ' pendua dilepas; kawasan '+spec.label+
      '\nSumber: © OpenStreetMap contributors (ODbL); pengesahan manual diperlukan.'+
      '\nTiada outreach dan tiada API berbayar digunakan.';
    rizaNotify_(c,{sedang:rows.length+' calon baharu untuk Fakhri',sibuk:false,report:report});
    Logger.log(report);return report;
  } catch(err) {
    Logger.log('Riza error: '+err.message);
    if(c)try{rizaNotify_(c,{sedang:'Ralat Overpass / Apps Script',sibuk:false,
      report:String(err.message).slice(0,250),keputusan:'Riza perlukan semakan; jangan retry bertubi-tubi pada API awam.'});}catch(ignored){}
    throw err;
  }finally{lock.releaseLock();}
}
function ujiRiza(){return rizaRun_();}
function jalankanRiza(){return rizaRun_();}
function pasangJadual(){
  rizaSettings_();
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='jalankanRiza')ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('jalankanRiza').timeBased().everyDays(1).atHour(9)
    .inTimezone(RIZA.TIMEZONE).create();
  Logger.log('Riza scheduled once daily around 9am MYT');
}
function hentikanJadual(){
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='jalankanRiza')ScriptApp.deleteTrigger(t);
  });
}
