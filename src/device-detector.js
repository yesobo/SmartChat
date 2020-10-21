function isDeviceAllowed() {
  // return navigator.userAgent.match(/iPhone/i);
  return window.innerHeight > window.innerWidth;
}

module.exports = {
  isDeviceAllowed,
};
