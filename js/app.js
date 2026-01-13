// Entrypoint and UI bindings
window.initCalendar = function(){
    console.log('initCalendar');
    // seed members
    if(typeof ensureDefaultMembers === 'function') ensureDefaultMembers();
    // bind UI
    const csvInput = document.getElementById('csvInput');
    if(csvInput) csvInput.addEventListener('change', function(e){ if(e.target.files && e.target.files.length) handleCsvImport(e.target.files[0]); });
    const btnExport = document.getElementById('btnExport');
    if(btnExport) btnExport.addEventListener('click', function(){ const events = loadEvents(); if(typeof generateICal === 'function') generateICal(events); else showToast('iCal modul chybí', 'warning'); });
    const btnNew = document.getElementById('btnNew');
    if(btnNew) btnNew.addEventListener('click', function(){ if(typeof openEventModal === 'function') openEventModal(null); });
    const btnMembers = document.getElementById('btnMembers');
    if(btnMembers){ btnMembers.addEventListener('click', function(){ if(typeof openMembersModal === 'function') openMembersModal(); else { fetch('templates/members-modal.html').then(r=>r.text()).then(html=>{ document.getElementById('eventModalPlaceholder').insertAdjacentHTML('beforeend', html); if(typeof openMembersModal === 'function') openMembersModal(); }).catch(err=>{ console.warn(err); if(typeof showToast==='function') showToast('Nelze načíst modal členů','danger'); }); } }); }
    const btnBackup = document.getElementById('btnBackup');
    if(btnBackup) btnBackup.addEventListener('click', function(){
        try{
            const events = loadEvents();
            const members = loadMembers();
            const meta = getMeta();
            const payload = { meta: meta, events: events, members: members };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            if(typeof saveAs === 'function') saveAs(blob, 'hhcal-backup-' + new Date().toISOString().slice(0,10) + '.json');
            if(typeof showToast === 'function') showToast('Záloha stažena','success');
        }catch(e){ console.error(e); if(typeof showToast === 'function') showToast('Chyba při vytváření zálohy','danger'); }
    });
    // Restore from JSON backup
    const btnRestore = document.getElementById('btnRestore');
    const backupInput = document.getElementById('backupInput');
    if(btnRestore && backupInput){
        btnRestore.addEventListener('click', function(){ backupInput.click(); });
        backupInput.addEventListener('change', function(e){
            const file = e.target.files && e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = function(ev){
                try{
                    const payload = JSON.parse(ev.target.result);
                    if(!payload || (!payload.events && !payload.members)){
                        if(typeof showToast === 'function') showToast('Neplatný formát zálohy','danger'); else alert('Neplatný formát zálohy');
                        return;
                    }
                    const proceed = confirm('Obnovit data ze zálohy? Aktuální data budou zálohována a přepsána.');
                    if(!proceed) return;
                    // create backup of current data
                    const now = new Date().toISOString();
                    const currentBackup = { meta: getMeta(), events: loadEvents(), members: loadMembers(), timestamp: now };
                    try{ localStorage.setItem('hhcal.backup.'+now, JSON.stringify(currentBackup)); }catch(err){ console.warn('Could not write backup to localStorage', err); }
                    // write new data
                    if(payload.meta) setMeta(payload.meta);
                    if(Array.isArray(payload.events)) saveEvents(payload.events);
                    if(Array.isArray(payload.members)) saveMembers(payload.members);
                    if(typeof showToast === 'function') showToast('Obnova dokončena','success');
                    if(window.hhCalendar && typeof window.hhCalendar.refetchEvents==='function') window.hhCalendar.refetchEvents();
                }catch(err){ console.error('Restore failed', err); if(typeof showToast === 'function') showToast('Chyba při obnově: ' + (err && err.message? err.message : ''),'danger'); }
            };
            reader.readAsText(file);
            // reset input
            backupInput.value = '';
        });
    }
    const roleSwitcher = document.getElementById('roleSwitcher');
    const role = localStorage.getItem('hhcal.role') || 'user';
    if(roleSwitcher) { roleSwitcher.value = role; roleSwitcher.addEventListener('change', function(){ localStorage.setItem('hhcal.role', roleSwitcher.value); if(typeof applyRole === 'function') applyRole(roleSwitcher.value); }); }
    if(typeof applyRole === 'function') applyRole(role);
    // initialize calendar renderer
    if(typeof initFullCalendar === 'function') initFullCalendar();
    // initialize Bootstrap tooltips
    try{
        const ttTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        ttTriggerList.forEach(function (el) { new bootstrap.Tooltip(el); });
    }catch(e){ /* ignore if bootstrap not present */ }
};

window.applyRole = function(role){
    console.log('Applied role:', role);
    // UI enforcement can be implemented here
};

window.showToast = function(message, type){
        try{
                const container = document.getElementById('toastContainer');
                if(!container) { alert(message); return; }
                const toastId = 't' + Date.now();
                const bg = (type==='warning')? 'bg-warning text-dark' : (type==='danger'? 'bg-danger text-white' : (type==='success'? 'bg-success text-white' : 'bg-light text-dark'));
                const html = `<div id="${toastId}" class="toast ${bg} border shadow" role="alert" aria-live="assertive" aria-atomic="true">
                        <div class="d-flex">
                            <div class="toast-body">${message}</div>
                            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Zavřít"></button>
                        </div>
                    </div>`;
                const temp = document.createElement('div'); temp.innerHTML = html; const node = temp.firstElementChild;
                container.appendChild(node);
                const bs = new bootstrap.Toast(node, { delay: 5000 }); bs.show();
                node.addEventListener('hidden.bs.toast', ()=>{ try{ node.remove(); }catch(e){} });
        }catch(e){ console.warn('showToast failed', e); alert(message); }
};
