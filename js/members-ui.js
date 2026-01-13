// Members UI: open modal, render list, add/edit/delete members
window.openMembersModal = function(){
    const placeholder = document.getElementById('eventModalPlaceholder');
    if(!placeholder) { if(typeof showToast==='function') showToast('Placeholder chybí','danger'); return; }
    if(!document.getElementById('membersModal')){
        fetch('templates/members-modal.html').then(r=>r.text()).then(html=>{ placeholder.insertAdjacentHTML('beforeend', html); bind(); }).catch(err=>{ console.warn(err); if(typeof showToast==='function') showToast('Nelze načíst modal členů','danger'); });
    } else bind();

    function bind(){
        const modalEl = document.getElementById('membersModal');
        const membersList = modalEl.querySelector('#membersList');
        const form = modalEl.querySelector('#memberForm');
        const addBtn = modalEl.querySelector('#addMemberBtn');
        const saveBtn = modalEl.querySelector('#saveMemberBtn');
        const deleteBtn = modalEl.querySelector('#deleteMemberBtn');

        function renderList(){
            const members = loadMembers();
            membersList.innerHTML = members.map(m=>`<li class="list-group-item d-flex align-items-center justify-content-between" data-id="${m.id}"><div><span class="event-color-swatch" style="background:${m.color}"></span> ${m.name} ${m.isAdmin?'<span class="badge bg-primary ms-2">admin</span>':''}</div><div><button class="btn btn-sm btn-outline-secondary btn-edit">Upravit</button></div></li>`).join('');
            membersList.querySelectorAll('.btn-edit').forEach(btn=>{ btn.addEventListener('click', function(e){ const li = e.target.closest('li'); selectMember(li.getAttribute('data-id')); }); });
        }

        function selectMember(id){ const members = loadMembers(); const m = members.find(x=>x.id===id); if(!m) return; form.id.value = m.id; form.name.value = m.name; form.color.value = m.color || '#9467BD'; form.isAdmin.checked = !!m.isAdmin; }
        function clearForm(){ form.id.value=''; form.name.value=''; form.color.value='#1F77B4'; form.isAdmin.checked=false; }

        addBtn.onclick = function(){
            const name = form.name.value.trim(); if(!name){ if(typeof showToast==='function') showToast('Zadejte jméno','warning'); return; }
            const member = { id: 'm-'+Date.now(), name: name, color: form.color.value || '#9467BD', isAdmin: !!form.isAdmin.checked };
            try{ const members = loadMembers(); members.push(member); saveMembers(members); renderList(); clearForm(); if(typeof showToast==='function') showToast('Člen přidán','success'); if(window.hhCalendar && typeof window.hhCalendar.refetchEvents==='function') window.hhCalendar.refetchEvents(); }catch(e){ console.error(e); if(typeof showToast==='function') showToast('Chyba při přidání','danger'); }
        };

        saveBtn.onclick = function(){
            const id = form.id.value; if(!id){ if(typeof showToast==='function') showToast('Vyberte člena k úpravě','warning'); return; }
            const members = loadMembers(); const idx = members.findIndex(x=>x.id===id); if(idx===-1) { if(typeof showToast==='function') showToast('Člen nenalezen','danger'); return; }
            members[idx].name = form.name.value.trim() || members[idx].name;
            members[idx].color = form.color.value || members[idx].color;
            members[idx].isAdmin = !!form.isAdmin.checked;
            saveMembers(members); renderList(); if(typeof showToast==='function') showToast('Člen upraven','success'); if(window.hhCalendar && typeof window.hhCalendar.refetchEvents==='function') window.hhCalendar.refetchEvents();
        };

        deleteBtn.onclick = function(){ const id = form.id.value; if(!id){ if(typeof showToast==='function') showToast('Vyberte člena k odstranění','warning'); return; } if(!confirm('Opravdu smazat člena?')) return; const members = loadMembers(); const remaining = members.filter(x=>x.id!==id); saveMembers(remaining); renderList(); clearForm(); if(typeof showToast==='function') showToast('Člen smazán','success'); if(window.hhCalendar && typeof window.hhCalendar.refetchEvents==='function') window.hhCalendar.refetchEvents(); };

        // open modal
        const bs = new bootstrap.Modal(modalEl, { backdrop:'static' });
        renderList(); clearForm(); bs.show();
    }
};
