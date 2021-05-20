const env = require('./env').env;
const config = require('/home/ec2-user/api_test/config')[env];
const pool = require('./pool_connection').createPool(config.database);
const _dateFormat = require('dateformat');

let today = _dateFormat(new Date(),'yyyy-mm-dd');

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


const check_gap = () => {

    return new Promise((resolve,reject) => {

        execute(`INSERT INTO js_daily_gap 
                    (sku,yesterday,today,total_import,total_export,close_order_export,global_export,gap)
                SELECT p.sku,
                b.qty AS 'yesterday', 
                p.qty AS 'today', 
                IFNULL(i.total_qty,0) AS 'total_import' ,
                IFNULL(e.total_qty,0) AS 'total_export',
                IFNULL(ce.total_qty,0) AS 'closed_order_export',
                IFNULL(ge.total_qty,0) AS 'global_export',
                (b.qty + IFNULL(i.total_qty,0) -IFNULL(e.total_qty,0) - IFNULL(ce.total_qty,0)-IFNULL(ge.total_qty,0) -p.qty) AS 'gap'
                FROM inventory.js_product p
                LEFT JOIN back_up.js_product b ON b.sku = p.sku
                LEFT JOIN (SELECT master_sku, SUM(export_total) total_qty FROM inventory.app_close_order_export WHERE export_date LIKE "%${today}%" GROUP BY master_sku ) ce ON ce.master_sku = p.sku
                LEFT JOIN (SELECT sku, SUM(export_qty) total_qty FROM inventory.app_global_order_export WHERE exports_date LIKE "${today}" GROUP BY sku) ge ON ge.sku=p.sku 
                LEFT JOIN (SELECT sku, sum(qty) total_qty FROM inventory.js_inventory_import 
                WHERE build_date LIKE "%${today}%"
                GROUP BY sku) i ON i.sku = p.sku
                LEFT JOIN (SELECT sku,sum(qty) total_qty FROM inventory.js_inventory_export 
                WHERE build_date LIKE "%${today}%" GROUP by sku) e ON e.sku = p.sku
                WHERE (IFNULL(i.total_qty,0) + IFNULL(e.total_qty,0)+IFNULL(ce.total_qty,0)+IFNULL(ge.total_qty,0) ) <>0
                GROUP by p.sku,b.qty,i.total_qty,e.total_qty;`,(err,rows)=>{
        
            if (err) throw err;

            resolve();
        })
    })
}

const check_daily_gap = async () => {

    try {

        //await check_gap();

    } catch (e) {

        console.log(e);
        
    }
}

check_daily_gap();
