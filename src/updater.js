import aesjs from "aes-js"
import BigInteger from "./jsbn"


const P = new BigInteger("e9a67a666a6e27bc1e6c7fb0add5a0a290c3f69510515259a3c6a4338125c929", 16)
const G = new BigInteger("858cb1d817b6b0ed1b3d5ae77f3ce04a19c9547eb4140104fe7ccd619dfc29ea", 16)
const AES_NONCE = new Uint8Array([0x13, 0x0c, 0x95, 0xab, 0x27, 0x7f, 0x04, 0x6f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])


class updater {

    /**
     * Generate 256bit private key
     * @returns BigINt
     */
    static genPrivKey() {
        const bytes = new Uint8Array(32);
        window.crypto.getRandomValues(bytes);
        const bytesHex = bytes.reduce((o, v) => o + ('00' + v.toString(16)).slice(-2), '');
        return new BigInteger(bytesHex, 16)
    }

    /**
     * Calculate public key from private
     * @param {*} priv 
     * @returns 
     */
    static calcPubKey(priv) {
        return G.modPow(priv, P)
    }

    /**
     * Calculate shared key from remote public and current private
     * @param {BigInt} pub Public Key
     * @param {BigInt} priv Private key
     * @returns 
     */
    static calcSharedKey(pub, priv) {
        return pub.modPow(priv, P)
    }

    /**
     * @brief Converts Key into base64 string
     * @param {BigInteger} key 
     */
    static key2b64(key) {
        const hexstring = key.toString(16)
        return Buffer.from(hexstring, 'hex').toString('base64')
    }

    /**
     * Converts base64 key into BigInteger
     * @param {*} data 
     * @returns 
     */
    static b642key(data) {
        return new BigInteger(Buffer.from(data, 'base64').toString('hex'), 16)
    }

    /**
     * Compose message from commit and user-id
     * @param {*} commit 
     * @param {*} userid 
     */
    static composeMsg(commit, userid) {
        return JSON.stringify({
            "u": Buffer.from(userid, 'hex').toString('base64'),
            "c": Buffer.from(commit, 'hex').toString('base64')
        })
    }

    /**
     * Encrypt AES
     * 
     * @param {Uint8Array} msg
     * @param {Uint8Array} key 
     * @param {Uint8Array} nonce
     */
    static encryptAES(msg, key, nonce = AES_NONCE) {
        if (typeof msg === "string") {
            msg = aesjs.utils.utf8.toBytes(msg);
        }

        var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(nonce));
        return aesCtr.encrypt(msg);
    }

    /**
     * Decrypt AES
     * @param {*} msg 
     * @param {*} key 
     * @param {*} nonce 
     * @returns 
     */
    static decryptAES(msg, key, nonce = AES_NONCE) {
        var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(nonce));
        return Buffer.from(aesCtr.decrypt(msg)).toString()
    }

    /**
     * Convert shared number to AES key
     * @param {*} val 
     * @returns 
     */
    static convertKey(val) {

        const fromHexString = hexString =>
            new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

        return fromHexString(val.toString(16)).filter((v, i, a) => {
            return (i % 2) === 1;
        });
    }

    /**
     * encrypt Message
     * @param {*} msg 
     * @param {*} shared 
     * @returns 
     */
    static encryptMsg(msg, shared) {
        return Buffer.from(this.encryptAES(msg, this.convertKey(shared))).toString('base64')
    }

    /**
     * decrypt Message
     * @param {*} msg 
     * @param {*} shared 
     * @returns 
     */
    static decryptMsg(msg, shared) {
        return this.decryptAES(Buffer.from(msg, 'base64'), this.convertKey(shared))
    }
}

export default updater
