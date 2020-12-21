const express = require('express')
const router = express.Router() 
const auth = require('../../middleware/auth')
const request = require('request')
const profile = require('../../models/Profile')
const user = require('../../models/User')
const config = require('config')
const {check, validationResult} = require('express-validator/check')
const Profile = require('../../models/Profile')
const User = require('../../models/User')

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

//@route    get api/profile
// desk     Get All profiles
// access   public

router.get('/', async (req, res) => {
    try {

        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        res.json(profiles)
        
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error') 
    }
})

//@route    get api/profile/user/:user_id
// desk     Get All profile by user id
// access   public

router.get('/user/:user_id', async (req, res) => {
    try {

        const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name', 'avatar'])

        if(!profile) return res.status(400).json({ msg: 'There is no profile for this user'})


        res.json(profile)
        
    } catch (err) {
        console.error(err.message)
        if(err.kind=='ObjectId'){
            return res.status(400).json({ msg: 'There is no profile for this user'})
        }
        res.status(500).send('Server Error') 
    }
})

//@route    delete api/profile
// desk     Get All profile by user id
// access   public

router.delete('/', auth, async (req, res) => {
    try {

        await Profile.findByIdAndRemove({user: req.user_id})

        await User.findByIdAndRemove({_id: req.user.id})

        res.json({msg: 'User Deleted'})
        
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error') 
    }
})


//@route    PUT api/profile/experience
// desk     Get profile experience
// access   private

router.put('/experience', [auth, [
    check('title', 'Title is required')
    .not()
    .isEmpty(), 
    check('company', 'company is required')
    .not()
    .isEmpty(), 
    check('from', 'from date is required')
    .not()
    .isEmpty()
]], async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    const {
        title, 
        company, 
        location, 
        from, 
        to, 
        current, 
        description
    } = req.body

    const newExp = {
        title, 
        company, 
        location, 
        from,
        to, 
        current, 
        description
    }

    try {
        const profile = await Profile.findOne({user:req.user.id})

        profile.experience.unshift(newExp)

        await profile.save()

        res.json(profile)
    } catch (error) {
        console.error(err.message)
        res.status(500).send('Server Error') 
    }
})


//@route    Delete api/profile/experience/:exp_id
// desk     Delete experience form profile
// access   private

router.delete('/exprience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user:req.user.id})

        //get the remove index
        const romoveIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)

        profile.experience.splice(removeIndex, 1)

        await profile.save(); 
        res.json(profile)

    } catch (error) {
        
    }
})


//@route    PUT api/profile/Education
// desk     Get profile Education
// access   private

router.put('/education', [auth, [
    check('school', 'school is required')
    .not()
    .isEmpty(), 
    check('degree', 'degree is required')
    .not()
    .isEmpty(), 
    check('fieldofstudy', 'fieldofstudy date is required')
    .not()
    .isEmpty(), 
    check('from', 'from date is required')
    .not()
    .isEmpty()
]], async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    const {
        school, 
        degree, 
        fieldofstudy, 
        from, 
        to, 
        current, 
        description
    } = req.body

    const newEdu = {
        school, 
        degree, 
        fieldofstudy, 
        from,
        to, 
        current, 
        description
    }

    try {
        const profile = await Profile.findOne({user:req.user.id})

        profile.education.unshift(newEdu)

        await profile.save()

        res.json(profile)
    } catch (error) {
        console.error(err.message)
        res.status(500).send('Server Error') 
    }
})


//@route    Delete api/profile/education/:exp_id
// desk     Delete education form profile
// access   private

router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user:req.user.id})

        //get the remove index
        const romoveIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id)

        profile.education.splice(removeIndex, 1)

        await profile.save(); 
        res.json(profile)
        
    } catch (error) {
        console.error(err.message)
        res.status(500).send('Server Error') 
    }
})

//@route    GET api/profile/github/:username
// desk     get user repos from github
// access   public

router.get('/github/:username', (req, res) => {
    
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${
                    config.get('githubClientId')}&client_secret=${
                        config.get('githubSecret')}`,
            method: 'GET', 
            headers: {'user-agent' : 'node.js'}

        }

        console.log(options)

        request(options, (error, response, body) => {
            if(error) console.error(error)

            if(response.statusCode !== 200) {
                return res.status(404).json({msg: 'No Github Profile found'})
            }

            res.json(JSON.parse(body))
        })
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error') 
    }
})

module.exports = router; 