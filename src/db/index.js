import mongoose from "mongoose";


export const DB_Connection = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.CONNECTION_STRING}/${process.env.DB_NAME}`)
        console.log('DB connected Successfully');
    } catch (error) {
        console.log('DB connection Error',error);
        throw error
    }
}