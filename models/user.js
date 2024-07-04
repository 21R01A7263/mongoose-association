const mongoose = require('mongoose');   
mongoose.connect('mongodb+srv://roxlounge11:roxlounge11@cluster0.walxn7d.mongodb.net/association', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
    }]
})

module.exports = mongoose.model('user', userSchema);