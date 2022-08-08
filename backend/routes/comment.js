const express = require('express');

const router = express.Router();
const commentCtrl = require('../controllers/comment');

// Routes
router.get('/', commentCtrl.getAllComments);
router.get('/:articleId', commentCtrl.getCommentsByMessage);
router.post('/', commentCtrl.createComment);


module.exports = router;