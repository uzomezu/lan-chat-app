const mongoose = require('mongoose');
const regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const validateEmail = (email) => {
    return regexEmail.test(email);
}
const userSchema = mongoose.Schema({
    email : {type : String, required: true, unique: true, trim: true, validate : [validateEmail, "Please fill with valid email address."], match: [regexEmail, "Please Fill with Valid Email Address"]},
    active : {type: Boolean, default: true},
    pass : {type: String, required: true},
    isAdmin : {type: Boolean, required: true, default: false},
    image: {type: String},
    bio : {type: String},
    followers : [{type: mongoose.Schema.Types.ObjectId, ref: "User"}]
})

const User = mongoose.model("User", userSchema);

module.exports = User;