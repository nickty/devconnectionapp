const express = require('express')
const router = express.Router() 
const auth = require('../../middleware/auth')

const profile = require('../../models/Profile')
const user = require('../../models/User')

const {check, validationResult} = require('express-validator/check')
const Profile = require('../../models/Profile')

//@route    get api/profile/me
// desk     get currenntly user profile
// access   Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await profile.findOne({user:req.user.id}).populate('user', ['name', 'avatar'])
        
        if(!profile) {
            return res.status(400).json({msg: 'There is no profile for this user'})
        }

        res.json(profile); 
    } catch (error) {
        console.error(err.message); 
        res.status(500).send('Server Error')
    }
})

//@route    get api/profile
// desk     create or update user profile
// access   Private

router.post('/', [auth, [
    check('status', 'Status is requied')
        .not()
        .isEmpty(), 
    check('skills', 'Skills is required')
        .not()
        .isEmpty()
    ]
],  async (req, res) => {
    const errors = validationResult(req) 
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() })
    }

    //console.log(req.body)

    const {
        company, 
        website, 
        location, 
        bio, 
        status, 
        githubusername, 
        skills, 
        youtube, 
        facebook, 
        twitter, 
        instagram, 
        linkedin
    } = req.body

    const profileFields = {};
    profileFields.user = req.user.id 
    if(company) profileFields.company = company
    if(website) profileFields.website = website
    if(location) profileFields.location = location
    if(bio) profileFields.bio = bio
    if(status) profileFields.status = status
    if(githubusername) profileFields.githubusername = githubusername

    //console.log(profileFields)

    if(skills){
        //console.log(123)
        profileFields.skills = skills.split(',').map(skill => skill.trim()); 
    }

    //console.log(profileFields.skills)

    //Build the social object
    profileFields.social = {}
    if(youtube) profileFields.social.youtube = youtube
    if(twitter) profileFields.social.twitter = twitter
    if (facebook) profileFields.social.facebook = facebook
    if(linkedin) profileFields.social.linkedin = linkedin
    if(instagram) profileFields.social.instagram = instagram


    try {

        let profile = await Profile.findOne({user: req.user.id}); 

        if(profile){
            //update
            profile = await Profile.findOneAndUpdate({user: req.user.id}, {$set: profileFields}, {new:true})

            return res.json(profile)
        }

        //create
        profile = new Profile(profileFields)
        await profile.save() 
        res.json(profile)
        
    } catch (error) {
       console.error(error.message)
       res.status(500).send('Server Error') 
    }

    res.send("hello")
})

module.exports = router; 