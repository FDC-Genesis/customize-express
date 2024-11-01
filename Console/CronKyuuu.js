const NodeMailer = require("../vendor/node-mailer");
const cron = require("node-cron");

const mailer = new NodeMailer();

cron.schedule('*/10 * * * * *', async () => {
    let data = {
        to: "moniqueerezo98@gmail.com",
        header: "Reminder",
        content: "Tubaga ako tawag",
        subject: "Example ni sa pang reminders"
    };

    await mailer.sendMail(data);
});

console.log("Cron job is running...");
