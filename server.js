const express = require('express')
const mongoose = require('mongoose')
const Cowin = require('./dbCards')
const Cors = require('cors');
const nodemailer = require('nodemailer');
const moment = require('moment');
const fetch = require("node-fetch");


//App Config
const app = express();
const port = process.env.PORT || 8001;
const connection_url = 'mongodb+srv://admin:EeMpMIQYPzxdxWh8@cluster0.zhecp.mongodb.net/tinderDB?retryWrites=true&w=majority'

//Middlewares
app.use(express.json());
app.use(Cors());
//Db config


mongoose.connect(connection_url, {
    useNewUrlParser : true,
    useCreateIndex: true,
    useUnifiedTopology: true
})

//API endpoints
app.get("/", (req, res) => res.status(200).send("SUCCESS"))

app.post("/cowin/data", (req, res) => {
    const dbCard = req.body;
    
    Cowin.create(dbCard, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
})

setInterval(function(){
    Cowin.find((err, data) => {
        if (err) {
            console.log("Error found :" + err);
        } else {
            data.map(res => {
                const email = res.email;
                const pinCode = res.pinCode;
                const date = moment().add(1,'days').format('DD-MM-YYYY');
                
                //console.log(date);
                //let testAccount = nodemailer.createTestAccount();

                fetch("https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode="+pinCode+"&date="+date, {
                    method:"GET",
                    headers:{
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
                })
                .then(response => {
                    response.text().then(function (text) {
                        var  json = JSON.parse(text);
                        var length = json.sessions.length;

                        if (length > 0) {
                            json.sessions.map(data => {
                                const hospName = data.name;
                                const availableCapacity = data.available_capacity;
                                const vaccineName = data.vaccine;
                                const address = data.address;

                                // async..await is not allowed in global scope, must use a wrapper
                                async function main() {
                                    // Generate test SMTP service account from ethereal.email
                                    // Only needed if you don't have a real mail account for testing
                                    let testAccount = await nodemailer.createTestAccount();
                                    console.log(email);
                                    // create reusable transporter object using the default SMTP transport
                                    let transporter = nodemailer.createTransport({
                                        service: 'gmail',
                                        auth: {
                                            type: 'OAuth2',
                                            user: process.env.MAIL_USERNAME || 'cowinnotifierlp@gmail.com',
                                            pass: process.env.MAIL_PASSWORD || 'Sww@695HAU',
                                            clientId: process.env.OAUTH_CLIENTID || '971568967527-h5g6ofg3b8p0n5uj8k0busv7ke4b61nl.apps.googleusercontent.com',
                                            clientSecret: process.env.OAUTH_CLIENT_SECRET || 'F6u0JGCab9BCn4cuLcZpLgDi',
                                            refreshToken: process.env.OAUTH_REFRESH_TOKEN || '1//04j-D3XWgajMeCgYIARAAGAQSNwF-L9IrpdiXzRabPNl3Ne-fUIOu-qxTfdRMVnUS8A0jbBwPLjFL6i0goptEq4c-cp6aLcxHrSU'
                                        }
                                    });
                                
                                    // send mail with defined transport object
                                    let info = await transporter.sendMail({
                                    from: '"Vaccine Notifier 👻" <cowinnotifierlp@gmail.com>', // sender address
                                    to: email, // list of receivers
                                    subject: "Vaccine Update ✔", // Subject line
                                    text: "Hello world?", // plain text body
                                    html: "<b>Hospital :</b>" + hospName + "<br>Available Capacity : <b>" + availableCapacity
                                        + "<br><b>VaccineName :</b>" + vaccineName + "<br><b>Address :</b>" + address, // html body
                                    });
                                
                                    console.log("Message sent: %s", info.messageId);
                                    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                                
                                    // Preview only available when sending through an Ethereal account
                                    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                                    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
                                }
                                
                                main().catch(console.error);

                            })
                        }
                        
                      });
                });  
                
            });
        }
    })
}, 180000);

//Listeners
app.listen(port, () => console.log(`Listening on port : ${port}`))
