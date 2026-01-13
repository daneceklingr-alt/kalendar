// Calendar logic and minimal FullCalendar integration
window.initFullCalendar = function(){
    try{
        const calendarEl = document.getElementById('calendar');
        if(!calendarEl) return;
        const Calendar = window.FullCalendar.Calendar;
        const calendar = new Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
            events: function(fetchInfo, successCallback){
                const stored = loadEvents() || [];
                const results = [];
                stored.forEach(e=>{
                    // Non-recurring: push as-is
                    if(!e.rrule){
                        results.push({
                            id: e.id,
                            title: e.title,
                            start: e.start,
                            end: e.end,
                            backgroundColor: e.color || e.backgroundColor || undefined,
                            borderColor: e.color || undefined,
                            extendedProps: { memberId: e.memberId, type: e.type, description: e.description }
                        });
                        return;
                    }

                    // Recurring: try to expand using rrule.js
                    try{
                        const windowStart = fetchInfo.start;
                        const windowEnd = fetchInfo.end;
                        // build RRULE string; allow both 'FREQ=...' and 'RRULE:...'
                        let ruleText = (e.rrule||'').toString().trim();
                        if(!ruleText) return;
                        if(!/^RRULE:/i.test(ruleText)) ruleText = 'RRULE:' + ruleText;
                        // include DTSTART for correct expansion
                        const dtstart = e.start ? new Date(e.start) : new Date();
                        const dtStr = dtstart.toISOString().replace(/[-:]|\.\d{3}/g,'');
                        const full = 'DTSTART:' + dtStr + '\n' + ruleText;
                        // use rrulestr if available
                        let rset = null;
                        if(typeof rrulestr === 'function'){
                            rset = rrulestr(full);
                        } else if(window.rrulestr){
                            rset = window.rrulestr(full);
                        } else if(window.RRule && typeof window.RRule.fromString==='function'){
                            // fallback: attempt simple fromString (may not support DTSTART)
                            const ro = window.RRule.fromString(e.rrule);
                            ro.options.dtstart = dtstart;
                            rset = ro;
                        }

                        if(rset && typeof rset.between === 'function'){
                            const occ = rset.between(windowStart, windowEnd, true);
                            occ.forEach((occDate, idx)=>{
                                // create instance event
                                const instStart = new Date(occDate);
                                let instEnd = null;
                                if(e.end) instEnd = new Date(new Date(e.end).getTime() - new Date(e.start).getTime() + instStart.getTime());
                                const instanceId = e.id + '_' + instStart.toISOString();
                                results.push({
                                    id: instanceId,
                                    title: e.title,
                                    start: instStart.toISOString(),
                                    end: instEnd? instEnd.toISOString() : null,
                                    backgroundColor: e.color || undefined,
                                    borderColor: e.color || undefined,
                                    extendedProps: { memberId: e.memberId, type: e.type, description: e.description, rrule: e.rrule }
                                });
                            });
                        } else {
                            // if parsing failed, fallback to single event
                            results.push({ id: e.id, title: e.title, start: e.start, end: e.end, backgroundColor: e.color, borderColor: e.color, extendedProps:{ memberId: e.memberId, type: e.type, description: e.description, rruleError: true } });
                        }
                    }catch(er){
                        console.warn('RRULE expand failed for event', e.id, er);
                        results.push({ id: e.id, title: e.title, start: e.start, end: e.end, backgroundColor: e.color, borderColor: e.color, extendedProps:{ memberId: e.memberId, type: e.type, description: e.description, rruleError: true, rruleErrorMsg: (er && er.message) ? er.message : String(er) } });
                    }
                });
                successCallback(results);
            },
            eventClick: function(info){ if(typeof openEventModal === 'function') openEventModal(info.event.id); },
            eventContent: function(arg){
                const members = loadMembers();
                const member = members.find(m=>m.id===arg.event.extendedProps.memberId || m.name===arg.event.extendedProps.memberId) || null;
                const color = arg.event.backgroundColor || (member? member.color : '#9467BD');
                const memberName = member? member.name : (arg.event.extendedProps.memberId || '');
                const html = '<div class="fc-event-custom">'
                    + '<span class="event-color-swatch" style="background:'+color+'"></span>'
                    + '<span class="fc-event-title">'+ (arg.event.title || '') +'</span>'
                    + '<div class="fc-event-member text-muted" style="font-size:0.75em">'+ memberName +'</div>'
                    + '</div>';
                return { html: html };
            }
        });
        calendar.render();
        window.hhCalendar = calendar;
    }catch(e){ console.warn('FullCalendar init failed', e); }
};

window.openEventModal = function(eventId){
    const placeholder = document.getElementById('eventModalPlaceholder');
    function insertTemplate(html){
        placeholder.innerHTML = html;
        bindModal();
    }

    function bindModal(){
        const modalEl = document.getElementById('eventModal');
        if(!modalEl) return;
        // populate members
        const sel = modalEl.querySelector('select[name="memberId"]');
        if(sel){
            const members = loadMembers();
            sel.innerHTML = members.map(m=>`<option value="${m.id}">${m.name}</option>`).join('');
        }

        // helpers for date formatting
        function toInputLocal(iso){ if(!iso) return ''; const d = new Date(iso); const tzOffset = d.getTimezoneOffset()*60000; const local = new Date(d.getTime()-tzOffset); return local.toISOString().slice(0,16); }
        function fromInputLocal(val){ if(!val) return null; const d = new Date(val); return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString(); }

        const form = modalEl.querySelector('#eventForm');
        const saveBtn = modalEl.querySelector('#saveEventBtn');
        const deleteBtn = modalEl.querySelector('#deleteEventBtn');

        // fill or reset
        const events = loadEvents();
        let current = null;
        if(eventId){ current = events.find(e=>e.id===eventId) || null; }
        if(current){
            form.title.value = current.title || '';
            form.type.value = current.type || 'schůzka';
            form.memberId.value = current.memberId || '';
            form.start.value = toInputLocal(current.start);
            form.end.value = toInputLocal(current.end);
            form.recurrence.value = current.rrule || '';
            form.description.value = current.description || '';
            deleteBtn.style.display = 'inline-block';
        } else {
            form.reset();
            form.start.value = toInputLocal(new Date().toISOString());
            form.end.value = toInputLocal(new Date(Date.now()+60*60*1000).toISOString());
            deleteBtn.style.display = 'none';
        }

        // unbind previous listeners
        saveBtn.onclick = null;
        deleteBtn.onclick = null;

        saveBtn.addEventListener('click', function(){
            // basic validation
            if(!form.title.value || !form.start.value){
                if(typeof showToast==='function') showToast('Vyplňte prosím název a start události.','warning'); else alert('Vyplňte prosím název a start události.');
                return;
            }
            const parsedStart = fromInputLocal(form.start.value);
            const parsedEnd = fromInputLocal(form.end.value);
            if(parsedEnd && new Date(parsedEnd) <= new Date(parsedStart)){
                if(typeof showToast==='function') showToast('Konec musí být po začátku.','warning'); else alert('Konec musí být po začátku.');
                return;
            }

            const evt = {
                id: current? current.id : ('evt-'+Date.now()+'-'+Math.floor(Math.random()*1000)),
                title: form.title.value || 'Událost',
                type: form.type.value || 'schůzka',
                memberId: form.memberId.value || (loadMembers()[0] && loadMembers()[0].id) || 'm-1',
                start: parsedStart || new Date().toISOString(),
                end: parsedEnd || null,
                rrule: form.recurrence.value || null,
                description: form.description.value || '',
                visibility: current? current.visibility || 'public' : 'public',
                createdBy: localStorage.getItem('hhcal.role')||'user',
                createdAt: current? current.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            // set display color based on member
            try{ evt.color = colorForMember(evt.memberId); }catch(e){ evt.color = '#9467BD'; }
            saveEvent(evt);
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
        });

        deleteBtn.addEventListener('click', function(){
            if(!current) { const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl); modal.hide(); return; }
            if(confirm('Opravdu smazat událost?')){
                deleteEvent(current.id);
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
            }
        });

        // show modal
        const bsModal = new bootstrap.Modal(modalEl, { backdrop: 'static' });
        bsModal.show();
    }

    // if template not yet loaded, try fetch, otherwise fallback to inline template
    if(!placeholder) { if(typeof showToast==='function') showToast('Modal placeholder chybí','danger'); else alert('Modal placeholder chybí'); return; }
    if(!document.getElementById('eventModal')){
        fetch('templates/event-modal.html').then(r=>r.text()).then(html=>{
            insertTemplate(html);
        }).catch(err=>{
            // fallback template (minimal)
            const fallback = `
<div class="modal fade" id="eventModal" tabindex="-1" aria-hidden="true">\n  <div class="modal-dialog modal-dialog-centered">\n    <div class="modal-content">\n      <div class="modal-header">\n        <h5 class="modal-title">Událost</h5>\n        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>\n      </div>\n      <div class="modal-body">\n        <form id="eventForm">\n          <div class="mb-2"><label class="form-label">Název</label><input name="title" class="form-control" required></div>\n          <div class="mb-2"><label class="form-label">Typ</label><select name="type" class="form-select"><option>schůzka</option><option>úklid</option><option>návštěva</option><option>deadline</option></select></div>\n          <div class="mb-2"><label class="form-label">Člen</label><select name="memberId" class="form-select"></select></div>\n          <div class="mb-2"><label class="form-label">Start</label><input name="start" type="datetime-local" class="form-control"></div>\n          <div class="mb-2"><label class="form-label">Konec</label><input name="end" type="datetime-local" class="form-control"></div>\n          <div class="mb-2"><label class="form-label">Opakování (text nebo RRULE)</label><input name="recurrence" class="form-control"></div>\n          <div class="mb-2"><label class="form-label">Popis</label><textarea name="description" class="form-control"></textarea></div>\n        </form>\n      </div>\n      <div class="modal-footer">\n        <button type="button" class="btn btn-danger" id="deleteEventBtn">Smazat</button>\n        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zrušit</button>\n        <button type="button" class="btn btn-primary" id="saveEventBtn">Uložit</button>\n      </div>\n    </div>\n  </div>\n</div>`;
            insertTemplate(fallback);
        });
    } else {
        bindModal();
    }
};

window.saveEvent = function(eventObj){
    const events = loadEvents();
    // simplistic save (append/update)
    const idx = events.findIndex(e=>e.id===eventObj.id);
    if(idx>-1) events[idx]=eventObj; else events.push(eventObj);
    saveEvents(events);
    if(window.hhCalendar && typeof window.hhCalendar.refetchEvents==='function') window.hhCalendar.refetchEvents();
};

window.deleteEvent = function(id){
    let events = loadEvents();
    events = events.filter(e=>e.id!==id);
    saveEvents(events);
    if(window.hhCalendar && typeof window.hhCalendar.refetchEvents==='function') window.hhCalendar.refetchEvents();
};

window.getEventsInRange = function(start, end){
    const events = loadEvents();
    return events.filter(e=>{ const s = new Date(e.start); const en = new Date(e.end); return s>=start && s<=end; });
};
