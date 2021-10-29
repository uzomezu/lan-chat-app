function validator({email, pass}) {
    const regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    var errors = [];
    if(!/[A-Z]/.test(pass)) {
        errors.push("Password must have at least 1 Upper Case.");
    }
    if(!/[a-z]/.test(pass)) {
        errors.push("Password must have at least 1 Lower Case.");
    }
    if(!/\d/.test(pass)) {
        errors.push("Password must have at least 1 Number");
    }
    if(!/\W/.test(pass)) {
        errors.push("Passwords must have at least one Special Char. (!@#$%&*, etc.)");
    }
    if(pass.length < 8) {
        errors.push("Password must be at least 8 Characters Long.");
    }
    if(!regexEmail.test(email)){
        errors.push("Email Must follow syntax : user@email.com")
    }
    return errors;
}

module.exports = validator;