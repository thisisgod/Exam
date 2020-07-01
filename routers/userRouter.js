import express from "express";
import db_config from "../config/db";
import multer from "multer"
import Q from "q"
import fs from "fs"

var storage = multer.diskStorage({
    destination: function(req,file,cb){
        var dir = 'imgs/exam' + req.params.exam_id + '/prob/';
        cb(null, dir)
        console.log(dir);
    },
    filename : function(req,file,cb){
        // cb(null,img_src + file.mimetype.split('/')[1])
        console.log(req.body)
        console.log("prob_cnt : " + req.body.prob_cnt)
        cb(null,'prob' + req.body.prob_cnt+'.'+file.mimetype.split('/')[1])
        // console.log(img_src + file.mimetype.split('/')[1]);
    }
});
var upload = multer({storage: storage})

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
            if(idx==1)id[1] = 2
            console.log(id)
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
        else  {
            sql = "select max(exam_id) as exam_id from exam";
            conn.query(sql, function(err, rows, fields){
                var exam_id = rows[0].exam_id
                var dir = 'imgs/exam' + exam_id
                !fs.existsSync(dir) && fs.mkdirSync(dir)
                dir += '/prob'
                !fs.existsSync(dir) && fs.mkdirSync(dir)
                dir ='imgs/exam' + exam_id + '/ans'
                !fs.existsSync(dir) && fs.mkdirSync(dir)
                res.redirect('exam')
            })
        }
    });
}); 

userRouter.get('/prob/:exam_id',function(req,res,next){
    var sql = "select * from problem where exam_id = "+req.params.exam_id;
    conn.query(sql,function(err,rows,fields){
        if(err)res.send(500,err);
        else{
            var idx = rows.length;
            var id = new Array(idx);
            for(var i=0;i<idx;i++){
                id[i] = rows[i].prob_id;
            }
            if(idx==1)id[1]=1;
            res.render('prob',{
                list : rows,
                idx : idx,
                id : id,
                exam_id : req.params.exam_id
            });
        }
    });
});

userRouter.get('/prob',function(req,res,next){
    res.render('home')
})

userRouter.get('/create_prob/:exam_id',function(req,res,next){
    var sql = "select count(prob_id) as count from problem where exam_id = "+req.params.exam_id;
    conn.query(sql,function(err,rows,fields){
        if(err)console.log('query is not excuted. select fail...\n'+err);
        else{
            res.render('create_prob',{
                exam_id : req.params.exam_id,
                prob_cnt : rows[0].count
            });
        }
    });
});

userRouter.post('/create_prob/:exam_id',upload.single('file'),function(req,res,next){
    var sql = "insert into problem (exam_id, prob_kind, prob_title, prob_num, prob_img, rgstr_id, updtr_id) values ?";
    var body = req.body;
    var img_src = 'imgs/exam'+req.params.exam_id+'/prob/prob'+req.body.prob_cnt
    console.log(body)
    var values = [[req.params.exam_id, body.kind, body.title, body.num, img_src, body.rgst_id, body.rgst_id]];
    conn.query(sql, [values], function(err, result){
        if(err)console.log("insert errer"+err);
        else  {
            res.redirect('/prob/' + req.params.exam_id);
            // redirect 는 url 로 직접 이동시켜주는것.
            // 앞에 '/' 를 붙이면 절대경로
            // 안붙이면 상대경로로 이동하게 된다 (현재 디렉토리부터 다음까지)
        }
    });
});


export default userRouter;