const Sib = require('sib-api-v3-sdk')
require('dotenv').config({ path: './config.env' })

const sendEmail = async (options) => {
    const client = Sib.ApiClient.instance

    const apiKey = client.authentications['api-key']
    apiKey.apiKey = process.env.API_KEY

    const tranEmailApi = new Sib.TransactionalEmailsApi()

    const sender = {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_NAME,
    }

    const receivers = [
        {
            email: options.to,
        },
    ]

    await tranEmailApi
        .sendTransacEmail({
            sender,
            to: receivers,
            subject: options.subject,
            htmlContent: options.text,
        })
        .then(console.log)
        .catch(console.log)
}

module.exports = sendEmail
