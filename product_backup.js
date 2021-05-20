const env = require('./env').env;
const config = require('/home/ec2-user/api_test/config')[env];
const pool = require('./pool_connection').createPool(config.database);

const execute = (sql,callback,data = {} )=>{

    pool.getConnection((err,connection) => {
        if (err) throw err;

        connection.query(sql,data,(err,rows) => {
            connection.release();

            if ( err ) {
                throw err;
            } else {
                callback(err, rows);
            }
        });
    });
}

const insertInfo = () => {

    return new Promise((resolve,reject) => {

        execute(`INSERT INTO back_up.js_product (sku,qty) SELECT js.sku,js.qty FROM inventory.js_product js ON DUPLICATE KEY UPDATE qty = js.qty;`,(err,rows)=>{
        
            if (err) throw err;

            resolve();
        })
    })
}


const product_backup  = async () => {

    try {

        await insertInfo();

    } catch (e) {

        console.log(e);
        
    }
}

product_backup();
