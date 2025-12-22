import { Crypt, RSA } from "hybrid-crypto-js";
const crypt = new Crypt({
  md: "sha256", // Options: sha1, sha256, sha384, sha512, and md5
});

export default async function VerifySignature(
  messageSignature,
  message,
  keyTag
) {
  
  const Message = crypt.verify(keyTag, messageSignature, message);

  return Message;
}
