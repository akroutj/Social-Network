// Récuperation du schema pour les messages
const Message = require('../models/Message');
const Comment = require('../models/Comment');

const jwt = require('jsonwebtoken');

// Récuperation du package FileSystem
const fs = require('fs');

// Logique metier - Récupération de toutes les messages
exports.getAllMessages = (req, res, next) => {
    
     Message.find().sort({date: -1})
    .then(messages => res.status(200).json(messages))
    .catch(error => res.status(400).json({ error }));
};


// Logique metier - Création d'un message
exports.createMessage = (req, res) => {
    // const messageObject = req.body.message;

    const message = new Message({
        ...req.body,
        imageUrl: req.file !== undefined ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : null,
      
    });
    message.save()
        .then(() => res.status(201).json({ message: 'Votre post est en ligne !' }))
        .catch(error => res.status(400).json({ error }));
};

// Logique metier - Modification d'un message
exports.modifyMessage= (req, res) => {
    let userId = req.body.userId;
    console.log(userId)
  
    Message.findOne({ _id: req.params.id })
       
        .then(message => {
            if (message.userId === userId) {
                
                Message.updateOne({ imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` })
                    .then(() => res.status(200).json({ message: 'Post modifiée !' }))
                    .catch(error => res.status(400).json({ error }));
            } else {
                res.status(401).json({ message: 'Requête non autorisée !' });
            }
        }).catch(error => res.status(500).json(console.log({ error})));
};

// Logique metier - Suppression d'un message
exports.deleteMessage = (req, res) => {

    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
    const userId = decodedToken.userId;

    
    Message.findOne({ _id: req.params.id })
        .then(message => {
            if (message.userId == userId) {
                const filename = message.imageUrl.split('/images/')[1];

                fs.unlink(`images/${filename}`, () => {
                    Message.deleteOne({ _id: req.params.id })
                        
                        .then(() => Comment.deleteMany({ messageId: req.params.id }).then((delComment) => console.log(delComment)))
                        .then(() =>  res.status(200).json({ message: 'Post supprimée !' }))
                        .catch(error => res.status(400).json({ error }));
                });
            } else {
                res.status(401).json({ message: 'Requête non autorisée !' });
            }
        })
        .catch(error => res.status(500).json({ error }));
};

// Logique metier - Likes & Dislikes
exports.likeMessage = (req, res) => {

    let like = req.body.like;
    let userId = req.body.userId;
    let messageId = req.params.id;

    // Like
    if (like == 1) {
        Message.findOne({ _id: messageId })
            .then((message) => {
                if (!message.usersLiked.includes(userId)) {
                    Message.updateOne(
                        //On récupère le post
                        { _id: messageId },
                        {
                            // on incrémente le compteur des likes de 1 & on push l'userId dans le tableau 
                            $inc: { likes: 1 },
                            $push: { usersLiked: userId }
                        }
                    )
                        .then(() => res.status(200).json({ message: 'Vous avez aimé ce post!' }))
                        .catch((error) => res.status(400).json({ error }));
                }
            })
            .catch((error) => res.status(400).json({ error }));
    }


    // Annulation Like 
    if (like === 0) {
        Message.findOne({ _id: messageId })
            .then((message) => {
                // Si le user a déjà liké la sauce
                if (message.usersLiked.includes(userId)) {
                    Message.updateOne(
                        { _id: messageId },
                        {
                            //On incrémente les likes de -1 
                            $inc: { likes: -1 },
                            // On retire le user du tableau des users ayant liké
                            $pull: { usersLiked: userId }
                        }
                    )
                        .then(() => res.status(200).json({ message: 'Votre avez retiré votre Like' }))
                        .catch((error) => res.status(400).json({ error }));
                }
            })
            .catch((error) => res.status(400).json({ error }));
    }
};
