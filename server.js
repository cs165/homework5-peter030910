const express = require('express');
const bodyParser = require('body-parser');
const googleSheets = require('gsa-sheets');

const key = require('./privateSettings.json');

// TODO(you): Change the value of this string to the spreadsheet id for your
// GSA spreadsheet. See HW5 spec for more information.
const SPREADSHEET_ID = '1g9kYGZjpqNMvbhp2b8MfeecJmCQ0XUmSpdSUEGYwn_s';


const app = express();
const jsonParser = bodyParser.json();
const sheet = googleSheets(key.client_email, key.private_key, SPREADSHEET_ID);

app.use(express.static('public'));

async function onGet(req, res) {
  const result = await sheet.getRows();
  const rows = result.rows;
  const obj = [];
  console.log(rows.length);
  for(var i=1;i<rows.length;i++){
    const json = {};
    for(var j=0;j<rows[0].length;j++){
      json[rows[0][j]] = rows[i][j];
    }
    obj.push(json);
  }
  res.json(obj);
}
app.get('/api', onGet);

async function onPost(req, res) {
  const messageBody = req.body;
  const result = await sheet.getRows();
  const rows = result.rows;
  console.log(JSON.stringify(messageBody));
  const appendArray = [rows[0].length];
  for(var key in messageBody){
    for(var i=0;i<rows[0].length;i++){
      if(key===rows[0][i]){
        appendArray[i] = messageBody[key];
      }
    }
  }
  console.log(appendArray);
  const status = sheet.appendRow(appendArray);
  status.then(resolve=()=>{res.json( {response:"success"});},reject=()=>{res.json( {error:"error connect"});});
}
app.post('/api', jsonParser, onPost);

async function onPatch(req, res) {
  const column  = req.params.column;
  const value  = req.params.value;
  const messageBody = req.body;
  const result = await sheet.getRows();
  const rows = result.rows;
  const setArray = [rows[0].length];
  let index = 0;
  for(var i=0;i<rows[0].length;i++){
    if(rows[0][i]===column){
      for(var j=1;j<rows.length;j++){
        if(rows[j][i]===value){
          setArray[i]=value;
          index = j;
          break;
        }
      }
    }
  }
  for(var key in messageBody){
    for(var i=0;i<rows[0].length;i++){
      if(key===rows[0][i]){
        setArray[i] = messageBody[key];
      }
    }
  }
  const status = sheet.setRow(index,setArray);
  status.then(resolve=()=>{res.json( {response:"success"});},reject=()=>{res.json( {response:"No match value"});});
}
app.patch('/api/:column/:value', jsonParser, onPatch);

async function onDelete(req, res) {
  const column  = req.params.column;
  const value  = req.params.value;
  const result = await sheet.getRows();
  const rows = result.rows;
  for(var i=0;i<rows[0].length;i++){
    if(rows[0][i]==column){
      for(var j=1;j<rows.length;j++){
        if(rows[j][i]==value){
          const status = sheet.deleteRow(j);
          status.then(resolve=()=>{res.json( {response:"success"});},reject=()=>{res.json( {response:"No match value"});});
          break;
        }
      }
    }
    else res.json({error:"No match column"});
  }
}
app.delete('/api/:column/:value',  onDelete);


// Please don't change this; this is needed to deploy on Heroku.
const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Server listening on port ${port}!`);
});
