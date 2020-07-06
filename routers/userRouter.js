import express from "express";
import db_config from "../config/db";
import multer from "multer"
import fs from "fs"
import path from "path"

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

var storage1 = multer.diskStorage({
    destination: function(req,file,cb){
        var dir = 'imgs/exam' + req.body.exam_id + '/ans/';
        cb(null, dir)
        console.log(dir);
    },
    filename : function(req,file,cb){
        // cb(null,img_src + file.mimetype.split('/')[1])
        console.log(req.body)
        console.log("ans_cnt : " + req.body.answer_cnt)
        cb(null,'ans' + req.body.answer_cnt+'.'+file.mimetype.split('/')[1])
        // console.log(img_src + file.mimetype.split('/')[1]);
    }
});

var upload = multer({storage: storage})
var upload1 = multer({storage: storage1})

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
            res.render('exam',{
                list : rows,
                idx : idx
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
            
            res.render('prob',{
                list : rows,
                idx : idx,
                exam_id : req.params.exam_id
            });
        }
    });
});

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
    var img_src = 'imgs/exam'+req.params.exam_id+'/prob/prob'+req.body.prob_cnt+'.'+req.file.mimetype.split('/')[1]
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

userRouter.get('/answer/:prob_id',function(req,res){
    var sql = "select * from problem where prob_id = "+req.params.prob_id
    var exam_id
    var prob_kind
    conn.query(sql,function(err,rows,fields){
        if(err)res.send(500,err)
        else{
            exam_id = rows[0].exam_id
            prob_kind = rows[0].prob_kind
            
            if(prob_kind=='N'){//일반 객관식
                sql = "select * from answer1 where prob_id = "+req.params.prob_id
            }
            else if(prob_kind=='P'){//그림 주관식
                sql = "select * from answer2 where prob_id = "+req.params.prob_id
            }
            else{//주관식
                sql = "select * from answer3 where prob_id = "+req.params.prob_id
            }
            
            conn.query(sql,function(err,rows,fields){
                if(err)res.send(500,err)
                else{
                    var idx = rows.length;
                    res.render('answer',{
                        list : rows,
                        idx : idx,
                        prob_id : req.params.prob_id,
                        exam_id : exam_id,
                        prob_kind : prob_kind
                    });
                }
            })
        }
    })

})

userRouter.get('/create_answer/:prob_id',function(req,res,next){
    var sql = "select prob_kind, exam_id from problem where prob_id = "+req.params.prob_id
    var prob_kind
    var exam_id
    conn.query(sql,function(err,rows,fields){
        if(err)res.render(500,err)
        else{
            prob_kind = rows[0].prob_kind
            exam_id = rows[0].exam_id
                    
            if(prob_kind=='N')sql = "select count(answ1_id) as count from answer1 where prob_id = "+req.params.prob_id;
            else if(prob_kind =='P')sql = "select count(answ2_id) as count from answer2 where prob_id = "+req.params.prob_id;
            else sql = "select count(answ3_id) as count from answer3 where prob_id = "+req.params.prob_id;

            conn.query(sql,function(err,rows,fields){
                if(err)res.render(500,err)
                else{
                    res.render('create_answer',{
                        answer_cnt : rows[0].count,
                        exam_id : exam_id,
                        prob_id : req.params.prob_id,
                        prob_kind : prob_kind
                    });
                }
            });
        }
    })
})

userRouter.post('/create_answer/:prob_id',upload1.single('file'),function(req,res,next){
    var sql = "insert into answer"
    if(req.body.prob_kind=='N')sql+=1;
    else if(req.body.prob_kind=='P')sql+=2;
    else sql+=3;
    sql += " (prob_id, answ_value, rgstr_id, updtr_id) values ?";

    var body = req.body;
    var img_src
    if(req.body.prob_kind=='P')img_src = '/imgs/exam'+req.body.exam_id+'/ans/ans'+req.body.answer_cnt+'.'+req.file.mimetype.split('/')[1]
    var values
    if(req.body.prob_kind=='P') values = [[req.params.prob_id, img_src, body.rgst_id, body.rgst_id]];
    else values = [[req.params.prob_id, body.answer_value, body.rgst_id, body.rgst_id]];
    conn.query(sql, [values], function(err, result){
        if(err)console.log("insert errer"+err);
        else  {
            res.redirect('/answer/' + req.params.prob_id);
            // redirect 는 url 로 직접 이동시켜주는것.
            // 앞에 '/' 를 붙이면 절대경로
            // 안붙이면 상대경로로 이동하게 된다 (현재 디렉토리부터 다음까지)
        }
    });
})

userRouter.get('/delete_answer1/:answ1_id',function(req,res){
    var sql = "select prob_id from answer1 where answ1_id = " + req.params.answ1_id
    conn.query(sql,function(err,rows,field){
        if(err)res.send(500,err)
        else{
            var prob_id = rows[0].prob_id
            sql = "delete from answer1 where answ1_id = "+req.params.answ1_id
            conn.query(sql,function(err){
                if(err)res.send(500,err)
                else{
                    res.redirect('/answer/'+prob_id)
                }
            })
        }
    })
})

userRouter.get('/delete_answer2/:answ2_id',function(req,res){
    var sql = "select answ_value, prob_id from answer2 where answ2_id = " + req.params.answ2_id
    conn.query(sql,function(err,rows,field){
        if(err)res.send(500,err)
        else{
            var img_src = '.'+rows[0].answ_value
            var prob_id = rows[0].prob_id
            sql = "delete from answer2 where answ2_id = "+req.params.answ2_id
            conn.query(sql,function(err){
                if(err)res.send(500,err)
                else{
                    fs.existsSync(img_src)&&fs.unlinkSync(img_src)
                    // 파일 존재 체크하고 파일 존재하면 파일 삭제
                    res.redirect('/answer/'+prob_id)
                }
            })
        }
    })
})

userRouter.get('/delete_answer3/:answ3_id',function(req,res){
    var sql = "select prob_id from answer3 where answ3_id = " + req.params.answ3_id
    conn.query(sql,function(err,rows,field){
        if(err)res.send(500,err)
        else{
            var prob_id = rows[0].prob_id
            sql = "delete from answer3 where answ3_id = "+req.params.answ3_id
            conn.query(sql,function(err){
                if(err)res.send(500,err)
                else{
                    res.redirect('/answer/'+prob_id)
                }
            })
        }
    })
})

userRouter.get('/delete_prob/:prob_id',function(req,res){
    var sql = "select exam id,prob_kind from problem where prob_id = "+req.params.prob_id
    conn.query(sql,function(err,rows,field){
        if(err)res.send(500,err)
        else{
            var prob_kind = rows[0].prob_kind
            var exam_id = rows[0].exam_id
            if(prob_kind=='P'){
                sql = "select answ_value from answer2 where prob_id = "+req.params._prob_id                
                conn.query(sql,function(err,rows,field){
                    if(err)res.send(500,err)
                    else{
                        for(var attr in rows){
                            var img_src = '.' + attr.answer_value
                            fs.existsSync(img_src)&&fs.unlinkSync(img_src)
                            sql = "delete from answer2 where prob_id = "+req.params.prob_id
                        }
                    }
                })
                
            }
            else if(prob_kind=='N'){
                sql = "delete from answer1 where prob_id = "+req.params.prob_id
            }
            else sql = "delete from answer3 where prob_id = "+req.params.prob_id
            conn.query(sql,function(err){
                if(err)res.send(500,err)
                else{
                    res.redirect('/prob/'+exam_id);
                }
            })
        }
    })
})







export default userRouter;