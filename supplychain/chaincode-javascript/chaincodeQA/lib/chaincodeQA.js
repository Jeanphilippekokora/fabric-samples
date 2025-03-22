'use strict';

const { Contract } = require('fabric-contract-api');

class SupplyChainContract extends Contract {

    /**
     * Lire les données de traçabilité d'un produit si un Verifiable Credential Access valide est fourni.
     */
    async ReadTraceabilityData(ctx, productId, verifiableCredentialAccess) {
        const credentialValid = await this.VerifyVerifiableCredentialAccess(ctx, verifiableCredentialAccess);
        if (!credentialValid) {
            throw new Error('Access denied: Invalid or expired Verifiable Credential Access.');
        }
        
        const traceabilityData = await ctx.stub.getPrivateData('traceability-channel', productId);
        if (!traceabilityData || traceabilityData.length === 0) {
            throw new Error(`Traceability data for product ${productId} not found.`);
        }
        return traceabilityData.toString();
    }

    /**
     * Vérifier si les données de traçabilité d'un produit sont conformes aux normes spécifiées.
     */
    async VerifyCompliance(ctx, productId, standardId) {
        // Récupérer les données de traçabilité du produit
        const traceabilityData = await this.ReadTraceabilityData(ctx, productId);
        const parsedData = JSON.parse(traceabilityData);

        // Récupérer le standard correspondant
        const standardData = await ctx.stub.getState(standardId);
        if (!standardData || standardData.length === 0) {
            throw new Error(`Standard ${standardId} not found.`);
        }
        const parsedStandard = JSON.parse(standardData.toString());

        // Vérification globale : comparaison des objets
        const nonCompliantCriteria = Object.keys(parsedStandard).filter(key => parsedData[key] !== parsedStandard[key]);

        if (nonCompliantCriteria.length > 0) {
            return {
                compliant: false,
                message: `Product ${productId} does not comply with standard ${standardId}.`,
                failedCriteria: nonCompliantCriteria
            };
        }
        return { 
            compliant: true, 
            message: `Product ${productId} complies with standard ${standardId}.`
        };
    }

    /**
     * Délivrer un certificat de qualité si le produit respecte les normes.
     */
    async IssueQualityCertificate(ctx, productId, standardId, certificateId) {
        const complianceResult = await this.VerifyCompliance(ctx, productId, standardId);
        if (!complianceResult.compliant) {
            throw new Error(complianceResult.message);
        }

        const certificate = {
            certificateId,
            productId,
            standardId,
            issuedBy: 'Quality Insurance Organisation',
            timestamp: new Date().toISOString()
        };

        await ctx.stub.putPrivateData('product-channel', certificateId, Buffer.from(JSON.stringify(certificate)));
        return `Quality certificate ${certificateId} issued for product ${productId}`;
    }

    /**
     * Vérifier si un Verifiable Credential Access est valide.
     */
    async VerifyVerifiableCredentialAccess(ctx, verifiableCredentialAccess) {
        const credentialData = await ctx.stub.getState(verifiableCredentialAccess);
        if (!credentialData || credentialData.length === 0) {
            return false;
        }
        const parsedCredential = JSON.parse(credentialData.toString());
        
        // Vérifier si l'émetteur est autorisé
        if (parsedCredential.issuer !== 'Quality Insurance Organisation') {
            return false;
        }
        
        // Vérifier la date d'expiration
        const currentTime = new Date().toISOString();
        if (parsedCredential.expiryDate && parsedCredential.expiryDate < currentTime) {
            return false;
        }
        return true;
    }

    /**
     * Enregistrer une norme de qualité sur la blockchain.
     */
    async RegisterStandard(ctx, standardId, standardData) {
        await ctx.stub.putState(standardId, Buffer.from(standardData));
        return `Standard ${standardId} registered successfully.`;
    }

    /**
     * Demander un Verifiable Credential Access pour permettre au Quality Insurance Organisation de consulter les données.
     */
    async RequestVerifiableCredentialAccess(ctx, actorId, qualityOrgId, credentialId, expiryDate) {
        const credential = {
            credentialId,
            actorId,
            grantedTo: qualityOrgId,
            issuer: 'Quality Insurance Organisation',
            expiryDate,
            timestamp: new Date().toISOString()
        };
        await ctx.stub.putState(credentialId, Buffer.from(JSON.stringify(credential)));
        return `Verifiable Credential Access ${credentialId} issued to ${qualityOrgId}.`;
    }

    /**
     * Révoquer un Verifiable Credential Access.
     */
    async RevokeVerifiableCredentialAccess(ctx, credentialId) {
        await ctx.stub.deleteState(credentialId);
        return `Verifiable Credential Access ${credentialId} revoked.`;
    }
}

module.exports = SupplyChainContract;
