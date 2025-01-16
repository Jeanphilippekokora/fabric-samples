'use strict';

const { Contract } = require('fabric-contract-api');

class DIDCertificateLinker extends Contract {
    // Fonction d'initialisation : appelée lors de l'installation du chaincode
    async initLedger(ctx) {
        console.log('Chaincode initialized');
    }

    // Fonction pour lier le certificat X.509 au document DID
    async linkCertificateToDID(ctx, did, x509Cert) {
        // Vérifier si le DID et le certificat X.509 sont fournis
        if (!did || !x509Cert) {
            throw new Error('Both DID and X.509 Certificate must be provided');
        }

        // Récupérer le document DID existant
        const didEntryBuffer = await ctx.stub.getState(did);
        if (!didEntryBuffer || didEntryBuffer.length === 0) {
            throw new Error(`DID ${did} not found`);
        }

        // Convertir le buffer en objet JSON
        const didEntry = JSON.parse(didEntryBuffer.toString());

        // Vérifier si le certificat est déjà lié
        if (didEntry.x509Cert) {
            throw new Error(`DID ${did} already has an X.509 Certificate linked.`);
        }

        // Lier le certificat X.509 au document DID
        didEntry.x509Cert = x509Cert;

        // Mettre à jour l'état du document DID avec le certificat
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(didEntry)));
        console.log(`Linked X.509 Certificate to DID: ${did}`);
    }

    // Fonction pour récupérer le document DID avec le certificat X.509
    async getDIDEntry(ctx, did) {
        const dataBuffer = await ctx.stub.getState(did);
        if (!dataBuffer || dataBuffer.length === 0) {
            return null; // DID non trouvé
        }
        const didEntry = JSON.parse(dataBuffer.toString());
        return didEntry; // Retourne l'entrée DID
    }
}

// Exporter le chaincode
module.exports = DIDCertificateLinker;