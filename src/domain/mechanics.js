export const initialState={phase:'exdeath',collapsed:false,exdeath:{water:'unknown',thunder:'unknown',bomb:'unknown',eyeOrder:'look-then-away'},chaos:{fire:'unknown',water:'unknown'},kefka:{thunder:'unknown',blizzard:'unknown'},settings:{alwaysOnTop:true,resetOnCombatEnd:true,autoOpenCurrentPhase:true,autoClosePreviousPhase:true}};
export const finalCards=[{id:'all-hit',label:'밖에서 다 맞아',pattern:['true','true']},{id:'line-only',label:'밖에서 직선만',pattern:['true','false']},{id:'cone-only',label:'밖에서 부채꼴만',pattern:['false','true']},{id:'dodge-all',label:'밖에서 다 피해',pattern:['false','false']}];
export function calculateEyeOrder(exdeath){return exdeath.bomb==='true'?'away-then-look':'look-then-away'}
export function calculateChaosAction(kind,value){if(value==='unknown')return'대기';return value==='true'?'나가':kind==='fire'?'안':'피하기'}
export function calculateKefkaAction(value){if(value==='unknown')return'대기';return value==='true'?'진짜':'가짜'}
export function calculateFinalSafeZone(state){const a=state.kefka.thunder,b=state.kefka.blizzard;if(a==='unknown'||b==='unknown')return null;return finalCards.find(c=>c.pattern[0]===a&&c.pattern[1]===b)?.id??null}
export function phaseLabel(p){return{exdeath:'EXD',chaos:'CHAOS',kefka:'KEFKA',final:'FINAL'}[p]}
