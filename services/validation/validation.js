let email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let username_regex = /.{4,}/;
let password_regex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}/;

const Validation = (() => {
    const SignUpDataValidation = async (data) => {
        let messages = [];
        if (!email_regex.test(data.email)) {
            messages.push('Email format invalid');
        }

        if (!username_regex.test(data.username)) {
            messages.push('Username invalid');
        }

        if (!password_regex.test(data.password)) {
            messages.push('Password format invalid');
        }

        if (email_regex.test(data.email) && username_regex.test(data.username) && password_regex.test(data.password)) {
            return {
                status: true
            };
        } else {
            return {
                status: false,
                messages: messages
            };
        }
    }

    return {
        SignUpDataValidation
    }
})();

module.exports = Validation;