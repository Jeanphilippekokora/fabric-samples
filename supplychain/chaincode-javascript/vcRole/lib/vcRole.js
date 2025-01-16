'use strict';

const { Contract } = require('fabric-contract-api');

class RoleCredentialContract extends Contract {

    /**
     * Crée un verifiable credential de rôle pour un stakeholder donné.
     * @param {Context} ctx - Le contexte de la transaction.
     * @param {string} did - Le DID du stakeholder.
     * @param {Array} roles - Les rôles associés au credential.
     * @param {string} issuedBy - L'autorité qui délivre le credential.
     * @returns {string} - Le verifiable credential de rôle créé sous forme de chaîne JSON.
     */

    async createAsset(ctx, assetID, color, size, owner, value) {
        const asset = {
            ID: assetID,
            Color: color,
            Size: size,
            Owner: owner,
            Value: value,
        };

        // Convertir l'actif en JSON et le stocker dans l'état de la blockchain
        await ctx.stub.putState(assetID, Buffer.from(JSON.stringify(asset)));
    }

    async createRoleCredential(ctx, did, roles, issuedBy) {
        // Vérification de l'entrée : s'assurer que tous les champs sont fournis
        if (!did || !roles || !issuedBy) {
            throw new Error('Missing required fields: did, roles, or issuedBy');
        }

        // Création du verifiable credential de rôle sous forme d'objet
        const vcRole = {
            did,
            roles,
            issuedBy,
            revoked: false, // Initialement, le credential n'est pas révoqué
            revokedReason: null // Aucun motif de révocation initialement
        };

        // Stockage du VC de rôle sur la blockchain avec le DID comme clé
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(vcRole)));
        return JSON.stringify(vcRole); // Retourne le VC de rôle créé en format JSON
    }

    /**
     * Vérifie l'existence et la validité d'un verifiable credential de rôle.
     * @param {Context} ctx - Le contexte de la transaction.
     * @param {string} did - Le DID du stakeholder.
     * @returns {Object} - Le verifiable credential de rôle vérifié.
     */
    async verifyRoleCredential(ctx, did) {
        // Récupération du VC de rôle à partir de la blockchain
        const vcRoleAsBytes = await ctx.stub.getState(did);
        if (!vcRoleAsBytes || vcRoleAsBytes.length === 0) {
            throw new Error(`Role credential for DID ${did} does not exist`);
        }

        // Conversion des données récupérées en objet JSON
        const vcRole = JSON.parse(vcRoleAsBytes.toString());

        // Vérification de la révocation
        if (vcRole.revoked) {
            throw new Error(`Role credential for DID ${did} has been revoked: ${vcRole.revokedReason}`);
        }

        return vcRole; // Retourne le VC de rôle vérifié
    }

    /**
     * Révoque un verifiable credential de rôle.
     * @param {Context} ctx - Le contexte de la transaction.
     * @param {string} did - Le DID du stakeholder.
     * @param {string} reason - Le motif de la révocation.
     * @returns {string} - Message confirmant la révocation.
     */
    async revokeRoleCredential(ctx, did, reason) {
        // Vérification du motif de révocation
        if (!reason) {
            throw new Error('Revocation reason is required');
        }

        // Récupération du VC de rôle à partir de la blockchain
        const vcRoleAsBytes = await ctx.stub.getState(did);
        if (!vcRoleAsBytes || vcRoleAsBytes.length === 0) {
            throw new Error(`Role credential for DID ${did} does not exist`);
        }

        // Conversion des données récupérées en objet JSON
        const vcRole = JSON.parse(vcRoleAsBytes.toString());

        // Marquer le VC de rôle comme révoqué et ajouter le motif
        vcRole.revoked = true;
        vcRole.revokedReason = reason;

        // Stockage de la révocation sur la blockchain
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(vcRole)));
        return `Role credential for DID ${did} has been revoked: ${reason}`; // Retourne un message de confirmation
    }
}

module.exports = RoleCredentialContract;