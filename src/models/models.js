const User = { id:"uuid", name:"string", email:"string", orbLevel:"integer", createdAt:"timestamp" };
const Orb = { id:"uuid", userId:"uuid", xp:"integer", achievements:["string"], rank:"string" };
const Course = { id:"uuid", title:"string", modules:["string"], creatorId:"uuid", price:"integer" };
const Product = { id:"uuid", title:"string", price:"integer", sellerId:"uuid", category:"string" };
export { User, Orb, Course, Product };
