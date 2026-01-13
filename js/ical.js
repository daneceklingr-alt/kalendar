// Simple iCal export using ics.js when available
function generateICal(events){
    try{
        if(typeof ics === 'function'){
            const cal = ics();
            events.forEach(e=>{
                const start = e.start ? new Date(e.start) : new Date();
                const end = e.end ? new Date(e.end) : new Date(start.getTime()+60*60*1000);
                cal.addEvent(e.title || '', (e.description||''), '', start, end);
            });
            cal.download('household-calendar');
            return;
        }
    }catch(err){ console.warn('ics export failed', err); }
    // fallback: build minimal ICS string
    const members = (typeof loadMembers==='function')? loadMembers() : [];
    function toICalDate(dt){
        if(!dt) return null;
        const d = new Date(dt);
        return d.toISOString().replace(/[-:]|\.\d{3}/g,'') + 'Z';
    }

    let icsLines = [];
    icsLines.push('BEGIN:VCALENDAR');
    icsLines.push('VERSION:2.0');
    icsLines.push('PRODID:-//household-calendar//EN');
    // optionally add a simple VTIMEZONE block when Luxon is available
    try{
        if(window.luxon && typeof window.luxon.DateTime === 'function'){
            const now = window.luxon.DateTime.now();
            const tz = now.zoneName || 'UTC';
            const offsetMin = now.offset; // minutes
            const sign = offsetMin >= 0 ? '+' : '-';
            const absMin = Math.abs(offsetMin);
            const hh = String(Math.floor(absMin/60)).padStart(2,'0');
            const mm = String(absMin%60).padStart(2,'0');
            const tzOffset = sign + hh + mm;
            const dtstart = now.toFormat('yyyyLLdd') + 'T000000';
            icsLines.push('VTIMEZONE');
            icsLines.push('TZID:'+tz);
            icsLines.push('STANDARD');
            icsLines.push('DTSTART:'+dtstart);
            icsLines.push('TZOFFSETFROM:'+tzOffset);
            icsLines.push('TZOFFSETTO:'+tzOffset);
            icsLines.push('END:STANDARD');
            icsLines.push('END:VTIMEZONE');
        }
    }catch(e){ console.warn('VTIMEZONE generation failed', e); }

    events.forEach(e=>{
        const uid = (e.id||('evt-'+Date.now())) + '@household.local';
        const dtstamp = toICalDate(new Date().toISOString());
        const dtstart = toICalDate(e.start);
        const dtend = toICalDate(e.end);
        icsLines.push('BEGIN:VEVENT');
        icsLines.push('UID:' + uid);
        icsLines.push('DTSTAMP:' + dtstamp);
        if(dtstart) icsLines.push('DTSTART:' + dtstart);
        if(dtend) icsLines.push('DTEND:' + dtend);
        // description: include type and member
        const member = members.find(m=>m.id===e.memberId) || members.find(m=>m.name===e.memberId) || null;
        const categories = [];
        if(e.type) categories.push(e.type);
        if(member && member.name) categories.push(member.name);
        if(categories.length) icsLines.push('CATEGORIES:' + categories.join(','));
        let desc = '';
        if(e.type) desc += '['+e.type+'] ';
        if(member && member.name) desc += '[Člen: '+member.name+'] ';
        if(e.description) desc += '\n' + e.description;
        if(desc) icsLines.push('DESCRIPTION:' + desc.replace(/\n/g,'\\n'));
        // RRULE (allow raw RRULE or prefixed)
        if(e.rrule){
            let rule = e.rrule.toString().trim();
            if(/^RRULE:/i.test(rule)) rule = rule.replace(/^RRULE:/i,'');
            icsLines.push('RRULE:' + rule);
        }
        icsLines.push('END:VEVENT');
    });

    icsLines.push('END:VCALENDAR');
    const icsText = icsLines.join('\r\n');
    const blob = new Blob([icsText], {type:'text/calendar;charset=utf-8'});
    if(typeof saveAs === 'function') saveAs(blob, 'household-calendar.ics'); else {
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'household-calendar.ics'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
}
