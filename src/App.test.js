// import { render, screen } from '@testing-library/react';
// import App from './App';

// test('renders learn react link', () => {
//   render(<App />);
//   const linkElement = screen.getByText(/learn react/i);
//   expect(linkElement).toBeInTheDocument();
// });

import updater from './updater'
import BigInteger from "./jsbn"


function GetRandomValuesMock() {

  const mGetRandomValues = jest.fn().mockImplementation((arr) => {
    const key = "69d1dc0c167eef0791c29f8912cce27e15435aa63e4f47db0e391fd09a26180d"
    for (var i = 0; i < key.length; i += 2) {
      var value = parseInt(key.substring(i, i + 2), 16);
      arr[i >> 1] = (value < 128 ? value : value - 256);
    }
  });

  delete window.crypto
  window.crypto = { getRandomValues: mGetRandomValues }
}

describe('jsbn', () => {
  test('main', () => {
    const x = new BigInteger("abcd1234", 16);
    const y = new BigInteger("beef", 16);
    const z = x.mod(y)
    expect(z.toString(16)).toBe('b60c')
  })

  test('big-number', () => {
    const x = new BigInteger("69d1dc0c167eef0791c29f8912cce27e15435aa63e4f47db0e391fd09a26180d", 16);
    expect(x.toString(16)).toBe('69d1dc0c167eef0791c29f8912cce27e15435aa63e4f47db0e391fd09a26180d')
  })
});

describe('updater', () => {
  /**
   * privA: 69d1dc0c167eef0791c29f8912cce27e15435aa63e4f47db0e391fd09a26180d pubA: 7871cf79920f85aaf7da03e71b84227f267e6c3af38f23f4287d5cf94fdbd001 pub-b64: eHHPeZIPhar32gPnG4QifyZ+bDrzjyP0KH1c+U/b0AE=
   * privB: 1e741f9638b6fdbf89b0f30f3358ba89d9de1dbc08b66cf8b2e6e5e84287feee pubB: 56421a431645c818b18ad70a90e81b6d2fd99cf960f885c52f76b69ad647a528, pub-b64: VkIaQxZFyBixitcKkOgbbS/ZnPlg+IXFL3a2mtZHpSg=
   * ka: bdcc25073a7ef17edf80f4dbf571f0a8af50d1200dd5e75dae866065255ab71c kb: bdcc25073a7ef17edf80f4dbf571f0a8af50d1200dd5e75dae866065255ab71c
   * enc-msg-b64: +TGvAm7726fwzGNStXtvD3h80S+Sf8TTSLgC1n4Z5h4+XhQT7VcAtJA8awcCMoqZuk2CThyvcSf6bREdXxuAJWlAkyFUuhw25YM0Zb17mdJfjwhy2Dv2xR9r
   * orig-msg: {"u": "+4HEzCCj1dHHALicTrrs94bqdsBRjHWSEZtpSfkS1E4=", "c": "1iBWEhy24ndq0xuxs0QjHsRoH3I="} ('d62056121cb6e2776ad31bb1b344231ec4681f72', b'\xfb\x81\xc4\xcc \xa3\xd5\xd1\xc7\x00\xb8\x9cN\xba\xec\xf7\x86\xeav\xc0Q\x8cu\x92\x11\x9biI\xf9\x12\xd4N')
   */

  test('genPrivKey', () => {
    GetRandomValuesMock()
    const privKey = updater.genPrivKey()
    console.log('Private key:', privKey.toString(16))
    expect(typeof privKey).toBe("object")
    expect(privKey.toString(16) === '69d1dc0c167eef0791c29f8912cce27e15435aa63e4f47db0e391fd09a26180d').toBe(true)
    
  })

  test('calcPubKey', () => {
    const privKey = new BigInteger("69d1dc0c167eef0791c29f8912cce27e15435aa63e4f47db0e391fd09a26180d", 16)
    console.log('Private key:', privKey.toString(16))
    const pubKey = updater.calcPubKey(privKey)
    console.log('Public key:', pubKey.toString(16))
    //privA: 69d1dc0c167eef0791c29f8912cce27e15435aa63e4f47db0e391fd09a26180d pubA: 7871cf79920f85aaf7da03e71b84227f267e6c3af38f23f4287d5cf94fdbd001
    expect(typeof pubKey).toBe("object")
    expect(pubKey.toString(16) === '7871cf79920f85aaf7da03e71b84227f267e6c3af38f23f4287d5cf94fdbd001').toBe(true)
  })

  test('calcSharedKey', () => {
    const privKeyA = new BigInteger("69d1dc0c167eef0791c29f8912cce27e15435aa63e4f47db0e391fd09a26180d", 16)
    const pubKeyA = updater.calcPubKey(privKeyA)

    //privA: 69d1dc0c167eef0791c29f8912cce27e15435aa63e4f47db0e391fd09a26180d pubA: 7871cf79920f85aaf7da03e71b84227f267e6c3af38f23f4287d5cf94fdbd001
    console.log('Private key A:', privKeyA.toString(16))
    console.log('Public key A:', pubKeyA.toString(16))

    expect(typeof pubKeyA).toBe("object")
    expect(pubKeyA.toString(16) === '7871cf79920f85aaf7da03e71b84227f267e6c3af38f23f4287d5cf94fdbd001').toBe(true)
    const pubAb64 = updater.key2b64(pubKeyA)
    expect(pubAb64 === 'eHHPeZIPhar32gPnG4QifyZ+bDrzjyP0KH1c+U/b0AE=').toBe(true)

    //privB: 1e741f9638b6fdbf89b0f30f3358ba89d9de1dbc08b66cf8b2e6e5e84287feee pubB: 56421a431645c818b18ad70a90e81b6d2fd99cf960f885c52f76b69ad647a528,
    const privKeyB = new BigInteger("1e741f9638b6fdbf89b0f30f3358ba89d9de1dbc08b66cf8b2e6e5e84287feee", 16)
    const pubKeyB = updater.calcPubKey(privKeyB)

    console.log('Private key B:', privKeyB.toString(16))
    console.log('Public key B:', pubKeyB.toString(16))
    const pubBb64 = updater.key2b64(pubKeyB)
    expect(pubBb64 === 'VkIaQxZFyBixitcKkOgbbS/ZnPlg+IXFL3a2mtZHpSg=').toBe(true)  

    expect(typeof pubKeyB).toBe("object")
    expect(pubKeyB.toString(16) === '56421a431645c818b18ad70a90e81b6d2fd99cf960f885c52f76b69ad647a528').toBe(true)

    const sharedA = updater.calcSharedKey(updater.b642key(pubBb64), privKeyA)
    expect(typeof sharedA).toBe("object")
    console.log('Shared A:', sharedA.toString(16))
    expect(sharedA.toString(16) === 'bdcc25073a7ef17edf80f4dbf571f0a8af50d1200dd5e75dae866065255ab71c').toBe(true)

    const sharedB = updater.calcSharedKey(updater.b642key(pubAb64), privKeyB)
    expect(typeof sharedB).toBe("object")
    console.log('Shared B:', sharedB.toString(16))
    expect(sharedB.toString(16) === 'bdcc25073a7ef17edf80f4dbf571f0a8af50d1200dd5e75dae866065255ab71c').toBe(true)
    
    expect(sharedB.toString(16) === sharedA.toString(16)).toBe(true)
  });

  test('composeMsg', ()=> {
    const ret = updater.composeMsg('d62056121cb6e2776ad31bb1b344231ec4681f72', 'fb81c4cc20a3d5d1c700b89c4ebaecf786ea76c0518c7592119b6949f912d44e')
    expect(typeof ret).toBe('string')
    console.log('Compose msg: ',ret)
    expect(ret).toBe('{"u":"+4HEzCCj1dHHALicTrrs94bqdsBRjHWSEZtpSfkS1E4=","c":"1iBWEhy24ndq0xuxs0QjHsRoH3I="}')
  });

  test('encryptMsg', ()=> {
    const shared =  new BigInteger('bdcc25073a7ef17edf80f4dbf571f0a8af50d1200dd5e75dae866065255ab71c', 16)
    const msg = '{"u": "+4HEzCCj1dHHALicTrrs94bqdsBRjHWSEZtpSfkS1E4=", "c": "1iBWEhy24ndq0xuxs0QjHsRoH3I="}'
    const ret = updater.encryptMsg(msg, shared)
    // enc-msg-b64: +TGvAm7726fwzGNStXtvD3h80S+Sf8TTSLgC1n4Z5h4+XhQT7VcAtJA8awcCMoqZuk2CThyvcSf6bREdXxuAJWlAkyFUuhw25YM0Zb17mdJfjwhy2Dv2xR9r
    console.log('Encrypted msg: ',ret)
    expect(typeof ret).toBe('string')
    expect(ret).toBe('+TGvAm7726fwzGNStXtvD3h80S+Sf8TTSLgC1n4Z5h4+XhQT7VcAtJA8awcCMoqZuk2CThyvcSf6bREdXxuAJWlAkyFUuhw25YM0Zb17mdJfjwhy2Dv2xR9r')
  })

  test('decryptMsg',()=> {
    const shared =  new BigInteger('bdcc25073a7ef17edf80f4dbf571f0a8af50d1200dd5e75dae866065255ab71c', 16)
    const msg = '+TGvAm7726fwzGNStXtvD3h80S+Sf8TTSLgC1n4Z5h4+XhQT7VcAtJA8awcCMoqZuk2CThyvcSf6bREdXxuAJWlAkyFUuhw25YM0Zb17mdJfjwhy2Dv2xR9r'
    const ret = updater.decryptMsg(msg, shared)
    console.log('Decrypted msg: ',ret)
    expect(typeof ret).toBe("string") 
    expect(ret).toBe('{"u": "+4HEzCCj1dHHALicTrrs94bqdsBRjHWSEZtpSfkS1E4=", "c": "1iBWEhy24ndq0xuxs0QjHsRoH3I="}')
  })

});