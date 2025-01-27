const mysql = require('mysql');


const db = mysql.createConnection({
    host: 'bxsskyy3uhf73vwgsiav-mysql.services.clever-cloud.com',
    user: 'uirv33z99mxikff4',
    password: 'o3JpEjvXpwLz7cQGwYvb',
    database: 'bxsskyy3uhf73vwgsiav',
    port: 3306,
});

module.exports = db;