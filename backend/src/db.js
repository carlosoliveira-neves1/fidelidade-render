import pkg from 'pg'; import dotenv from 'dotenv'; dotenv.config();
const { Pool } = pkg;
const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;
const options = process.env.DB_SCHEMA ? `-c search_path=${process.env.DB_SCHEMA},public` : undefined;
export const pool = new Pool({ host:process.env.DB_HOST, port:Number(process.env.DB_PORT||5432), user:process.env.DB_USER, password:process.env.DB_PASS, database:process.env.DB_NAME, ssl, application_name:'cdc-fidelidade-v2.2', ...(options?{options}:{}) });