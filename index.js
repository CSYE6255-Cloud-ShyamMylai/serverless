const functions = require('@google-cloud/functions-framework');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const generateTemplate = require('./getTemplate');
const sequelize = require('./config/sequelize')
const User = require('./models/User');
require('dotenv').config();

// Create a Mailgun client with the provided API key
const mgClient = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });
// Register a CloudEvent callback with the Functions Framework that will
// be executed when the Pub/Sub trigger topic receives a message.
functions.cloudEvent('sendEmailVerification', async (cloudEvent) => {
  // The Pub/Sub message is passed as the CloudEvent's data payload.
  const base64name = cloudEvent.data.message.data;
  const messageData = base64name
    ? Buffer.from(base64name, 'base64').toString()
    : 'World';
  const { firstName, lastName, email, verificationToken } = JSON.parse(messageData)
  console.log(`Username: ${firstName} Email: ${email}`)
  console.log("token", verificationToken)
  try {
    const result = await mgClient.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `Webapp Org <mailgun@${process.env.MAILGUN_DOMAIN}>`,
      to: `${email}`,
      subject: "Email Verification",
      html: generateTemplate({
        firstName: firstName,
        lastName: lastName,
        email: email,
        verificationToken: verificationToken,
      }),
    });
    console.log(result.status, result.message);
    if (result.status === 200) {
      await sequelize.authenticate();
      await sequelize.sync();
      const user = await User.findOne({ where: { username: email } });
      if (user) {
        console.log("User found");
        const res = await user.update({ emailSentTimeStamp: new Date(),
        expiryTimeStamp: new Date(Date.now() + 2 * 60000) });
        console.log('User createdAt', res.dataValues.account_created);
        console.log('User updatedAt', res.dataValues.account_updated);
        console.log('User email sent at', res.dataValues.emailSentTimeStamp);
      }
      else {
        console.log("User not found");
      }
    }

  }
  catch (err) {
    console.log("Error", err);
  }

});
