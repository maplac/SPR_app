const fs = require('fs');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
var contestants_file = '2022_spr_contestants.json';
var settings_file = '2022_spr_settings.json';
var csv_file = '2022_spr_export.csv';
var contestants = [];
var settings = {};


var server = app.listen(80, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})

app.use(express.static('./'));

app.get('/', function (req, res) {
   res.redirect('/editor.html');
})

app.get('/add', function (req, res) {
   var id = 0;
   contestants.forEach(e => {
      if (e.id > id) {
         id = e.id;
      }
   });
   id++;
   var reply = '{' + replyToStringSimple('ok', '') + ',\
      "contestant": {\
         "id": "' + id + '",\
         "sex": "male",\
         "runcount": 1\
      }\
   }';
   res.send(reply);
})
app.get('/edit', function (req, res) {
   var id = parseInt(req.query.id);
   if (isNaN(id)) {
      res.send(replyToString('error', 'parsing id failed'));
      return;
   }
   var con = {};
   contestants.forEach(e => {
      if (e['id'] == id) {
         con = e;
      }
   });
   if (!con.id) {
      res.send(replyToString('error', 'requested id does not exist'));
      return;
   }
   var reply = '{' + replyToStringSimple('ok', '') + ',\
      "contestant":' + JSON.stringify(con) + '}';
   res.send(reply);
})
app.post('/edit', function (req, res) {
   
   var con = {};
   con['name'] = req.body.name;
   con['surname'] = req.body.surname;
   con['sex'] = req.body.sex;
   con['club'] = req.body.club;

   // id
   var id = parseInt(req.body.id);
   if (isNaN(id)) {
      res.send(replyToString('error', 'parameter id is not an integer'));
      return;
   }
   con['id'] = id;

   // year
   var year = parseInt(req.body.year);
   if (isNaN(year)) {
      res.send(replyToString('error', 'parameter year is not an integer'));
      return;
   }
   if (year < 100) {
      if (year > (settings.year - 2000)) {
         year += 1900;
      } else {
         year += 2000;
      }
   }
   if (year < 1900 || year > settings.year) {
      res.send(replyToString('error', 'parameter year is out of range: ' + year));
      return;
   }
   con['year'] = year;

   // runcount
   var runcount = parseInt(req.body.runcount);
   if (isNaN(runcount)) {
      res.send(replyToString('error', 'parameter runcount is not an integer'));
      return;
   }
   con['runcount'] = runcount;

   // speed
   con['speed'] = [];
   for (var i = 0; i < 5; i++) {
      var speed = req.body['speed' + i.toString()];
      if (speed) {
         speed = parseInt(speed);
         if (isNaN(speed)) {
            res.send(replyToString('error', 'parameter speed# is not an integer: ' + speed));
            return;
         }
         con.speed.push(speed);
      }
   }

   //res.send(replyToString('error', 'debuging'));return;

   // edit existing contestant or create a new one
   var exists = false;
   contestants.forEach(e => {
      if (id === parseInt(e.id)) {
         exists = true;
         //e = con;
         e.id = con.id;
         e.name = con.name;
         e.surname = con.surname;
         e.year = con.year;
         e.sex = con.sex;
         e.club = con.club;
         e.runcount = con.runcount;
         e.speed = [];
         for (i = 0; i < con.speed.length; i++) {
            e.speed.push(con.speed[i]);
          }
      }
   });
   if (!exists) {
      contestants.push(con);
   }
  
   var save_res = saveContestants();
   if (save_res) {
      res.send(replyToString(save_res.status, save_res.message));
   } else {
      if (exists) {
         res.send(replyToString('ok', 'závodník upraven'));
      } else {
         res.send(replyToString('ok', 'nový závodník vytvořen'));
      }
   }
})

app.post('/exportcsv', function (req, res) {
   var cons = getContestantsComplete();
   try {
      var str = '"ID","Jméno","Příjmení","Kategorie","Klub","Běh 1","Běh 2","Běh 3","Běh 4","Běh 5","Nejrychlejší","Pořadí celkové","Pořadí v kategorii"\n';
      cons.forEach(e => {
         str += e.id + ',"' + e.name + '","' + e.surname + '","' + e.category + '","' + e.club + '",';
         for (var i = 0; i < 5; i++) {
            if (i < e.speed.length) {
               str += e.speed[i];
            }
            str += ',';
         }
         if (e.maxSpeed > -1) {
            str += e.maxSpeed;
         }
         str += ',';
         if (e.order > -1) {
            str += e.order;
         }
         str += ',';
         if (e.orderCat > -1) {
            str += e.orderCat;
         }
         str += '\n';
      });
      fs.writeFileSync(csv_file, str);// encoding in Windows-1250 would be better
   } catch (err) {
      console.log(err);
      
      res.send(replyToString('error', 'Exporting to CSV file failed.'));
      return;
   }
   res.send( '{' + replyToStringSimple('ok', 'Soubor vytvořen.') + ',\
   "filePath":"' + csv_file + '"}');
})

app.get('/contestants', function (req, res) {
   var cons = getContestantsComplete();
   var reply = '{' + replyToStringSimple('ok', '') + ',\
      "contestants":' + JSON.stringify(cons) + '}';
   res.send(reply);
})

app.get('/scoreboard', function (req, res) {
   var cons = getContestantsComplete();
   cons.sort((a, b) => (a.maxSpeed > b.maxSpeed) ? -1 : 1);
   cons.forEach(e => {
      delete e.runcount;
      delete e.speed;
      delete e.club;
      if (settings.colors[e.category]) {
         e['color'] = settings.colors[e.category];
      } else {
         e['color'] = '';
      }
   });
   var reply = '{' + replyToStringSimple('ok', '') + ',\
      "contestants":' + JSON.stringify(cons) + ', "groups":' + JSON.stringify(settings.groups) + '}';
   res.send(reply);
})

function getContestantsComplete() {
   var cons = contestants.map(a => Object.assign({}, a));
   var consOrdered = [];
   cons.forEach(e => {
      e['category'] = selectCategory(e.sex, e.year);
      e['maxSpeed'] = -1;
      e.speed.forEach(s => {
         if (s > e['maxSpeed']){
            e['maxSpeed'] = s;
         }
      });
      e['order'] = -1;
      e['orderCat'] = -1;
      delete e.sex;
      delete e.year;
      if (e.maxSpeed >= 0) {
         consOrdered.push({
            "id": e.id,
            "category": e.category,
            "maxSpeed": e.maxSpeed
         });
      }
   });
   consOrdered.sort((a, b) => (a.maxSpeed > b.maxSpeed) ? -1 : 1);
   var currenMaxSpeed = -1;
   var currentOrderNum = 0;
   var catOrders = {};
   for (var i = 0; i < consOrdered.length; i++) {
      for (var j = 0; j < cons.length; j++) {
         if (consOrdered[i].id === cons[j].id) {
            if (catOrders.hasOwnProperty(consOrdered[i].category)) {
               catOrders[consOrdered[i].category].i += 1;
               if(cons[j].maxSpeed !== catOrders[consOrdered[i].category].currenMaxSpeed) {
                  catOrders[consOrdered[i].category].currentOrderNum = catOrders[consOrdered[i].category].i;
                  catOrders[consOrdered[i].category].currenMaxSpeed = cons[j].maxSpeed;
               }
            } else {
               catOrders[consOrdered[i].category] = {'i': 0, 'currentOrderNum': 0, 'currentMaxSpeed': -1};
            }
            if (cons[j].maxSpeed !== currenMaxSpeed) {
               currentOrderNum = i;
               currenMaxSpeed = cons[j].maxSpeed;
            }
            cons[j].order = currentOrderNum + 1;
            cons[j].orderCat = catOrders[consOrdered[i].category].currentOrderNum + 1;
         }
      }
   }
   return cons;
}

function replyToString(status, message) {
   return '{"reply":{"status":"' + status + '","message":"' + message + '"}}'
}
function replyToStringSimple(status, message) {
   return '"reply":{"status":"' + status + '","message":"' + message + '"}'
}
function selectCategory(sex, year) {
   var group = '???';
   if (settings.groups.hasOwnProperty(sex)) {
      var age = settings.year - year;
      var groups = settings.groups[sex];
      groups.forEach(e => {
         if (age >= e.from && age <= e.to) {
            group = e.name;
         }
      });
   }
   return group;
}
function loadSettings() {
   try {
      const file = fs.readFileSync(settings_file);
      settings = JSON.parse(file.toString());
   } catch (err) {
      console.error(err);
      return { 'status': 'error', 'message': 'Loading contestant file failed.' };
   }
   settings.colors = {};
   for (var sex in settings.groups) {
      if (Object.prototype.hasOwnProperty.call(settings.groups, sex)) {
         settings.groups[sex].forEach(e => {
            settings.colors[e.name] = e.color;
         });
      }
   };
}
function loadContestants() {
   try {
      const file = fs.readFileSync(contestants_file);
      contestants = JSON.parse(file.toString());
   } catch (err) {
      console.error(err);
      return { 'status': 'error', 'message': 'Loading contestant file failed.' };
   }
   contestants.forEach(e => {
      //delete e.group;
   });
}
function saveContestants() {

   // copyFile requires newer version
   /*fs.copyFile(contestants_file, contestants_file + '-bckp', (err) => {
      if (err) {
         console.log(err);
         return { 'status': 'error', 'message': 'Creating backup copy failed.' };
      }
   });*/

   try {
      const file = fs.readFileSync(contestants_file);
      fs.writeFileSync(contestants_file + '-bckp', file.toString());
   } catch (err) {
      console.log(err);
      return { 'status': 'error', 'message': 'Creating backup copy failed.' };
   }
   try {
      fs.writeFileSync(contestants_file, JSON.stringify(contestants, null, 2));
   } catch (err) {
      console.log(err);
      return { 'status': 'error', 'message': 'Saving contestant file failed.' };
   }

   return loadContestants();
   //return { 'status': 'info', 'message': 'test' };
}

var res = loadSettings();
if (res) {
   console.log(res);
   process.exit();
}
res = loadContestants();
if (res) {
   console.log(res);
   process.exit();
}