import mysql from "mysql"
import dotenv from "dotenv"
dotenv.config();

const DB_PORT = process.env.DB_PORT;
const DB_PW = process.env.DB_PW;

var db_info = {
    host: 'localhost',
    port: DB_PORT,
    user: 'root',
    password: DB_PW,
    database: 'db_test'
}

const db = {
    init: function(){
        return mysql.createConnection(db_info);
    },
    connect: function(conn){
        conn.connect(function(err){
            if(err)console.err('mysql connection error : '+err);
            else console.log('mysql is connected succesfully!');
        });
    }
}

export default db;