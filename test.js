var url = "Hello World";
var data = [];
for (var i = 0; i < url.length; i++){  
    data.push(url.charCodeAt(i));
}

console.log(Buffer.from(data).toString())