const radians = a => a*Math.PI/180;
function ring(n,r,start=0,cx=0,y=0,step=360/n) {
  return Array.from({length:n},(_,i)=>[cx+r*Math.cos(radians(start+i*step)),y,r*Math.sin(radians(start+i*step))]);
}
export const maps = [null,
  {name:'Đảo Bến',islands:[[0,40]],lamps:[[0,0,25],[23.8,0,7.7],[14.7,0,-20.2],[-14.7,0,-20.2],[-23.8,0,7.7]],
   motes:[...ring(8,12),...ring(16,33)],mist:ring(12,37,15),pads:[],charms:[],cap:6,period:480},
  {name:'Đảo Cau',islands:[[0,28],[70,28]],lamps:[[0,0,20],[17,0,-10],[-17,0,-10],[70,0,20],[87,0,-10],[53,0,-10]],
   motes:[0,70].flatMap(x=>[...ring(4,10,0,x),...ring(8,22,0,x)]),mist:[0,70].flatMap(x=>ring(8,26,22.5,x)),
   pads:[[20,0,18,70,0], [50,0,-18,0,0]], charms:[[35,0,0]],cap:8,period:420},
  {name:'Đảo Chuông',islands:[[0,45]],lamps:[[0,6,6],[18,3,10],[-18,3,10],[35,0,-10],[-35,0,-10],[20,0,-35],[-20,0,-35]],
   motes:[...ring(18,34),...ring(8,18,20,0,3,20),...ring(4,5,45,0,6)],mist:ring(16,43),
   pads:[[0,3,13,0,-20]],charms:[[30,0,25],[-30,0,25]],cap:10,period:360}
];
export function ground(n,x,z) {
  if(n===2 && x>=26 && x<=44 && Math.abs(z)<=2)return 0;
  if(!maps[n].islands.some(([c,r])=>Math.hypot(x-c,z)<=r))return -Infinity;
  if(n!==3)return 0;
  const r=Math.hypot(x,z);
  if(r<=8)return 6;
  if(r>=12 && r<=24 && z>0)return 3;
  for(const a of [Math.PI/6,5*Math.PI/6]){
    const along=x*Math.cos(a)+z*Math.sin(a), cross=z*Math.cos(a)-x*Math.sin(a);
    if(along>=23.94 && along<=30 && Math.abs(cross)<=1.5)return Math.min(3,(30-along)/2);
  }
  return 0;
}
