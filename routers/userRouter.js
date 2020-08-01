import express from "express";
import db_config from "../config/db";
import multer from "multer"
import fs from "fs"
import xlsx from "xlsx"
import { resolve } from "path";

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
    var sql = "select * from problem where exam_id = "+req.params.exam_id + " order by prob_no";
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
    var sql = "insert into problem (exam_id, prob_no, isImg, prob_kind, prob_title, prob_score, prob_img) values ?";
    var body = req.body;
    var img_src = '/imgs/exam'+req.params.exam_id+'/prob/prob'+req.body.prob_cnt+'.'+req.file.mimetype.split('/')[1]
    console.log(body)
    var values = [[req.params.exam_id, body.prob_no, "Y", body.kind, body.title, body.prob_score, img_src]];
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
    sql += " (prob_id, answ_value) values ?";

    var body = req.body;
    var img_src
    if(req.body.prob_kind=='P')img_src = '/imgs/exam'+req.body.exam_id+'/ans/ans'+req.body.answer_cnt+'.'+req.file.mimetype.split('/')[1]
    var values
    if(req.body.prob_kind=='P') values = [[req.params.prob_id, img_src]];
    else values = [[req.params.prob_id, body.answer_value]];
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
    var sql = "select exam_id,prob_kind, prob_img from problem where prob_id = "+req.params.prob_id
    conn.query(sql,function(err,rows,field){
        if(err)res.send(500,err)
        else{
            var img_src = '.' + rows[0].prob_img
            fs.existsSync(img_src)&&fs.unlinkSync(img_src)
            var prob_kind = rows[0].prob_kind
            var exam_id = rows[0].exam_id

            sql = "delete from problem where prob_id = "+req.params.prob_id
            conn.query(sql,function(err){
                if(err)res.send(500,err)
                else{
                    if(prob_kind=='P'){
                        sql = "select answ_value from answer2 where prob_id = "+req.params.prob_id                
                        conn.query(sql,function(err,rows,field){
                            if(err)res.send(500,err)
                            else{
                                console.log(rows)
                                for(var attr of rows){
                                    console.log(attr)
                                    var img_src = '.' + attr.answ_value
                                    console.log(img_src)
                                    fs.existsSync(img_src)&&fs.unlinkSync(img_src)
                                }
                                sql = "delete from answer2 where prob_id = "+req.params.prob_id
                                conn.query(sql,function(err){
                                    if(err)res.send(500,err)
                                    else{
                                        console.log('delete complete')
                                        res.redirect('/prob/'+exam_id);
                                    }
                                })
                            }
                        })
                        
                    }
                    else if(prob_kind=='N'){
                        sql = "delete from answer1 where prob_id = "+req.params.prob_id
                        conn.query(sql,function(err){
                            if(err)res.send(500,err)
                            else{
                                console.log('delete complete')
                                res.redirect('/prob/'+exam_id);
                            }
                        })
                    }
                    else {
                        sql = "delete from answer3 where prob_id = "+req.params.prob_id
                        conn.query(sql,function(err){
                            if(err)res.send(500,err)
                            else{
                                console.log('delete complete')
                                res.redirect('/prob/'+exam_id);
                            }
                        })
                    }
                }
            })
        }
    })
})

function deleteFolderRecursive(path){
    if(fs.existsSync(path)){
        fs.readdirSync(path).forEach(function(file,index){
            var curPath = path + '/' + file
            if(fs.lstatSync(curPath).isDirectory()){
                deleteFolderRecursive(curPath)
            }
            else{
                fs.unlinkSync(curPath)
            }
        })
        fs.rmdirSync(path)
    }
}

userRouter.get('/delete_exam/:exam_id',function(req,res){
    var exam_id = req.params.exam_id
    var src = './imgs/exam'+exam_id;
    console.log(src)
    deleteFolderRecursive(src)
    var sql = "select prob_id, prob_kind, prob_img from problem where exam_id = "+ exam_id
    conn.query(sql,function(err,rows,field){
        if(err)res.send(500,err)
        else{
            sql = "delete from exam where exam_id = " + exam_id
            conn.query(sql,function(err){
                if(err)res.send(500,err)
                else {
                    sql = "delete from problem where exam_id = " + exam_id
                    conn.query(sql,function(err){
                        if(err)res.send(500,err)
                        else{
                            console.log(rows)
                            for(var obj of rows){
                                console.log(obj)
                                if(obj.prob_kind == 'P'){
                                    sql = "delete from answer2 where prob_id = "+obj.prob_id
                                    conn.query(sql,function(err){
                                        if(err)res.send(500,err)
                                    })
                                }
                                else if(obj.prob_kind == 'N'){
                                    sql = "delete from answer1 where prob_id = "+obj.prob_id
                                    conn.query(sql,function(err){
                                        if(err)res.send(500,err)
                                    })
                                }
                                else {
                                    sql = "delete from answer3 where prob_id = "+obj.prob_id
                                    conn.query(sql,function(err){
                                        if(err)res.send(500,err)
                                    })
                                }
                            }
                        }
                    })
                }
            })
        }
    })
    res.redirect('/exam')
})

async function GetExam(sql,res){
    let promise1 = new Promise((resolve,reject)=>{
        conn.query(sql,async function(err,rows,field){
            if(err)res.send(500,err)
            else{
                let prob = new Array()
                var len = rows.length
                for(var i=0;i<len;i++){
                    var prob_kind = rows[i].prob_kind
                    sql = "select answ_value from answer"
                    if(prob_kind == 'N')sql += "1"
                    else if(prob_kind=='P')sql+="2"
                    else sql+="3"
                    sql+=" where prob_id = "+rows[i].prob_id
                    let promise2 = new Promise((resolve, reject)=>{
                        conn.query(sql,function(err,rows,field){
                            if(err)res.send(500,err)
                            else{
                                var prob_inf = new Object()
                                prob_inf.ans = new Array()
                                var alen = rows.length
                                for(var j=0;j<alen;j++){
                                    var ans_inf = new Object()
                                    ans_inf.val = rows[j].answ_value
                                    ans_inf.id = j+1
                                    prob_inf.ans.push(ans_inf)
                                }
                                resolve(prob_inf)
                            }
                        })
                    })
                    let prob_inf1 = await promise2
                    prob_inf1.img= rows[i].prob_img
                    prob_inf1.prob_kind = rows[i].prob_kind
                    prob_inf1.id = i+1
                    prob_inf1.prob_no = rows[i].prob_no
                    if(i!=len-1 && rows[i+1].prob_no == rows[i].prob_no)prob.push(prob_inf1)
                }
                resolve(prob)
            }
        })
    })
    let result1 = await promise1
    return Promise.resolve(result1)
}

userRouter.get('/take_exam/:exam_id', async function(req,res){
    var sql = "select * from problem where exam_id = " + req.params.exam_id+ " order by prob_no"
    console.log("check")
    let prob = await GetExam(sql,res)
    console.log("check1")
    await res.render('take_exam',{
        prob:prob,
        id : req.params.exam_id
    })
})

userRouter.post('/take_exam/:exam_id',function(req,res){
    var exam_id = req.params.exam_id
    var sql = "select prob_score from problem where exam_id = "+exam_id
    conn.query(sql,function(err,rows){
        if(err)res.send(500,err)
        else{
            var scoreArr = rows
            sql = "select answer from cor_exam where exam_id = "+exam_id
            conn.query(sql,function(err,rows){
                if(err)res.send(500,err)
                else{
                    var j = 0
                    var score=0
                    for(var i of req.body.exam){
                        if(i == rows[j].answer)score+=scoreArr[j].prob_score
                        j++
                    }
                    res.render('result_exam',{
                        score : score
                    })
                }
            })
        }
    })
})

userRouter.get('/cor_exam/:exam_id',function(req,res){
    var sql = "select * from problem where exam_id = "+req.params.exam_id
    conn.query(sql,function(err,rows){
        if(err)res.send(500,err)
        else{
            res.render('cor_exam',{
                id : req.params.exam_id
            })
        }
    })
})

var timestamp

var storage3 = multer.diskStorage({
    destination: function(req,file,cb){
        var dir = 'excel/';
        cb(null, dir)
    },
    filename : function(req,file,cb){
        timestamp =+ new Date()
        console.log(timestamp)
        cb(null,'ans_' + timestamp+'.xlsx')
        //upload_exam()
    }
});

var upload3 = multer({storage: storage3})

userRouter.post('/cor_exam/:exam_id', upload3.single('file'),async function(req,res){
    var dir = 'excel/ans_'+timestamp+'.xlsx'
    let workbook = xlsx.readFile(dir)
    let worksheet = workbook.Sheets["Sheet1"]
    let ans_json = xlsx.utils.sheet_to_json(worksheet)

    var sql = "insert into cor_exam (exam_id, prob_num, answer) valuse ?"
    let promise_insert_cor_exam = new Promise((resolve, reject)=>{
        conn.query(sql, [values], function(err){
            if(err)res.send(err)
            else{
                console.log("insert success!")
                resolve(1)
            }
        })
    })
    for(var i=0;i<ans_json.length;i++){
        var values = [[req.params.exam_id, ans_json[i]["문제번호"],ans_json[i]["답안"]]]
        let insert_cor_exam = promise_insert_cor_exam
    }

    res.redirect('/exam')
})

async function upload_exam(){
    var dir = 'excel/exam_'+timestamp+'.xlsx'
    let workbook = xlsx.readFile(dir)
    let worksheet = workbook.Sheets["Sheet1"]
    res.json(worksheet)
    console.log(timestamp)
}

var storage2 = multer.diskStorage({
    destination: function(req,file,cb){
        var dir = 'excel/';
        cb(null, dir)
    },
    filename : function(req,file,cb){
        timestamp =+ new Date()
        console.log(timestamp)
        cb(null,'exam_' + timestamp+'.xlsx')
        //upload_exam()
    }
});

var upload2 = multer({storage: storage2})

userRouter.get('/upload_exam',function(req,res){
    res.render('upload_exam')
})

async function insert_problem_func(prob_json, exam_id, res){
    var sql = "insert into problem (exam_id, prob_no, prob_kind, prob_title, prob_score) values ?"
    for(var i=0;i<prob_json.length;i++){
        var prob = prob_json[i]
        var values = [[exam_id, prob["문제번호"], prob["문제유형"], prob["문제설명"], prob["점수"]]]
        var prob_kind = prob["문제유형"]
        let promise_insert_problem_inside = new Promise((resolve, reject)=>{
            conn.query(sql,[values],async function(err,result){
                if(err)res.send(500,err)
                else{
                    var sql1 = "select max(prob_id) as prob_id from problem where exam_id = "+exam_id
                    let promise_select_prob_id = new Promise((resolve, reject)=>{
                        conn.query(sql1,[values],async function(err,rows){
                            if(err)res.send(500,err)
                            else{
                                var prob_id = rows[0].prob_id
                                for(var j=1;j<=5;j++){
                                    var sql2 = "insert into answer1 (prob_id, answ_value) values ?"
                                    values = [[prob_id, prob["정답"+j]]]
                                    conn.query(sql2,[values],function(err,result){
                                        if(err)res.send(500,err)
                                        else{
                                        console.log("insert success!")  
                                        }
                                    })
                                }
                                resolve(1)
                            }
                        })
                    })
                    let select_prob_id = await promise_select_prob_id
                    resolve(1)
                }
            })
        })
        let insert_problem_inside = await promise_insert_problem_inside
    }
    return Promise.resolve(1)
}

userRouter.post('/upload_exam', upload2.single('file'), async function(req,res){
    var dir = 'excel/exam_'+timestamp+'.xlsx'
    let workbook = xlsx.readFile(dir)
    let worksheet = workbook.Sheets["Sheet1"]
    let prob_json = xlsx.utils.sheet_to_json(worksheet)
    /*
     *  exam 삽입
     */
    
    let promise_insert_exam = new Promise((resolve,reject)=>{
        var sql = "insert into exam (title, vald_strt_dd, vald_end_dd, rgstr_id, updtr_id) values ?"
        var body = req.body
        var values = [[body.title,body.vald_strt_dd,body.vald_end_dd,body.rgstr_id,body.rgstr_id]]
        conn.query(sql,[values],function(err,result){
            if(err)res.send(500,err)
            else{
                var sql1 = "select max(exam_id) as exam_id from exam"
                conn.query(sql1,function(err,rows){
                    if(err)console.log(err)
                    console.log(rows)
                    var dir = 'imgs/exam' + rows[0].exam_id
                    console.log(dir)
                    !fs.existsSync(dir) && fs.mkdirSync(dir)
                    dir += '/prob'
                    !fs.existsSync(dir) && fs.mkdirSync(dir)
                    dir ='imgs/exam' + rows[0].exam_id + '/ans'
                    !fs.existsSync(dir) && fs.mkdirSync(dir)
                    resolve(1)
                })
            }
        })
    })
    let insert_exam = await promise_insert_exam

    /*
    *   현재 exam_id 값을 찾는다
    */
    
    let promise_find_exam_id = new Promise((resolve,reject)=>{
        var sql = "select max(exam_id) as exam_id from exam"
        conn.query(sql,function(err,rows,field){
            if(err)res.send(500,err)
            else{
                exam_id = rows[0].exam_id
                resolve(exam_id)
            }
        })
    })
    let exam_id = await promise_find_exam_id
    /*
     *  problem 삽입
     */

    let insert_problem = await insert_problem_func(prob_json,exam_id, res)
    await res.redirect('exam')
})




export default userRouter;