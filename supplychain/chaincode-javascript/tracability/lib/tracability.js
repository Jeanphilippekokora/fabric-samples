'use strict';

const { Contract } = require('fabric-contract-api');

class TracabilityContract extends Contract {

    // Fonction pour créer des données de traçabilité
    async createData(ctx, id, did, dataType, value, additionalInfo) {
        if (!id || !did || !dataType || !value) {
            throw new Error('Invalid input: All parameters (id, did, dataType, value) are required.');
        }

        // Vérifier si l'identifiant existe déjà
        const existingData = await ctx.stub.getState(id);
        if (existingData && existingData.length > 0) {
            throw new Error(`Data with ID ${id} already exists.`);
        }

        // Obtenir la date actuelle automatiquement
        const date = new Date().toISOString();

        // Créer un objet de données avec les informations fournies
        const data = {
            id,                 // Identifiant unique
            date,               // Date de création
            did,                // Identifiant décentralisé
            dataType,           // Type de données (température, humidité, etc.)
            value,              // Valeur associée
            additionalInfo: additionalInfo || '', // Informations supplémentaires (facultatif)
        };

        // Convertir l'objet en JSON 
        const dataJSON = JSON.stringify(data);

        
        // Stocke le document DID dans la blockchain
        await ctx.stub.putState(id, Buffer.from(dataJSON));

        return { message: `Data with ID ${id} has been successfully created.` };
    }

    // Fonction pour lire des données de traçabilité
    async readData(ctx, id) {
        if (!id) {
            throw new Error('Invalid input: Parameter "id" is required.');
        }
        // Lire l'état de la blockchain pour l'identifiant donné
        const dataBytes = await ctx.stub.getState(id);
        if (!dataBytes || dataBytes.length === 0) {
            throw new Error(`Data with ID ${id} not found.`);
        }

        // Convertir le JSON en objet JavaScript et le retourner
        return JSON.parse(dataBytes.toString());
    }

}

module.exports = TracabilityContract;
