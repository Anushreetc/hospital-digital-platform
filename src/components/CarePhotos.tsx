import React from 'react';
export const CarePhotos=({infrastructure=false}:{infrastructure?:boolean})=> <div className="care-photo-strip">{(infrastructure ? [
['hospital-gallery-2.jpg','Our operating theatre'],['hospital-reception.jpg','Reception & patient assistance'],['hospital_building_card.jpg','We Care Hospital, Doddaballapura']
] : [['hospital-gallery-1.jpg','In-house laboratory'],['hospital-gallery-0.jpg','Procedure room'],['hospital-gallery-3.jpg','Surgical facilities']]).map(([src,label])=><figure key={src}><img src={'/images/'+src} alt={label+' at We Care Hospital'} loading="lazy"/><figcaption>{label}</figcaption></figure>)}</div>;
