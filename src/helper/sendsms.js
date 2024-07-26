require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSms = async (to, message) => {
  try {
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    console.log('Message sent successfully:', response.sid);
    return response.sid;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

module.exports = sendSms;

