// CSV import using PapaParse
function handleCsvImport(file){
    if(!file) return;
    Papa.parse(file, { header:true, skipEmptyLines:true, complete:function(results){
        console.log('CSV parsed', results);
        const rows = results.data;
        const events = loadEvents();
        let added=0, recurringCount=0, skipped=0;
        rows.forEach(r=>{
            try{
                const ev = rowToEvent(r);
                events.push(ev);
                added++;
                if(ev.rrule) recurringCount++;
            }catch(e){ skipped++; console.warn('CSV row skipped', e); }
        });
        saveEvents(events);
        if(window.hhCalendar && typeof window.hhCalendar.refetchEvents==='function') window.hhCalendar.refetchEvents();
        let msg = 'Import dokončen: ' + added + ' položek.';
        if(recurringCount>0) msg += ' Z toho ' + recurringCount + ' opakujících se událostí.';
        if(skipped>0) msg += ' Přeskočeno: ' + skipped + '.';
        if(typeof showToast==='function') showToast(msg,'success'); else alert(msg);
    }});
}

function rowToEvent(row){
    // Expect columns: title,type,member,start,end,recurrence,description,visibility
    const id = 'evt-' + Date.now() + '-' + Math.floor(Math.random()*1000);
    const start = row.start || row.date;
    const end = row.end || row.end_date || null;
    const rrule = textToRRule(row.recurrence || '');
    return {
        id: id,
        title: row.title || 'Událost',
        type: row.type || 'schůzka',
        memberId: row.member || 'unknown',
        start: start,
        end: end,
        rrule: rrule,
        description: row.description || '',
        color: (function(){ try{ return colorForMember(row.member || 'unknown'); }catch(e){ return '#9467BD'; } })(),
        visibility: row.visibility || 'public',
        createdBy: localStorage.getItem('hhcal.role')||'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function textToRRule(text){
    if(!text) return null;
    const t = text.toLowerCase().trim();
    if(t.includes('každé úterý') || t.includes('kazde utery') || t.includes('tuesday')) return 'FREQ=WEEKLY;BYDAY=TU';
    if(t.includes('každý den') || t.includes('daily') ) return 'FREQ=DAILY';
    // fallback: if looks like RRULE already
    if(t.startsWith('freq') || t.toUpperCase().startsWith('RRULE')) return t.toUpperCase();
    return null;
}
