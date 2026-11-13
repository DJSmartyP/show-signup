import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,writeBatch,runTransaction,getDoc} from 'firebase/firestore';
const env=await initializeTestEnvironment({projectId:'demo-ppec-show-signup',firestore:{rules:await readFile('firestore.rules','utf8'),host:'127.0.0.1',port:8085}});
const alice=env.authenticatedContext('alice').firestore(),bob=env.authenticatedContext('bob').firestore();
const data=(start=540,duration=30,ownerUid='alice')=>({title:'Show',premise:'A test premise',owner:'Contributor',ownerUid,start,duration});
function batch(db,id,s,includeSlots=true){const b=writeBatch(db);b.set(doc(db,'ppecShowSignup',id),s);if(includeSlots)for(let n=s.start;n<s.start+s.duration;n+=30)b.set(doc(db,'ppecShowSlots',String(n)),{showId:id,minute:n});return b;}
async function remove(db,id,s){const b=writeBatch(db);b.delete(doc(db,'ppecShowSignup',id));for(let n=s.start;n<s.start+s.duration;n+=30)b.delete(doc(db,'ppecShowSlots',String(n)));return b.commit();}
try{
 await env.clearFirestore();
 await assertFails(batch(env.unauthenticatedContext().firestore(),'unsigned',data()).commit());
 await assertFails(batch(alice,'orphan',data(),false).commit());
 await assertFails(batch(alice,'forged',data(540,30,'bob')).commit());
 await assertFails(batch(alice,'late',data(1410,60)).commit());
 await assertSucceeds(batch(alice,'hour',data(810,60)).commit());
 assert.equal((await getDoc(doc(bob,'ppecShowSlots','840'))).data().showId,'hour');
 await assertFails(batch(bob,'clash',data(840,30,'bob')).commit());
 await assertFails(remove(bob,'hour',data(810,60)));
 await assertFails(setDoc(doc(alice,'ppecShowSignup','hour'),{...data(810,60),title:'Changed'}));
 await assertFails((()=>{const b=writeBatch(alice);b.delete(doc(alice,'ppecShowSignup','hour'));return b.commit();})());
 await assertSucceeds(remove(alice,'hour',data(810,60)));
 assert.equal((await getDoc(doc(alice,'ppecShowSlots','840'))).exists(),false);
 await assertSucceeds(batch(alice,'last',data(1410,30)).commit());
 const reserve=(db,id,uid)=>runTransaction(db,async tx=>{const slot=doc(db,'ppecShowSlots','600');const old=await tx.get(slot);if(old.exists())throw Error('Booked');tx.set(doc(db,'ppecShowSignup',id),data(600,30,uid));tx.set(slot,{showId:id,minute:600});});
 const races=await Promise.allSettled([reserve(alice,'race-a','alice'),reserve(bob,'race-b','bob')]);assert.equal(races.filter(r=>r.status==='fulfilled').length,1);
 console.log('PASS: authentication, ownership, required slots, validation, cross-section hour, overlap, withdrawal, midnight boundary and concurrent booking.');
}finally{await env.cleanup();}
