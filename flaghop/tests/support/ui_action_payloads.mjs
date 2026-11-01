// Exercise the shipped legacy form handlers with a DOM and intercepted HTTP.
// No application server, scanner, capture, installer or network is used.
import {readFileSync} from 'node:fs';
import {Window} from '../../frontend/node_modules/happy-dom/lib/index.js';
const window = new Window({url:'http://owned-ui-fixture.invalid',settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true,disableIframePageLoading:true,enableJavaScriptEvaluation:false}});
for (const name of ['window','document','HTMLElement','HTMLInputElement','Element','Node','getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) {
  const value = name === 'window' ? window : window[name];
  if (value !== undefined) Object.defineProperty(globalThis,name,{value:typeof value==='function' && ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(name)?value.bind(window):value,configurable:true});
}
if(process.argv[2]) window.document.write(readFileSync(process.argv[2],'utf8'));
window.confirm=()=>true;
window.prompt=()=> 'owned fixture';
const deadline=setTimeout(()=>{console.error('Owned action harness deadline exceeded');process.exit(1)},10000);
const requests=[];
const project={name:'fixture.legion',display_name:'Fixture'};
globalThis.fetch=async(url,options={})=>{
  const payload=options.body?JSON.parse(options.body):{};
  if(options.method==='POST')requests.push({url:String(url),payload});
  const body=String(url).startsWith('/api/jobs/') ? {id:1,type:'fixture',status:'completed',result:{}} : {status:'ok',project,jobs:[],processes:[],approvals:[],hosts:[],services:[],findings:[],layouts:[],annotations:[],mode:'deterministic',max_concurrency:1,max_host_concurrency:1,max_jobs:200,engagement_policy:{preset:'internal_recon'},layout:{layout_id:'fixture',...payload},annotation:{annotation_id:'fixture',...payload}};
  return {ok:true,status:200,json:async()=>body};
};
const base='../../app/web/static/js/workspace/';
const names=['scan','scan_policy','tools','host_actions','graph_actions','graph_data','projects','interface_settings','tool_settings','scheduler_preferences','device_categories','live_updates','workspace_data','approvals'];
const modules={};
// React supplies read-only refresh actions in the running workspace. There is
// no React mount here; resolving those refreshes keeps the form test bounded.
const activity=await import(new URL(base+'activity_bridge.js',import.meta.url));
activity.connectReactActivity({update(){},actions:new Proxy({},{get:()=>async()=>{}})});
const callbacks=new Proxy({},{get:()=>()=>{}});
for(const name of names){
  console.error('import',name);
  const module=await import(new URL(base+name+'.js',import.meta.url)); modules[name]=module;
  for(const [key,value]of Object.entries(module))if(key.startsWith('connect')&&typeof value==='function'&&value.length===1)value(callbacks);
}
const state=await import(new URL(base+'state.js',import.meta.url));
function input(id,value='',checked=false){let node=document.getElementById(id);if(!node){node=document.createElement('input');node.id=id;document.body.append(node);}if(node.tagName==='SELECT' && !Array.from(node.options).some(option=>option.value===value)){const option=document.createElement('option');option.value=value;node.append(option);}node.value=value;node.checked=checked;return node;}
for(const [id,value]of Object.entries({'nmap-targets':'192.0.2.10','nmap-easy-top-ports':'100','nmap-hard-top-ports':'100','nmap-rfc-chunk-concurrency':'1','nmap-rfc-profile':'quick','nmap-engagement-preset-select':'internal_recon','scheduler-goal-select':'internal_recon','passive-capture-interface':'owned0','passive-capture-duration':'15','workspace-tool-host-ip':'192.0.2.10','workspace-tool-port':'8080','workspace-tool-protocol':'tcp','workspace-tool-select':'fixture-tool','project-save-path':'/owned/fixture.legion','project-open-path':'/owned/fixture.legion','nmap-import-path':'/owned/fixture.xml','graph-view-select':'attack_surface','graph-layout-name':'Fixture layout','graph-group-select':'subnet','graph-note-input':'Owned note','scheduler-concurrency-input':'1','scheduler-host-concurrency-input':'1','scheduler-max-jobs-input':'200'}))input(id,value);
input('nmap-rfc-192','',true);
const radio=input('mode');radio.name='nmap-scan-mode';radio.type='radio';radio.checked=true;
for(const mode of ['easy','hard','rfc1918_discovery','passive_capture']){
  document.querySelectorAll("input[name='nmap-scan-mode']").forEach(node=>node.checked=false);
  radio.value=mode;radio.checked=true;input('nmap-targets','192.0.2.10');input('nmap-xml-path','/owned/fixture.xml');
  state.nmapWizardState.postSubmitLock=false;
  console.error('scan',mode);await modules.scan.runNmapScan();
}
console.error('action','tools.runManualTool');await modules.tools.runManualTool();
console.error('action','tools.runSchedulerNow');await modules.tools.runSchedulerNow();
console.error('action','projects.saveProjectAs');await modules.projects.saveProjectAs();
console.error('action','projects.openProjectCore');await modules.projects.openProjectCore();
console.error('action','projects.importNmapXml');await modules.projects.importNmapXml();
console.error('action','interface_settings.saveInterfaceSettingsAction');await modules.interface_settings.saveInterfaceSettingsAction();
state.toolAuditState.recommendedPlatform='ubuntu';
console.error('action','tool_settings.startToolInstallAction');await modules.tool_settings.startToolInstallAction();
state.graphWorkspaceState.selectedKind='node';state.graphWorkspaceState.selectedRef='host-1';
console.error('action','graph_actions.graphSaveLayoutAction');await modules.graph_actions.graphSaveLayoutAction();
console.error('action','graph_actions.graphSaveAnnotationAction');await modules.graph_actions.graphSaveAnnotationAction();
console.error('action','host_actions.deleteGraphPortAction');await modules.host_actions.deleteGraphPortAction({hostId:1,hostIp:'192.0.2.10',port:'8080',protocol:'tcp'});
console.error('action','host_actions.deleteGraphServiceAction');await modules.host_actions.deleteGraphServiceAction({hostId:1,hostIp:'192.0.2.10',port:'8080',protocol:'tcp',serviceName:'http'});
console.log(JSON.stringify(requests));
await window.happyDOM.close();
clearTimeout(deadline);
