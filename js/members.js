// Members management and default seeding
function ensureDefaultMembers(){
    let members = loadMembers();
    if(!members || members.length===0){
        members = [
            { id:'m-1', name:'Jan', color:'#1F77B4', isAdmin:true },
            { id:'m-2', name:'Petra', color:'#FF7F0E', isAdmin:false },
            { id:'m-3', name:'Eva', color:'#2CA02C', isAdmin:false }
        ];
        saveMembers(members);
    }
    return members;
}

function colorForMember(memberId){
    const members = loadMembers();
    const m = members.find(x=>x.id===memberId || x.name===memberId);
    return m? m.color : '#9467BD';
}

function addMember(member){
    const members = loadMembers();
    members.push(member);
    saveMembers(members);
}

function updateMember(id, props){
    const members = loadMembers();
    const idx = members.findIndex(m=>m.id===id);
    if(idx===-1) throw new Error('Member not found');
    members[idx] = Object.assign({}, members[idx], props);
    saveMembers(members);
}

function removeMember(id){
    let members = loadMembers();
    members = members.filter(m=>m.id!==id);
    saveMembers(members);
}
