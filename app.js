const history = [];
const chat = document.getElementById('chat');
const status = document.getElementById('status');
function addMessage(role, content) {
  const p = document.createElement('div'); p.className = 'message ' + role;
  // Linkify without inserting untrusted HTML.
  const regex = /https?:\/\/[^\s<>"']+/g;
  let last = 0;
  for (const match of content.matchAll(regex)) {
    p.append(document.createTextNode(content.slice(last, match.index)));
    const a = document.createElement('a'); a.href = match[0]; a.textContent = match[0];
    a.target = '_blank'; a.rel = 'noopener noreferrer'; p.append(a);
    last = match.index + match[0].length;
  }
  p.append(document.createTextNode(content.slice(last)));
  chat.append(p); chat.scrollTop = chat.scrollHeight;
}
document.getElementById('chatForm').addEventListener('submit', async e => {
  e.preventDefault(); const input = document.getElementById('question');
  const content = input.value.trim(); if (!content) return;
  document.querySelector('.hint')?.remove(); input.value = ''; status.textContent = 'Gemma is thinking...';
  const btn = document.getElementById('send'); btn.disabled = true;
  history.push({role:'user',content}); addMessage('user',content);
  try {
    const r = await fetch('/api/chat', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history})});
    const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Request failed');
    history.push({role:'assistant',content:data.answer}); addMessage('assistant',data.answer); status.textContent = '';
  } catch(err) { status.textContent = err.message; } finally { btn.disabled = false; }
});
async function refreshFiles() {
  const list = document.getElementById('files'); list.replaceChildren();
  const r = await fetch('/api/files'); const data = await r.json();
  for (const name of data.files) {
    const li = document.createElement('li'); li.append(document.createTextNode(name));
    const btn = document.createElement('button'); btn.textContent = 'Delete';
    btn.onclick = async () => { const r = await fetch('/api/files/' + encodeURIComponent(name), {method:'DELETE'}); if (r.ok) refreshFiles(); };
    li.append(btn); list.append(li);
  }
}
document.getElementById('fileForm').addEventListener('submit', async e => {
  e.preventDefault(); const file = document.getElementById('file').files[0]; if (!file) return;
  const form = new FormData(); form.append('file',file);
  const r = await fetch('/api/files',{method:'POST',body:form}); const data = await r.json();
  document.getElementById('fileStatus').textContent = r.ok ? 'Uploaded: ' + data.filename : data.error;
  if(r.ok) { e.target.reset(); refreshFiles(); }
});
refreshFiles().catch(() => { document.getElementById('fileStatus').textContent = 'Could not load files.'; });
