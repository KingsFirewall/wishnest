import type { Celebration, Wish } from "./domain";
export const sampleCelebration: Celebration = {id:"sample",slug:"sample",title:"Maya’s 30th birthday",occasion:"Birthday",date:"2027-07-18",message:"Your company is the best gift. But if you’d like to bring a little something, here are a few things I’ve been dreaming of. Thank you for being part of my story.",currency:"USD",theme:"peach",visibility:"unlisted"};
export const sampleWishes: Wish[] = [
 {id:"coffee",title:"A slower morning",note:"A classic six-cup moka pot. Silver, please — for many, many coffees together.",price:6800,category:"Home & living",art:"coffee",priority:1,kind:"product"},
 {id:"camera",title:"Little moments on film",note:"A vintage 35mm camera. A working second-hand one would make me just as happy.",price:14500,category:"Technology",art:"camera",priority:1,kind:"product"},
 {id:"vase",title:"Something handmade",note:"A sculptural ceramic vase in lavender or cobalt. I love a slightly imperfect shape.",price:4200,category:"Home & living",art:"vase",priority:0,kind:"product"},
 {id:"book",title:"A book to come home to",note:"An inspiring book on cooking, interiors, or the art of slowing down. Surprise me.",price:3500,category:"Books",art:"book",priority:0,kind:"custom"},
 {id:"trip",title:"A pottery afternoon",note:"A beginner’s pottery class in Cairo. Even better if you come with me!",price:7500,category:"Experiences",art:"trip",priority:0,kind:"experience"},
 {id:"headphones",title:"My own little soundtrack",note:"Comfortable over-ear headphones in a soft neutral. For long walks and favourite albums.",price:19900,category:"Technology",art:"headphones",priority:0,kind:"product"},
].map(w=>({...w,image:"",url:"",paused:0,state:"available",mine:false,expires:null,extended:0}));
