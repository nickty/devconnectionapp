const express = require('express')
const router = express.Router(); 

//@route    get api/users
// test     route 
// access   public
router.get('/', (req, res) => res.send("Posts Route"))

module.exports = router; 