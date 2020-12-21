const TemplateTop = "<div style='background-color: #f4f4f4; padding: 25px;'><div style='border-radius: 10px; background-color: white; margin-left: auto; margin-right: auto; max-width: 400px; padding: 25px; -webkit-box-shadow: 0px 5px 25px -9px rgba(0,0,0,0.52); box-shadow: 0px 5px 25px -9px rgba(0,0,0,0.52);'><div style='margin-bottom: 15px;'><img style='display: block; max-width: 350px;' src='cid:logo1' alt='Everest Logo' title='Logo' width='200px' height='25px'></img></div><div style='height: 2px; width: 100%; border-radius: 10px; margin: 25px 0; background-color: rgba(0,0,0,0.1);'></div>";
const TemplateBottom = "<p>Cheers,<br>Everest Team</p></div></div>";                        

const EmailTemplate = (() => {
    const getForgetPassword = (data) => {
        try {
            const template = `
                        ${TemplateTop}
                        <p>Hello <b>${data.firstName} ${data.lastName}</b>,</p>
                        <p>You see to have forgotten your password. Here's the code you requested:</p>
                        <p style='font-size: 25px;'>${data.code}</p>
                        <p>This code will be valid for <b>1 hour</b></p>
                        ${TemplateBottom}`;

            return {
                error: false,
                data: template
            };
        } catch (err) {
            return {
                error: true,
                message: err.message
            }
        }
    };

    const getAcknowledgePasswordChanged = (data) => {
        try {
            const template = `
                        ${TemplateTop}
                        <p>Hello <b>${data.firstName} ${data.lastName}</b>,</p>
                        <p>You have successfully changed your password</p>
                        <p>If this was not done by you, please email us at <a href='mailto:rajsaha@tryeverest.app'>rajsaha@tryeverest.app</a></p>
                        ${TemplateBottom}`;

            return {
                error: false,
                data: template
            };
        } catch (err) {
            return {
                error: true,
                message: err.message
            }
        }
    };

    return {
        getForgetPassword,
        getAcknowledgePasswordChanged
    };
})();

module.exports = EmailTemplate;