// Simple localStorage persistence with versioning
const META_KEY = 'hhcal.meta';
const EVENTS_KEY = 'hhcal.events.v1';
const MEMBERS_KEY = 'hhcal.members.v1';

function loadEvents(){
    try{ const raw = localStorage.getItem(EVENTS_KEY); return raw? JSON.parse(raw): []; }catch(e){ console.error(e); return []; }
}
function saveEvents(events){ localStorage.setItem(EVENTS_KEY, JSON.stringify(events)); }

function loadMembers(){ try{ const raw = localStorage.getItem(MEMBERS_KEY); return raw? JSON.parse(raw): []; }catch(e){ return []; } }
function saveMembers(members){ localStorage.setItem(MEMBERS_KEY, JSON.stringify(members)); }

function getMeta(){ try{ const raw = localStorage.getItem(META_KEY); return raw? JSON.parse(raw): { schemaVersion:1 }; }catch(e){ return { schemaVersion:1 }; } }
function setMeta(meta){ localStorage.setItem(META_KEY, JSON.stringify(meta)); }

function migrateStorage(oldVersion){
    // placeholder for future migrations
    console.log('migrateStorage from', oldVersion);
}
