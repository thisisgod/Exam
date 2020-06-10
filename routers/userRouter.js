import express from "express";

const userRouter = express.Router();

userRouter.get('/',function(req,res,next){
    res.render('home');
});

export default userRouter;