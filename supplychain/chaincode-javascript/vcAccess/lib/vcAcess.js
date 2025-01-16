'use strict';

const { Contract } = require('fabric-contract-api');

class AccessCredentialContract extends Contract {

    /**
     * Crée un verifiable credential pour un stakeholder donné.
     * @param {Context} ctx - Le contexte de la transaction.
     * @param {string} did - Le DID du stakeholder.
     * @param {Array} permissions - Les permissions associées au credential.
     * @param {string} expirationDate - La date d'expiration du credential au format ISO.
     * @returns {string} - Le verifiable credential créé sous forme de chaîne JSON.
     */
    async createCredential(ctx, did, permissions, expirationDate) {
        // Vérification de l'entrée : s'assurer que tous les champs sont fournis
        if (!did || !permissions || !expirationDate) {
            throw new Error('Missing required fields: did, permissions, or expirationDate');
        }

        // Vérification que la date d'expiration est dans le futur
        const expirationTimestamp = new Date(expirationDate).getTime();
        if (expirationTimestamp <= Date.now()) {
            throw new Error('Expiration date must be in the future');
        }

        // Création du verifiable credential sous forme d'objet
        const vc = {
            did,
            permissions,
            expirationDate: expirationTimestamp,
            revoked: false // Initialement, le credential n'est pas révoqué
        };

        // Stockage du VC sur la blockchain avec le DID comme clé
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(vc)));
        return JSON.stringify(vc); // Retourne le VC créé en format JSON
    }

    /**
     * Vérifie l'existence et la validité d'un verifiable credential.
     * @param {Context} ctx - Le contexte de la transaction.
     * @param {string} did - Le DID du stakeholder.
     * @returns {Object} - Le verifiable credential vérifié.
     */
    async verifyCredential(ctx, did) {
        // Récupération du VC à partir de la blockchain
        const vcAsBytes = await ctx.stub.getState(did);
        if (!vcAsBytes || vcAsBytes.length === 0) {
            throw new Error(`Credential for DID ${did} does not exist`);
        }

        // Conversion des données récupérées en objet JSON
        const vc = JSON.parse(vcAsBytes.toString());

        // Vérification de la révocation
        if (vc.revoked) {
            throw new Error(`Credential for DID ${did} has been revoked`);
        }

        // Vérification de la date d'expiration
        const currentTime = Date.now();
        if (vc.expirationDate <= currentTime) {
            // Si le credential a expiré, le révoquer automatiquement
            await this.revokeCredential(ctx, did);
            throw new Error(`Credential for DID ${did} has expired and has been revoked`);
        }

        return vc; // Retourne le VC vérifié
    }

    /**
     * Révoque un verifiable credential.
     * @param {Context} ctx - Le contexte de la transaction.
     * @param {string} did - Le DID du stakeholder.
     * @returns {string} - Message confirmant la révocation.
     */
    async revokeCredential(ctx, did) {
        // Récupération du VC à partir de la blockchain
        const vcAsBytes = await ctx.stub.getState(did);
        if (!vcAsBytes || vcAsBytes.length === 0) {
            throw new Error(`Credential for DID ${did} does not exist`);
        }

        // Conversion des données récupérées en objet JSON
        const vc = JSON.parse(vcAsBytes.toString());

        // Marquer le VC comme révoqué
        vc.revoked = true;

        // Stockage de la révocation sur la blockchain
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(vc)));
        return `Credential for DID ${did} has been revoked`; // Retourne un message de confirmation
    }
}

module.exports = AccessCredentialContract;