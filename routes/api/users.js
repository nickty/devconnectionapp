const express = require('express')
const router = express.Router(); 
const bcrypt = require('bcryptjs')
const gravatar = require('gravatar')
const {check, validationResult} = require('express-validator/check')

const User = require('../../models/User')

//@route    post api/users
// test     route 
// access   public
router.post('/', [
    check('name', 'Name is required').not()
    .isEmpty(), 
    check('email', 'please include a valie email').isEmail(), 
    check('password', 'please enter a password with 6 more characters').isLength({min:6})
], async (req, res) => {

    const errors = validationResult(req)

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }

    const {name, email, password } = req.body

    //console.log(req.body)

    try {

        //see if the user exist

        let user = await User.findOne({email})
        if(user){
            res.status(400).json({errors: [{msg: 'User Already Exists'}]})
        }

        //get user gravater

        const avatar = gravatar.url(email, {
            s:'200', 
            r:'pg', 
            d:'mm'
        })

     

        user = new User({
            name, 
            email, 
            avatar, 
            password
        });

        const salt = await bcrypt.genSalt(10); 
        user.password = await bcrypt.hash(password, salt)
       


        await user.save()

        //entrypt password 

        //return jsonwebtoken

        res.send("User Registered")
        
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }

    

    
})

module.exports = router; 