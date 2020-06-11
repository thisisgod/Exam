import express from "express";
import db_config from "../config/db";

/* connect DB */
var conn = db_config.init();
db_config.connect(conn);
/**************/

const userRouter = express.Router();

userRouter.get('/',function(req,res,next){
    res.render('home');
});

userRouter.get('/input',function(req,res,next){
    res.render('input');
});

userRouter.post('/input',function(req,res,next){
    console.log(req.body);
    for(var i=0;i<3;i++){
        console.log(req.body.sample[i]);
    }
    res.redirect('input');
});

userRouter.get('/exam',function(req,res,next){
    var sql = 'select * from exam';
    conn.query(sql,function(err,rows,fields){
        if(err)console.log('query is not excuted. select fail...\n'+err);
        else {
            var idx = rows.length;
            var id = new Array(idx);
            for(var i=0;i<idx;i++){
                id[i] = rows[i].exam_id;
            }
            res.render('exam',{
                list : rows,
                idx : idx,
                id : id
            });
        }
    })
});

userRouter.get('/create_exam',function(req,res,next){
    res.render('create_exam')
});

userRouter.post('/create_exam',function(req,res,next){
    var sql = "insert into exam (title, vald_strt_dd, vald_end_dd, rgstr_id, updtr_id) values ?";
    var body = req.body;
    var values = [[body.title,body.vald_strt_dd,body.vald_end_dd,body.rgstr_id,body.rgstr_id]];
    console.log(body);
    conn.query(sql, [values], function(err, result){
        if(err)console.log("insert errer"+err);
        else  res.redirect('exam');
    });
}); 

userRouter.get('/prob/:exam_id',function(req,res,next){
    var sql = "select * from problem where exam_id = "+req.params.exam_id;
    conn.query(sql,function(err,rows,fields){
        if(err)console.log('query is not excuted. select fail...\n'+err);
        else{
            var idx = rows.length;
            var id = new Array(idx);
            for(var i=0;i<idx;i++){
                id[i] = rows[i].exam_id;
            }
            res.render('prob',{
                list : rows,
                idx : idx,
                id : id
            });
        }
    });
});



export default userRouter;