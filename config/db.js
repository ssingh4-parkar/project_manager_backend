import mongoose from "mongoose";
const connectDB=async()=>{
    await mongoose.connect(`${process.env.MONGODB_URL}/Project_Management`)
    .then(()=>{
        console.log("DB Connected")
    }).catch((error)=>{
        console.log(`DB Connection failed : ${error}`)
    })
}
export default connectDB;