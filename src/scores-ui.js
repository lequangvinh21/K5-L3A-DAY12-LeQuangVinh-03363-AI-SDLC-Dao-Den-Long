export function scoreForm(parent,result){
  const form=document.createElement('form'),label=document.createElement('label'),input=document.createElement('input'),button=document.createElement('button'),message=document.createElement('p');
  input.required=true;input.minLength=3;input.maxLength=12;input.pattern='[A-Za-z0-9_]{3,12}';
  label.append('Tên (3–12 chữ, số, dấu _)',input);button.textContent='Lưu điểm';message.setAttribute('role','status');
  form.append(label,button,message);parent.append(form);
  form.onsubmit=async e=>{
    e.preventDefault();button.disabled=true;
    try{const res=await fetch('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...result,name:input.value})});
      if(!res.ok)throw Error();input.disabled=true;message.textContent='Đã lưu điểm.';}
    catch{button.disabled=false;message.textContent='Chưa lưu được. Kiểm tra máy chủ game và thử lại.';}
  };
}
export async function scoresList(parent){
  const list=document.createElement('ol');parent.append(list);
  try{const res=await fetch('/api/leaderboard');if(!res.ok)throw Error();const {entries}=await res.json();
    if(!entries.length)list.textContent='Chưa có điểm được lưu.';
    for(const e of entries){const li=document.createElement('li');li.textContent=e.name+' · '+e.score+' điểm · '+e.nights_won+'/3 đêm';list.append(li);}
  }catch{list.textContent='Chưa đọc được bảng điểm.';}
}
