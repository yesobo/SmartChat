function isDeviceAllowed() {
  return navigator.userAgent.match(/iPhone/i);
}

module.exports = {
  isDeviceAllowed,
};
