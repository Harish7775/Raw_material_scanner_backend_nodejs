const axios = require("axios");
// const qs = require("qs");
const xml2js = require("xml2js");

const sendSms = async (toPhoneNumber, message) => {
  const params = {
    user: "srgent",
    password: "82cacb0ba7XX",
    senderid: "SRGETR",
    mobiles: toPhoneNumber,
    sms: message,
    accusage: 1,
  };

  try {
    const response = await axios.get("http://sms.smsmenow.in/sendsms.jsp", {
      params: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    //let msgdata;
    const parser = new xml2js.Parser({ explicitArray: false });
    parser.parseString(response.data, (err, result) => {
      if (err) {
        console.error("Error parsing XML:", err);
        throw err;
      }

      console.log("SMS sent successfully:", result);
      // msgdata = result
    });

    //await getDeliveryReport(msgdata.smslist.sms.messageid, msgdata.smslist.sms.clientsmsid)
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// const getDeliveryReport = async (messageId, clientsmsId) => {
//   try {
//     const response = await axios.get(`http://sms.smsmenow.in/getDLR.jsp`, {
//       params: {
//         userid: 'srgent',
//         password: '82cacb0ba7XX',
//         messageid: messageId,
//         clientsmsid: clientsmsId
//       },
//     });
//     console.log("Requested URL:", response.config.url);
//     console.log("response.data",response.data);

//     // const parser = new xml2js.Parser({ explicitArray: false });
//     // parser.parseString(response.data, (err, result) => {
//     //   if (err) {
//     //     console.error('Error parsing XML:', err);
//     //     throw err;
//     //   }
//     //   console.log('Delivery report:', result);
//     // });
//   } catch (error) {
//     console.error('Error fetching delivery report:', error);
//     throw error;
//   }
// };

module.exports = sendSms;
