const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.USER,
            service: process.env.SERVICE,
            port: 465,
            secure: true,
            auth: {
                user: process.env.USER,   
                pass: process.env.PASS,     
            },
            tls: {
                rejectUnauthorized: false, 
            },
        });

        await transporter.sendMail({
            from: process.env.USER,
            to: email,
            subject: subject,
            text: text,
        });

        console.log("Email sent successfully");
        return true;
    } catch (error) {
        console.log("Error:", error.message, "Email not sent");
        return false;
    }
};

module.exports = sendEmail;
