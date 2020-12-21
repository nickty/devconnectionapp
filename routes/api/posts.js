const express = require('express')
const router = express.Router(); 
const {check, validationResult} = require('express-validator/check')
const auth  = require('../../middleware/auth')
const Post = require('../../models/Post');
const { remove } = require('../../models/Profile');
const Profile = require('../../models/Profile')
const User = require('../../models/User')


//@route    get api/users
// test     route 
// access   public
router.post('/', [auth, [
    check('text', 'Text is required')
    .not()
    .isEmpty()
]
],  async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }

    try {
        const user = await User.findById(req.user.id).select('-password')

        const newPost = new Post({
            text: req.body.text, 
            name: user.name, 
            avatar: user.avatar, 
            user: req.user.id
        })

        const post = await newPost.save()

        res.json(post)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
    


})



//@route    get api/post
// test     get all posts
// access   private

router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({date: -1})
        res.json(posts)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})



//@route    get api/posts/:id
// test     get post by id
// access   private

router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if(!post){
            return res.status(404).json({
                msg: 'Post not found'
            })
        }

        res.json(post)
    } catch (error) {
        console.error(error.message)
        if(error.kind == 'ObjectId'){
            return res.status(404).json({
                msg: 'Post not found'
            })
        }
        res.status(500).send('Server Error')
    }
});

//@route    DELETE api/posts/:id
// test     delete a post
// access   private

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)


        if(!post){
            return res.status(404).json({msg: 'Post not found'})
        }
        //check user 
        if(post.user.id.toString() != req.user.id){
            return res.status(401).json({msg: "user not autorized"})
        }

        post.remove(); 

        res.json({msg: 'Post removed'})

    } catch (error) {
        console.error(error.message)
        if(error.kind == 'ObjectId'){
            return res.status(404).json({
                msg: 'Post not found'
            })
        }
        res.status(500).send('Server Error')
    
    }
})

//@route    PUT api/posts/like/:id
// test     like a post
// access   private

router.put('/like/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        //if the post already liked by the user 
        if(post.like.filter(like => like.user.toString() === req.user.id).length > 0){
            return res.json(400).json({msg: 'Post already liked'})
        }

        post.likes.unshift({user: req.user.id})

        await post.save()

        res.json(post.like)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})


//@route    PUT api/posts/ullike/:id
// test     like a post
// access   private

router.put('/unlike/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        //if the post already liked by the user 
        if(post.like.filter(like => like.user.toString() === req.user.id).length === 0){
            return res.json(400).json({msg: 'Post not liked'})
        }

        //get the remove index
        const removeIndex = Post.likes.map(like => like.user.toString()).indexOf(req.user.id)

        post.likes.splice(removeIndex, 1)
        

        await post.save()

        res.json(post.likes)
        
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})


//@route    POST api/posts/comment/:id
// test     comment on a post
// access   private
router.post('/comment/:id', [auth, [
    check('text', 'Text is required')
    .not()
    .isEmpty()
]
],  async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }

    try {
        const user = await User.findById(req.user.id).select('-password')

        const post = await Post.findById(req.params.id)

        const newComment = {
            text: req.body.text, 
            name: user.name, 
            avatar: user.avatar, 
            user: req.user.id
        }

        post.comments.unshift(newComment)

        await post.save()

        res.json(post.comments)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
    


})

//@route    Delete api/posts/comment/:id/:comment_id
// test     Delete a commnet
// access   private

router.delete('/comment/:id/:comment_id', auth, async(req, res) => {
    try {

        const post = await Post.findById(req.params.id)

        //pull out comment from post 

        const comment = post.comments.find(comment => comment.id === req.params.comment_id)
        
        //make sure comment is exist 

        if(!comment) {
            return res.status(404).json({msg: 'comment does not exist'})
        }

        // check user 

        if(comment.user.toString() !== req.user.id )
        {
            return res.status(401).json({msg: 'comment does not authorized'})
        }

        const removeIndex = post.comments
        .map(comment = comment.user.toString())
        .indexOf(req.user.id)

        post.comments.splice(removeIndex, 1); 

        await post.save(); 

        res.json(post.comments)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})


module.exports = router; 