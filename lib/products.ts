export type Product={id:string;name:string;description:string;price:number;category:string;stock:number;image:string};
export const products:Product[]=[
{id:'notebook-a5',name:'A5 Premium Notebook',description:'Hard-cover lined notebook for school, work and everyday notes.',price:4500,category:'Paper',stock:40,image:'/images/notebook.svg'},
{id:'blue-pen-pack',name:'Blue Ballpoint Pen Pack',description:'Smooth-writing blue pens, ideal for school and office use.',price:2500,category:'Writing',stock:80,image:'/images/pen.svg'},
{id:'office-file',name:'Office Document File',description:'Durable file for organizing important documents.',price:3200,category:'Files & Folders',stock:30,image:'/images/file.svg'},
{id:'marker-set',name:'Permanent Marker Set',description:'Assorted markers for labeling, presentations and office tasks.',price:3800,category:'Writing',stock:25,image:'/images/marker.svg'},
{id:'sticky-notes',name:'Sticky Notes Pack',description:'Bright sticky notes for reminders, planning and study.',price:1800,category:'Office Supplies',stock:55,image:'/images/sticky.svg'},
{id:'ruler-30cm',name:'30cm Plastic Ruler',description:'Clear, sturdy ruler for school and technical work.',price:1200,category:'School Supplies',stock:60,image:'/images/ruler.svg'}
];
export const getProduct=(id:string)=>products.find(p=>p.id===id);
export const naira=(n:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(n);
