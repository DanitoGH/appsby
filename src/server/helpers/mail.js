const nodemailer = require("nodemailer");

export function AppsbyMailSender(fromName, fromAddress) {

    this.sender = nodemailer.createTransport({

        host: global.mail.host,
        port: global.mail.port,
        secure: global.mail.isSecure, // true for 465, false for other ports
        auth: {
            user: global.mail.user, // generated ethereal user
            pass: global.mail.password, // generated ethereal password
        },
    });
    this.from = fromName;
    this.address = fromAddress;
    this.send = async (recipient, subject, text, html) => {
        let x = await this.sender.sendMail({
            from: `"${this.from}" <${this.address}>`, // sender address
            to: recipient, // list of receivers
            subject: subject, // Subject line
            text: text, // plain text body
            html: html, // html body
        })
    }

}
