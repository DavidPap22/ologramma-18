const SECRET_TOKEN = 'INVITO123'; // cambialo prima di pubblicare


function getQueryParam(name){
const url = new URL(window.location.href);
return url.searchParams.get(name);
}


function unlock(){
document.getElementById('protected-overlay').classList.add('hidden');
document.getElementById('content').classList.remove('hidden');
}


function lock(){
document.getElementById('protected-overlay').classList.remove('hidden');
document.getElementById('content').classList.add('hidden');
}


window.addEventListener('DOMContentLoaded', ()=>{
const q = getQueryParam('token');
if(q && q === SECRET_TOKEN){
unlock();
return;
}
lock();
const form = document.getElementById('tokenForm');
form.addEventListener('submit', e=>{
e.preventDefault();
const v = document.getElementById('token').value.trim();
if(v === SECRET_TOKEN) unlock();
else alert('Codice errato');
});
});