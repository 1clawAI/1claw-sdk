/**
 * DPoP (Demonstration of Proof-of-Possession) manager.
 * Generates and manages an ephemeral keypair, produces DPoP proof JWTs per RFC 9449.
 */
export class DPoPManager {
    private keyPair: CryptoKeyPair | null = null;
    private publicJwk: JsonWebKey | null = null;
    private thumbprint: string | null = null;

    /**
     * Initialize the DPoP manager by generating an ephemeral P-256 keypair.
     * Call this once during client construction.
     */
    async init(): Promise<void> {
        this.keyPair = await crypto.subtle.generateKey(
            { name: "ECDSA", namedCurve: "P-256" },
            true,
            ["sign", "verify"],
        );
        this.publicJwk = await crypto.subtle.exportKey(
            "jwk",
            this.keyPair.publicKey,
        );
        this.thumbprint = await this.computeThumbprint(this.publicJwk);
    }

    /** Get the public JWK for sending to the server during token exchange. */
    getPublicJwk(): JsonWebKey {
        if (!this.publicJwk) throw new Error("DPoPManager not initialized");
        return this.publicJwk;
    }

    /** Get the JWK SHA-256 thumbprint (base64url). */
    getThumbprint(): string {
        if (!this.thumbprint) throw new Error("DPoPManager not initialized");
        return this.thumbprint;
    }

    /** Generate a DPoP proof JWT for the given HTTP method and URL. */
    async generateProof(method: string, url: string): Promise<string> {
        if (!this.keyPair || !this.publicJwk) {
            throw new Error("DPoPManager not initialized");
        }

        const header = {
            typ: "dpop+jwt",
            alg: "ES256",
            jwk: {
                kty: this.publicJwk.kty,
                crv: this.publicJwk.crv,
                x: this.publicJwk.x,
                y: this.publicJwk.y,
            },
        };

        const payload = {
            jti: crypto.randomUUID(),
            htm: method.toUpperCase(),
            htu: this.stripQuery(url),
            iat: Math.floor(Date.now() / 1000),
        };

        const headerB64 = this.base64url(JSON.stringify(header));
        const payloadB64 = this.base64url(JSON.stringify(payload));
        const signingInput = `${headerB64}.${payloadB64}`;

        const signature = await crypto.subtle.sign(
            { name: "ECDSA", hash: "SHA-256" },
            this.keyPair.privateKey,
            new TextEncoder().encode(signingInput),
        );

        const sigB64 = this.base64urlFromBuffer(signature);
        return `${signingInput}.${sigB64}`;
    }

    private async computeThumbprint(jwk: JsonWebKey): Promise<string> {
        // RFC 7638: canonical JSON with sorted keys for EC
        const canonical = JSON.stringify({
            crv: jwk.crv,
            kty: jwk.kty,
            x: jwk.x,
            y: jwk.y,
        });
        const hash = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(canonical),
        );
        return this.base64urlFromBuffer(hash);
    }

    private stripQuery(url: string): string {
        try {
            const u = new URL(url);
            return `${u.protocol}//${u.host}${u.pathname}`;
        } catch {
            return url.split("?")[0];
        }
    }

    private base64url(str: string): string {
        const bytes = new TextEncoder().encode(str);
        return this.base64urlFromBuffer(bytes.buffer as ArrayBuffer);
    }

    private base64urlFromBuffer(buf: ArrayBuffer): string {
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (const b of bytes) binary += String.fromCharCode(b);
        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }
}
