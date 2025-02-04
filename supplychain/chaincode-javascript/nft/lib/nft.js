'use strict';

const { Contract } = require('fabric-contract-api');

class NFTContract extends Contract {

    // Crée un nouveau NFT parent représentant une récolte
    async createHarvestNFT(ctx, id, owner, name, category, description, metadata, organicCertificate) {
        // Vérification que le NFT parent n'existe pas déjà
        const existingNFT = await ctx.stub.getState(id);
        if (existingNFT && existingNFT.length > 0) {
            throw new Error(`Le NFT parent avec l'ID ${id} existe déjà.`);
        }

        // Création de l'objet NFT parent
        const parentNFT = {
            id,                     // Identifiant unique du NFT parent
            owner,                  // Propriétaire actuel
            name,                   // Nom de la récolte
            category,               // Catégorie du produit
            description,            // Description de la récolte
            metadata,               // Métadonnées supplémentaires
            organicCertificate,     // Certificat biologique de la récolte
            type: 'parent',         // Type de NFT
            children: [],           // Liste des NFTs enfants liés à ce parent
            interactors: [owner],   // Liste des acteurs ayant possedé ce NFT
        };

        // Stockage du NFT parent dans la blockchain
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(parentNFT)));
        console.log(`NFT parent cree avec succes: ${id}`);
        return `NFT parent cree avec succes pour: ${name}`;
    }

    // Crée un NFT enfant à partir des données RFID et lie ce NFT à un NFT parent
    async createProductNFT(ctx, rfidId, parentId, owner, qrcode, metadata) {
        // Vérifier si un NFT enfant existe déjà pour cet RFID
        const existingNFT = await ctx.stub.getState(rfidId);
        if (existingNFT && existingNFT.length > 0) {
            throw new Error(`Un NFT enfant avec l'ID RFID ${rfidId} existe déjà.`);
        }

        // Récupérer le NFT parent pour validation
        const parentNFTBytes = await ctx.stub.getState(parentId);
        if (!parentNFTBytes || parentNFTBytes.length === 0) {
            throw new Error(`NFT parent non trouvé : ${parentId}`);
        }

        const parentNFT = JSON.parse(parentNFTBytes.toString());
        

        // Création du NFT enfant
        const childNFT = {
            id: rfidId,             // Identifiant unique du NFT enfant
            parentId,               // Référence au NFT parent
            qrcode,                 // Qr code associé au produit
            owner,                  // Propriétaire actuel du produit
            metadata: JSON.parse(metadata), // Métadonnées (ex. poids, grade)
            type: 'child',          // Type de NFT
            interactors: [owner],   // Liste des acteurs ayant interagi avec ce produit
        };

        // Lier le NFT enfant au parent
        parentNFT.children.push(rfidId);

        // Mise à jour du NFT parent avec la liste des enfants
        await ctx.stub.putState(parentId, Buffer.from(JSON.stringify(parentNFT)));

        // Stocker le NFT enfant sur la blockchain
        await ctx.stub.putState(rfidId, Buffer.from(JSON.stringify(childNFT)));

        console.log(`NFT enfant cree avec succes: ${rfidId}`);
        return `NFT enfant cree avec succes pour le produit ayant l'ID RFID: ${rfidId}`;
    }

    // Transfère la propriété d'un NFT (enfant ou parent) à un nouveau propriétaire
    async transferNFT(ctx, id, newOwner) {
        const nftBytes = await ctx.stub.getState(id);
        if (!nftBytes || nftBytes.length === 0) {
            throw new Error(`NFT non trouvé: ${id}`);
        }

        const nft = JSON.parse(nftBytes.toString());

        // Mise à jour du propriétaire
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

    // Récupère un NFT (parent ou enfant) par ID
    async readNFT(ctx, id) {
        const nftBytes = await ctx.stub.getState(id);
        if (!nftBytes || nftBytes.length === 0) {
            throw new Error(`NFT non trouvé: ${id}`);
        }

        const nft = JSON.parse(nftBytes.toString());
        return JSON.stringify(nft, null, 2);
    }

    // Récupère les enfants d'un NFT parent
    async getChildren(ctx, parentId) {
        const parentNFTBytes = await ctx.stub.getState(parentId);
        if (!parentNFTBytes || parentNFTBytes.length === 0) {
            throw new Error(`NFT parent non trouvé: ${parentId}`);
        }

        const parentNFT = JSON.parse(parentNFTBytes.toString());

        if (parentNFT.type !== 'parent') {
            throw new Error(`L'ID ${parentId} ne correspond pas à un NFT parent.`);
        }

        return parentNFT.children;
    }

    // Récupère la liste des interacteurs d'un NFT
    async getInteractors(ctx, id) {
        const nftBytes = await ctx.stub.getState(id);
        if (!nftBytes || nftBytes.length === 0) {
            throw new Error('NFT non trouvé: ${id}');
        }

        const nft = JSON.parse(nftBytes.toString());
        return nft.interactors;
    }
}

module.exports = NFTContract;
