const dns = require('dns')
const os = require("os");

// dns.promises.lookupService().then((res)=>{
//   console.log(res);
// })
async function zzz(params) {
console.log(dns.getServers())

  const { address } = await dns.promises.lookup(os.hostname(), {
  hints: dns.ADDRCONFIG
});
console.log(address);
const { hostname } = await dns.promises.lookupService(address, 0);
console.log(hostname);
}
// zzz()

