(function () {
  freeboard.loadWidgetPlugin({
    type_name: "psh",
    display_name: "Freeboard Python Shell",
    description: "A Python shell for Freeboard",
    external_scripts: ["psh.js"],
    fill_size: false,
    settings: [],

    newInstance: function (settings, newInstanceCallback) {
      newInstanceCallback(new Psh(settings));
    },
  });

  var Psh = function (settings) {
    var self = this;
    var currentSettings = settings;
    var terminal = new psh();

    self.render = function (containerElement) {
      $(containerElement).append(terminal.htmlElement);
    };

    self.getHeight = function () {
      return 5;
    };

    self.onSettingsChanged = function (newSettings) {
      currentSettings = newSettings;
    };

    self.onCalculatedValueChanged = function (settingName, settingValue) {};

    self.onDispose = function () {};
  };
})();
