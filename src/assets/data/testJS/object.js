var book={};
//调用Object.defineProperties(对象名，要添加的属性)方法，为对象一次定义多个属性(1.数据属性)(2.访问器属性)
let _bookname = {
    value: '钢铁'
}
Object.defineProperties(book,{
//添加的两个数据属性(_year,edition)
_year:{//(_year)前面的下划线表示只能通过对象方法访问的属性
value:2004
},
edition:{
value:1
},
_bookname,
//添加了访问器属性(year)
year:{
//调用get方法读取属性
get:function(){
return this._year;
},
//调用set方法写入属性
set:function(newValue){
if (newValue>2004) {
this._year=newValue;
this.edition+=newValue-2004;
}
}
}
});
//测试
book.year=2005;//访问器属性常见方式，设置一个属性的值会导致其他属性发生变化
book.year_ = 2018
console.log(book._bookname)