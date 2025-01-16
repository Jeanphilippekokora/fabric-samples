'use strict';

const { Contract } = require('fabric-contract-api');
const { Certificate } = require('@fidm/x509'); //  bibliothèque fidm/x509 pour le traitement des certificats

class IdentityContract extends Contract {

    // Crée un nouveau document DID
    async createDID(ctx, did, publicKey, metadata, x509Cert, role, organisation) {
        // Validation des entrées
        if (!did || !publicKey || !metadata || !x509Cert || !role || !organisation) {
            throw new Error('Tous les paramètres (did, publicKey, metadata, x509Cert, role, organisation) sont requis.');
        }

        // Vérifie si le DID existe déjà dans l'état de la chaîne
        const existingDID = await ctx.stub.getState(did);
        if (existingDID && existingDID.length > 0) {
            throw new Error(`DID déjà existant: ${did}`);
        }

        // Validation du certificat X.509
        if (!this.validateX509Cert(x509Cert)) {
            throw new Error('Certificat X.509 invalide.');
        }

        // Création de l'objet DID
        const didDocument = {
            did, // identifiant unique de l'acteur
            publicKey, // clé publique associée au DID de l'acteur
            metadata, // métadonnée relative à l'acteur
            x509Cert, // certificat d'authentification x.509
            role, // rôle de l'acteur
            organisation, // organisation de l'acteur
            createdAt: new Date().toISOString(),
        };

        const didJSON = JSON.stringify(didDocument);

        // Stocke le document DID dans la blockchain
        await ctx.stub.putState(did, Buffer.from(didJSON));
        console.log(`Document DID cree avec succes: ${did}`);
        return `Document DID cree avec succes pour: ${did}`;
    }

    // Récupère un document DID par DID
    async readDID(ctx, did) {
        // Récupération des données du document DID
        const didBytes = await ctx.stub.getState(did);
        if (!didBytes || didBytes.length === 0) {
            throw new Error(`Document DID ${did} non trouvé`);
        }

        console.log(`Document DID recupére avec succes: ${did}`);
        return didBytes.toString(); // Retourne les informations du document DID sous forme de chaîne
    }

    // Met à jour le certificat X.509 dans le document DID
    async updateDID(ctx, did, x509Cert) {
        // Validation des entrées
        if (!did || !x509Cert) {
            throw new Error('Les paramètres did et x509Cert sont requis.');
        }

        // Récupération du document DID existant
        const didBytes = await ctx.stub.getState(did);
        if (!didBytes || didBytes.length === 0) {
            throw new Error(`Document DID ${did} non trouvé`);
        }

        // Transformation des données du document en objet JavaScript
        const didDocument = JSON.parse(didBytes.toString());
        
        // Vérification de la validité du certificat x509
        if (!this.validateX509Cert(x509Cert)) {
            throw new Error('Certificat X.509 invalide.');
        }

        // Mise à jour du certificat X.509
        didDocument.x509Cert = x509Cert;

        // Conversion de l'objet mis à jour en chaîne JSON
        const didJSON = JSON.stringify(didDocument);
        await ctx.stub.putState(did, Buffer.from(didJSON)); // Stocke le document DID mis à jour
        console.log(`Document DID mis à jour avec succès: ${did}`);
        return `Document DID mis à jour avec succès pour: ${did}`;
    }

    // Validateur de certificat X.509
    validateX509Cert(cert) {
        try {
            // Convertir le certificat au format DER en base64
            const parsedCert = Certificate.fromPEM(Buffer.from(cert));

            // Vérifier si le certificat a expiré
            const now = new Date();
            if (now < parsedCert.validFrom || now > parsedCert.validTo) {
                console.log('Certificat expiré ou non encore valide');
                return false;
            }

            // Optionnel : Vérifier les extensions ou d'autres propriétés
            console.log('Certificat valide:');
            console.log(parsedCert.subject);

            return true;
        } catch (err) {
            console.error('Erreur lors de la validation du certificat X.509:', err);
            return false;
        }
    }
}

// Instanciation ou déploiement du chaincode
module.exports = IdentityContract;
