// backend/db.js
const mysql = require('mysql2/promise'); // Koristimo mysql2/promise

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Proveravamo konekciju odmah pri startu
pool.getConnection()
    .then(connection => {
        console.log('Connected to MySQL database!');
        connection.release(); // Vraćamo konekciju u pool
    })
    .catch(err => {
        console.error('Failed to connect to MySQL database:', err);
    });

module.exports = pool;