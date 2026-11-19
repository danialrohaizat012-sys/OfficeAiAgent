/**
 * RIZA V1.1 FREE-FIRST / ID-ONLY
 * Google Places Text Search with ONLY places.id (Essentials IDs Only SKU).
 * Saves only Place ID plus original own query/sector and reviewer workflow.
 * Never requests or persists Google-derived business names/contact/address.
 * Doesn't use paid LLMs or send outreach.
 *
 * Requires explicit user activation in Apps Script; no production cron is
 * installed automatically by committing this file.
 */
var RIZA = {
  AGENT: 'riza',
  TAB: 'Riza Leads',
  TZ: 'Asia/Kuala_Lumpur',
  HEADERS: ['Discovered Date','Lead ID','Place ID','Review Link','Research Query',
    'Industry','BinaLab Product','Lead Status','Assigned To','Manual Business Name',
    'Manual Contact','Manual Notes','Source','Last Checked'],
  QUERIES: [
    {query:'kedai motosikal Kota Bharu Kelantan',industry:'Automotive',product:'Custom System'},
    {query:'kedai percetakan Kota Bharu Kelantan',industry:'Printing',product:'Custom System'},
    {query:'restoran Kota Bharu Kelantan',industry:'F&B',product:'Bina Menu'},
    {query:'bengkel kereta Pasir Mas Kelantan',industry:'Automotive',product:'Custom System'},
    {query:'kafe Machang Kelantan',industry:'F&B',product:'Bina Menu'},
    {query:'kedai komputer Tanah Merah Kelantan',industry:'Electronics',product:'Custom System'},
    {query:'restoran Kuala Terengganu',industry:'F&B',product:'Bina Menu'}
  ]
};
function rizaConfig_() {
  var p = PropertiesService.getScriptProperties().getProperties();
  if (!p.PROSPECT_SHEET_ID) throw new Error('PROSPECT_SHEET_ID missing');
  if (!p.GOOGLE_PLACES_API_KEY) throw new Error('GOOGLE_PLACES_API_KEY missing');
  // Fail closed unless specifically enabled; no unreviewed charged feature.
  if (p.RIZA_ENABLE !== 'YES') throw new Error('RIZA_ENABLE must be YES after quota/billing review');
  if (p.RIZA_ALLOW_PAID !== undefined && p.RIZA_ALLOW_PAID !== 'NO') {
    throw new Error('RIZA_ALLOW_PAID must stay NO (or omitted)');
  }
  var daily = Math.max(1, Math.min(10, parseInt(p.DAILY_LEAD_LIMIT || '5',10) || 5));
  var monthly = Math.max(1, Math.min(31, parseInt(p.MONTHLY_REQUEST_LIMIT || '20',10) || 20));
  return { p:p, daily:daily, monthly:monthly };
}
function rizaDate_() { return Utilities.formatDate(new Date(),RIZA.TZ,'yyyy-MM-dd'); }
function rizaMonth_() { return Utilities.formatDate(new Date(),RIZA.TZ,'yyyy-MM'); }
function rizaHeaders_() { return RIZA.HEADERS; }
function rizaSheet_(ss) {
  var sh = ss.getSheetByName(RIZA.TAB);
  if (!sh) {
    sh=ss.insertSheet(RIZA.TAB);
    sh.getRange(1,1,1,RIZA.HEADERS.length).setValues([RIZA.HEADERS]);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,RIZA.HEADERS.length)
      .setBackground('#153443').setFontColor('#ffffff').setFontWeight('bold');
  }
  var headers=sh.getRange(1,1,1,RIZA.HEADERS.length).getValues()[0];
  if (headers.join('|')!==RIZA.HEADERS.join('|'))
    throw new Error('Riza Leads schema differs; refusing to overwrite existing data. Use a new tab or migrate with approval.');
  return sh;
}
function rizaExisting_(ss) {
  var ids={};
  ss.getSheets().forEach(function(sh){
    if(sh.getLastRow()<2) return;
    var cols=Math.min(sh.getLastColumn(),50);
    if(cols<1) return;
    var header=sh.getRange(1,1,1,cols).getDisplayValues()[0].map(function(x){return String(x).trim().toLowerCase();});
    var at=header.indexOf('place id');
    if(at<0) return;
    var values=sh.getRange(2,at+1,sh.getLastRow()-1,1).getDisplayValues();
    values.forEach(function(r){if(r[0])ids[String(r[0])]=true;});
  });
  return ids;
}
function rizaStatus_(c,data) {
  var p=c.p;
  if(!p.MARKAS_URL||!p.MARKAS_AGENT_KEY) return;
  data.agent=RIZA.AGENT;
  var response=UrlFetchApp.fetch(p.MARKAS_URL.replace(/\\/$/,'')+'/api/status',{
    method:'post',contentType:'application/json',
    headers:{Authorization:'Bearer '+p.MARKAS_AGENT_KEY},
    payload:JSON.stringify(data),muteHttpExceptions:true
  });
  if(response.getResponseCode()!==200) Logger.log('Markas status HTTP '+response.getResponseCode());
}
function rizaSearchIds_(key,query) {
  // Only IDs are fetched: DO NOT add displayName, formattedAddress,
  // phone or website. Higher SKUs can generate charges.
  var response=UrlFetchApp.fetch('https://places.googleapis.com/v1/places:searchText',{
    method:'post',contentType:'application/json',
    headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':'places.id'},
    payload:JSON.stringify({textQuery:query,regionCode:'MY',pageSize:20}),
    muteHttpExceptions:true
  });
  if(response.getResponseCode()!==200)
    throw new Error('Places IDs Only HTTP '+response.getResponseCode()+': '+response.getContentText().slice(0,200));
  return (JSON.parse(response.getContentText()).places||[]).map(function(x){return x.id;}).filter(Boolean);
}
function rizaRun_() {
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(15000)) return 'Another run is active';
  var c;
  try {
    c=rizaConfig_();
    var props=PropertiesService.getScriptProperties();
    var today=rizaDate_(), month=rizaMonth_();
    if(props.getProperty('RIZA_LAST_RUN')===today) return 'Already ran today';
    var requests=Number(props.getProperty('RIZA_MONTH_'+month)||0);
    if(requests>=c.monthly) return 'Monthly request cap reached';
    var ss=SpreadsheetApp.openById(c.p.PROSPECT_SHEET_ID),sh=rizaSheet_(ss),seen=rizaExisting_(ss);
    rizaStatus_(c,{sedang:'Cari kandidat menggunakan Places ID-only...',sibuk:true});
    var index=Math.floor(new Date().getTime()/86400000)%RIZA.QUERIES.length;
    var item=RIZA.QUERIES[index];
    // Increment before outgoing call, so a failed call also consumes our internal limit.
    props.setProperty('RIZA_MONTH_'+month,String(requests+1));
    var ids=rizaSearchIds_(c.p.GOOGLE_PLACES_API_KEY,item.query);
    var rows=[];
    ids.forEach(function(placeId){
      if(rows.length>=c.daily||seen[placeId])return;
      seen[placeId]=true;
      var leadId='RIZA-'+today.replace(/-/g,'')+'-'+String(rows.length+1).padStart(2,'0');
      // Review URL derived from Place ID. Business details are NOT copied from Google.
      var link='https://www.google.com/maps/search/?api=1&query=place&query_place_id='+encodeURIComponent(placeId);
      rows.push([today,leadId,placeId,link,item.query,item.industry,item.product,
        'Needs Human Review','Fakhri','','','','Google Places ID-only',today]);
    });
    if(rows.length)sh.getRange(sh.getLastRow()+1,1,rows.length,RIZA.HEADERS.length).setValues(rows);
    props.setProperty('RIZA_LAST_RUN',today);
    var report='RIZA Free-First '+today+'\\n'+rows.length+
      ' candidate IDs (bukan lead disahkan) ditambah ke '+RIZA.TAB+
      '\\nKawasan/kategori: '+item.query+
      '\\nManusia mesti sahkan nama dan butiran terus dari sumber yang sah.'+
      '\\nTiada outreach; tiada SKU berbayar atau AI token digunakan oleh kod ini.';
    rizaStatus_(c,{sedang:rows.length+' calon untuk Fakhri semak',sibuk:false,report:report});
    Logger.log(report);return report;
  } catch(e) {
    if(c)try{rizaStatus_(c,{sedang:'Riza memerlukan semakan konfigurasi',sibuk:false,
      report:String(e.message).slice(0,300),keputusan:'Semak sumber/API dan had penggunaan Riza.'});}catch(ignored){}
    throw e;
  } finally {lock.releaseLock();}
}
function ujiRiza(){return rizaRun_();}
function jalankanRiza(){return rizaRun_();}
function pasangJadual(){
  rizaConfig_();
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='jalankanRiza')ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('jalankanRiza').timeBased().everyDays(1).atHour(9)
    .inTimezone(RIZA.TZ).create();
  Logger.log('Riza scheduled at approx 9am Malaysia, 1 request/day and monthly cap');
}
function hentikanJadual(){
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='jalankanRiza')ScriptApp.deleteTrigger(t);
  });
}
