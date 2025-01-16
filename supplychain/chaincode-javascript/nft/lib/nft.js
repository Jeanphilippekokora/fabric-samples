'use strict';

const { Contract } = require('fabric-contract-api');

class NFTContract extends Contract {

    // Crée un nouveau NFT représentant un produit agricole
    async createNFT(ctx, id, owner, name, category, description, metadata, rfid, qrCode) {
        // Vérification que le NFT n'existe pas déjà
        const existingNFT = await ctx.stub.getState(id);
        if (existingNFT && existingNFT.length > 0) {
            throw new Error(`Le NFT avec l'ID ${id} existe déjà.`);
        }

        // Création de l'objet NFT
        const nft = {
            id,                     // Identifiant unique du NFT
            owner,                  // Propriétaire actuel du NFT
            name,                   // Nom du produit agricole
            category,               // Catégorie du produit (ex. : fruits, légumes)
            description,            // Description du produit
            metadata,               // Métadonnées supplémentaires (ex. : images, spécifications)
            rfid,                   // Étiquette RFID pour le suivi en temps réel
            qrCode,                 // QR code pour consultation des informations
            interactors: [owner],   // Liste des acteurs ayant interagi avec le NFT
        };

        // Stockage du NFT dans la blockchain
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(nft)));
        console.log(`NFT cree avec succes: ${id}`);
        return `NFT cree avec succes pour: ${name}`;
    }

    // Transfère la propriété d'un NFT à un nouveau propriétaire
    async transferNFT(ctx, id, newOwner) {
        // Vérification des autorisations
        const currentUser = ctx.clientIdentity.getID(); // Récupération de l'identité du demandeur
        const nftBytes = await ctx.stub.getState(id);
        if (!nftBytes || nftBytes.length === 0) {
            throw new Error(`NFT non trouvé: ${id}`);
        }

        // Conversion des bytes en objet NFT
        const nft = JSON.parse(nftBytes.toString());

        // Vérification que l'utilisateur actuel est le propriétaire
        if (nft.owner !== currentUser) {
            throw new Error(`Transfert non autorisé: vous n'êtes pas le propriétaire de ce NFT.`);
        }

        // Mise à jour du propriétaire du NFT
        nft.owner = newOwner;

        // Ajout du nouvel acteur propriétaire à la liste des interacteurs
        if (!nft.interactors.includes(newOwner)) {
            nft.interactors.push(newOwner);
        }

        // Mise à jour de l'état du NFT dans la blockchain
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(nft)));
        console.log(`NFT transféré avec succès: ${id} à ${newOwner}`);
        return `NFT transféré avec succès à: ${newOwner}`;
    }

    // Récupère un NFT par ID
    async readNFT(ctx, id) {
        // Récupération de l'état du NFT
        const nftBytes = await ctx.stub.getState(id);
        if (!nftBytes || nftBytes.length === 0) {
            throw new Error(`NFT non trouvé: ${id}`);
        }

        // Conversion des bytes en objet NFT
        const nft = JSON.parse(nftBytes.toString());
// Retourne l'objet NFT sous forme JSON
return JSON.stringify(nft, null, 2);
        //console.log(`NFT récupéré avec succès: ${id}`);
        //return nftBytes.toString();
    }

    // Récupère la liste des interacteurs d'un NFT
    async getInteractors(ctx, id) {
        const nftBytes = await ctx.stub.getState(id);
        if (!nftBytes || nftBytes.length === 0) {
            throw new Error(`NFT non trouvé: ${id}`);
        }

        const nft = JSON.parse(nftBytes.toString());
        console.log(`Liste des interacteurs récupérée pour le NFT: ${id}`);
        return nft.interactors;
    }
}

// Instanciation du chaincode
module.exports = NFTContract;