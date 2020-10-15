module.exports = {
  _activeChannel: undefined,
  get activeChannel() {
    return this._activeChannel;
  },
  set activeChannel(value) {
    console.log(`setting activeChannel to ${value}`);
    this._activeChannel = value;
  },
  identity: null,
  activeChannelPage: undefined,
};
