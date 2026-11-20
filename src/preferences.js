const defaults={forward:'KeyW',left:'KeyA',back:'KeyS',right:'KeyD',jump:'Space',dash:'ShiftLeft',interact:'KeyE',pulse:'KeyF',pause:'KeyP'};
const names={forward:'Đi tới',left:'Đi trái',back:'Đi lùi',right:'Đi phải',jump:'Nhảy',dash:'Lướt',interact:'Nạp / châm dầu',pulse:'Tỏa sáng',pause:'Tạm dừng'};
const read=()=>{try{return JSON.parse(localStorage.getItem('lantern-keys'))||{};}catch{return {};}};
export const bindings={...defaults,...read()};
export const keyName=code=>code.replace(/^Key|^Digit/,'').replace('ShiftLeft','Shift trái').replace('ShiftRight','Shift phải');
export const actionFor=code=>Object.keys(bindings).find(a=>bindings[a]===code);
export const prefs={reduced:localStorage.getItem('lantern-reduced')==='true',large:localStorage.getItem('lantern-large')==='true'};
function apply(){document.body.classList.toggle('reduced',prefs.reduced);document.body.classList.toggle('large',prefs.large);}
apply();
export function accessibilityControls(parent){
  for(const [key,name] of [['reduced','Giảm chuyển động'],['large','Chữ lớn (125%)']]){
    const l=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=prefs[key];
    input.onchange=()=>{prefs[key]=input.checked;localStorage.setItem('lantern-'+key,String(input.checked));apply();};l.append(name,input);parent.append(l);
  }
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Đổi phím';details.append(summary);
  const status=document.createElement('p');status.setAttribute('role','status');
  const buttons={};let listening;
  function refresh(){for(const [a,b] of Object.entries(buttons))b.textContent=keyName(bindings[a]);}
  for(const [a,name] of Object.entries(names)){
    const row=document.createElement('label'),b=document.createElement('button');buttons[a]=b;
    b.onclick=()=>{listening=a;refresh();b.textContent='Nhấn phím mới';status.textContent='';};
    b.onblur=()=>{listening=null;refresh();};
    b.onkeydown=e=>{
      if(listening!==a)return;
      e.stopPropagation();e.preventDefault();const occupied=actionFor(e.code);
      if((occupied&&occupied!==a)||['KeyQ','KeyR','Escape','Tab'].includes(e.code)){status.textContent='Phím đã được dùng. Chọn phím khác.';return;}
      bindings[a]=e.code;localStorage.setItem('lantern-keys',JSON.stringify(bindings));listening=null;status.textContent='Đã lưu';refresh();
    };
    row.append(name,b);details.append(row);
  }
  const reset=document.createElement('button');reset.textContent='Khôi phục mặc định';reset.onclick=()=>{Object.assign(bindings,defaults);localStorage.removeItem('lantern-keys');refresh();status.textContent='Đã khôi phục';};
  details.append(status,reset);parent.append(details);refresh();
}
