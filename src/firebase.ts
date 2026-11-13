import {initializeApp, type FirebaseOptions} from 'firebase/app';
import {getAuth, signInAnonymously, onAuthStateChanged, type Auth} from 'firebase/auth';
import {getFirestore, collection, doc, getDocs, onSnapshot, query, orderBy, runTransaction, type Firestore} from 'firebase/firestore';
export type Show={id:string;title:string;premise:string;owner:string;ownerUid:string;start:number;duration:number};
declare global {interface Window {PPEC_FIREBASE_CONFIG: FirebaseOptions | null}}
let db:Firestore|undefined, auth:Auth|undefined;
function client(){
 if(!db){const config=window.PPEC_FIREBASE_CONFIG;if(!config?.projectId||!config.apiKey||!config.appId)throw new Error('Sign-ups are not open yet. The organiser needs to connect the shared schedule.');const app=initializeApp(config);db=getFirestore(app);auth=getAuth(app);}
 return {db:db!,auth:auth!};
}
const showQuery=()=>query(collection(client().db,'ppecShowSignup'),orderBy('start'));
export function subscribeShows(next:(shows:Show[])=>void,error:(e:Error)=>void){try{return onSnapshot(showQuery(),snap=>next(snap.docs.map(d=>({...d.data(),id:d.id}) as Show)),()=>error(new Error('Could not load the shared schedule. Please try again.')));}catch(e){error(e as Error);return()=>{};}}
export async function listShows(){const snap=await getDocs(showQuery());return snap.docs.map(d=>({...d.data(),id:d.id}) as Show);}
export function subscribeIdentity(next:(uid:string)=>void){try{return onAuthStateChanged(client().auth,u=>next(u?.uid||''));}catch{return()=>{};}}
async function identity(){const {auth}=client();await auth.authStateReady();return auth.currentUser||(await signInAnonymously(auth)).user;}
export async function bookShow(input:{title:string;premise:string;owner:string;start:number;duration:number}){
 const user=await identity();const {db}=client();const show=doc(collection(db,'ppecShowSignup'));
 const slots=Array.from({length:input.duration/30},(_,i)=>doc(db,'ppecShowSlots',String(input.start+i*30)));
 await runTransaction(db,async tx=>{
  const existing=await Promise.all(slots.map(s=>tx.get(s)));if(existing.some(s=>s.exists()))throw new Error('That time has just been booked. Please choose another slot.');
  tx.set(show,{...input,ownerUid:user.uid});slots.forEach((s,i)=>tx.set(s,{showId:show.id,minute:input.start+i*30}));
 });
}
export async function withdrawShow(show:Show){
 const user=await identity();if(show.ownerUid!==user.uid)throw new Error('This booking belongs to another contributor.');
 const {db}=client();await runTransaction(db,async tx=>{
  const ref=doc(db,'ppecShowSignup',show.id);const actual=await tx.get(ref);if(!actual.exists())return;
  if(actual.data().ownerUid!==user.uid)throw new Error('This booking belongs to another contributor.');
  const s=actual.data();tx.delete(ref);for(let n=s.start;n<s.start+s.duration;n+=30)tx.delete(doc(db,'ppecShowSlots',String(n)));
 });
}
