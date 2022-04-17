import { aesjs } from "aes-js"
import BigInteger from "./jsbn"


(function (root) {

    const P = new BigInteger("e9a67a666a6e27bc1e6c7fb0add5a0a290c3f69510515259a3c6a4338125c929", 16)
    const G = new BigInteger("858cb1d817b6b0ed1b3d5ae77f3ce04a19c9547eb4140104fe7ccd619dfc29ea", 16)
    const AES_NONCE = new Uint8Array([0x13, 0x0c, 0x95, 0xab, 0x27, 0x7f, 0x04, 0x6f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])

    /**
     * Generate 256bit private key
     * @returns BigINt
     */
    function genPrivKey() {
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
    function calcPubKey(priv) {
        return G.modPow(priv, P)
    }

    /**
     * Calculate shared key from remote public and current private
     * @param {BigInt} pub Public Key
     * @param {BigInt} priv Private key
     * @returns 
     */
    function calcSharedKey(pub, priv) {
        return pub.modPow(priv, P)
    }

    /**
     * @brief Converts Key into base64 string
     * @param {BigInteger} key 
     */
    function key2b64(key) {
        const hexstring = key.toString(16)
        return Buffer.from(hexstring, 'hex').toString('base64')
    }

    /**
     * Converts base64 key into BigInteger
     * @param {*} data 
     * @returns 
     */
    function b642key(data) {
       return new BigInteger(Buffer.from(data, 'base64').toString('hex'), 16)
    }

    /**
     * Encrypt AES
     * 
     * @param {Uint8Array} msg
     * @param {Uint8Array} key 
     * @param {Uint8Array} nonce
     */
    function encryptAES(msg, key, nonce = AES_NONCE) {
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
    function decryptAES(msg, key, nonce = AES_NONCE) {
        var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(nonce));
        return aesCtr.decrypt(msg);
    }

    /**
     * Convert shared number to AES key
     * @param {*} val 
     * @returns 
     */
    function convertKey(val) {
        function bnToHex(bn) {
            var base = 16;
            var hex = BigInt(bn).toString(base);
            if (hex.length % 2) {
                hex = '0' + hex;
            }
            return hex;
        }

        const fromHexString = hexString =>
            new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

        return fromHexString(bnToHex(val)).filter((v, i, a) => {
            return (i % 2) === 1;
        });
    }

    /**
     * encrypt Message
     * @param {*} msg 
     * @param {*} shared 
     * @returns 
     */
    function encryptMsg(msg, shared) {
        return window.atob(encryptAES(msg, convertKey(shared)))
    }

    /**
     * decrypt Message
     * @param {*} msg 
     * @param {*} shared 
     * @returns 
     */
    function decryptMsg(msg, shared) {
        return window.btoa(decryptAES(msg, convertKey(shared)))
    }


    var enc = {
        genPrivKey: genPrivKey,
        calcPubKey: calcPubKey,
        calcSharedKey: calcSharedKey,
        encryptAES: encryptAES,
        decryptAES: decryptAES,
        convertKey: convertKey,
        encryptMsg: encryptMsg,
        decryptMsg: decryptMsg,
        b642key: b642key,
        key2b64: key2b64
    };

    // node.js
    if (typeof exports !== 'undefined') {
        module.exports = enc

        // RequireJS/AMD
        // http://www.requirejs.org/docs/api.html
        // https://github.com/amdjs/amdjs-api/wiki/AMD
    } else {
        if (root.enc) {
            enc._enc = root.enc;
        }
        root.enc = enc;
    }
})(this);