import { Server } from "http"
import mongoose from "mongoose"
import config from "./app/config";

let server: Server | null = null;

// Database Connection
async function connectToDatabase() {
    try {
        await mongoose.connect(config.db_url as string);
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Failed to connect to database', error);
        process.exit(1);        
    }
}

async function bootstrap() {
    try {
        await connectToDatabase();

        server = app.lis
    } catch (error) {
        
    }
}