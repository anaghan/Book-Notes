import bodyParser from "body-parser";
import pg from "pg";
import express from "express";
import axios from "axios";
import env from "dotenv";
const app=express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
env.config();
const db=new pg.Client({
    host:process.env.PG_HOST,
    user:process.env.PG_USER,
    port:process.env.PG_PORT,
    password:process.env.PG_PASSWORD,
    database:process.env.PG_DATABASE
});
db.connect();
const API_URL="https://openlibrary.org/search.json";
const API_URL_IMG="https://covers.openlibrary.org/b/olid/"


let books=[];

async function push_books(){
    const result=await db.query("SELECT * FROM my_books");
    books=result.rows;
}

app.get("/", async(req,res)=>{
    await push_books();
    res.render("index.ejs",{books:books});
})

app.get("/search", async(req,res)=>{
    res.render("new_book.ejs");
})

app.post("/search",async(req,res)=>{
    let title=req.body["book_name"];
    try{
        const result=await axios.get(API_URL,{params:{q:title}});
        let docs=result.data.docs;
        res.render("new_book.ejs",{docs:docs,api_img:API_URL_IMG});
    }
    catch(err){
        console.log(err);
        res.render("new_book.ejs",{error:"Error fetching books",title:title});
    }
})



app.get("/delete", async(req,res)=>{
    await push_books();
    res.render("delete.ejs",{books:books});
})

app.post("/delete", async(req,res)=>{
    let del_olid=req.body.book_olid;
    if (Array.isArray(del_olid)){
        await db.query("DELETE FROM my_books WHERE olid= ANY($1)",[del_olid]);
    }
    else{
        await db.query("DELETE FROM my_books WHERE olid=($1)",[del_olid]);
    }
    res.redirect("/");
})

app.get("/review", async(req,res)=>{
    let olid=req.query.olid || req.body.olid;
    const result= await db.query("SELECT * FROM my_books WHERE olid=($1)",[olid]);
    let new_rec=1;
    let rec=result.rows[0];
    let authors=req.query.author_name ;
    authors=authors?decodeURIComponent(authors).split(','): rec.authors;
    
    if (rec!=undefined){
        let review=rec.review;
        let rating=rec.rating;
        let book_name=rec.name;
        let img=rec.img_url;
        new_rec=0;
        res.render("edit.ejs",{review:review,rating:rating,book_name:book_name,olid:olid,img:img,author_name:authors,new_rec:new_rec});
    }
    else{
        let pgArray= `{${authors.map(a => `"${a}"`).join(",")}}`;
        let book_name=req.query.title;
        let img=API_URL_IMG+olid+"-M.jpg";
        new_rec=1;
        res.render("edit.ejs",{book_name:book_name,img:img,author_name:authors,pgArray:pgArray,olid:olid,new_rec:new_rec});
    }
})

app.post("/review", async(req,res)=>{
    let is_new_rec=req.body.is_new_rec;
    let olid=req.body["olid"];
    let review=req.body["review_desc"];
    let rating=req.body["rating"];
    if (is_new_rec==0){
        await db.query("UPDATE my_books SET review=($1), rating=($2) WHERE olid=($3)",[review,rating,olid]);
    }
    else{
        let book_name=req.body.book_name;
        let img_url=req.body.img;
        let authors=req.body.pgArray;
        const result=await db.query("INSERT INTO my_books VALUES ($1,$2,$3,$4,$5,$6)",[olid,book_name,review,rating,img_url,authors]);
    }
    res.redirect("/");
})

app.listen(3000,()=>{
    console.log("Server is running");
})